import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { resolveDispatch } from "@/lib/history/read-dispatch";
import { publicQueryRun } from "@/lib/research/public-query-run";
import { mutationPrivacyContext, requestPrivacyActor } from "@/lib/run-privacy/auth";
import { privateRunResponse } from "@/lib/run-claims/private-response";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { consumeDurablePoint } from "@/lib/rate-limit-store";
import { isReppoEvaluationConfigured, isReppoReviewConfigured, isServReviewConfigured, readReppoEvaluation, ReppoReviewError,
  draftServRevision, submitReppoEvaluation, submitReppoRevision } from "@/lib/reppo/evaluation";
import { readBoundedJson } from "@/lib/read-bounded-json";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const response = (value: unknown, status = 200, headers: HeadersInit = {}) =>
  privateRunResponse(NextResponse.json(value, { status, headers: { "Cache-Control": "private, no-store", ...headers } }));
const actionSchema = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("evaluate") }).strict(),
  z.object({ operation: z.literal("draft_revision"), ticket: z.string().min(1).max(1_024) }).strict(),
  z.object({ operation: z.literal("evaluate_revision"), ticket: z.string().min(1).max(1_024), answer: z.string().trim().min(1).max(12_000) }).strict(),
]);

function publicError(error: unknown): Response {
  if (error instanceof ReppoReviewError) {
    const status = error.code === "not_configured" ? 503
      : error.code === "invalid_ticket" ? 404
      : error.code === "serv_unavailable" || error.code === "serv_invalid_response" || error.code.startsWith("reppo_") ? 502
      : 503;
    return response({ error: error.code, ...(error.code === "reppo_submit_unknown" ? { retrySafe: false } : {}) }, status);
  }
  return response({ error: "review_unavailable" }, 503);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ipLimited = await checkRateLimit(clientIp(request), "public");
  if (ipLimited) return privateRunResponse(ipLimited);

  const context = await mutationPrivacyContext(request);
  if (context instanceof Response) return context;
  const { id } = await params;
  try {
    const dispatch = await resolveDispatch(id, context.db, context.actor);
    if (!dispatch || dispatch.visibility !== "public" || dispatch.archive) return response({ error: "not_found" }, 404);
    let action: z.infer<typeof actionSchema>;
    try { action = actionSchema.parse(await readBoundedJson(new Response(request.body), 64_000)); }
    catch { return response({ error: "invalid_request" }, 400); }

    const run = publicQueryRun(dispatch.run), wallet = context.actor.wallet;
    if (action.operation === "draft_revision") {
      if (!isServReviewConfigured() || !isReppoEvaluationConfigured()) return response({ error: "not_configured" }, 503);
      const previous = await readReppoEvaluation(action.ticket, id, wallet);
      if (previous.status !== "COMPLETED") return response({ error: "evaluation_not_complete" }, 409);
      const limit = await consumeDurablePoint(wallet, "reppo-review-draft", 3, 24 * 60 * 60 * 1000);
      if (!limit.allowed) {
        const retryAfter = Math.max(1, Math.ceil(limit.msBeforeNext / 1000));
        return response({ error: "daily_revision_limit", retryAfter }, 429, { "Retry-After": String(retryAfter) });
      }
      const revision = await draftServRevision(run, previous);
      return response({ revision });
    }

    if (action.operation === "evaluate_revision") {
      if (!isReppoEvaluationConfigured()) return response({ error: "not_configured" }, 503);
      const previous = await readReppoEvaluation(action.ticket, id, wallet);
      if (previous.status !== "COMPLETED") return response({ error: "evaluation_not_complete" }, 409);
      const limit = await consumeDurablePoint(wallet, "reppo-review", 3, 24 * 60 * 60 * 1000);
      if (!limit.allowed) {
        const retryAfter = Math.max(1, Math.ceil(limit.msBeforeNext / 1000));
        return response({ error: "daily_limit", retryAfter }, 429, { "Retry-After": String(retryAfter) });
      }
      const result = await submitReppoRevision(run, wallet, action.answer, previous);
      return response(result, 202);
    }

    if (!isReppoReviewConfigured()) return response({ error: "not_configured" }, 503);
    // This account-wide durable daily limit caps use of the deployment's Reppo credits.
    const limit = await consumeDurablePoint(wallet, "reppo-review", 3, 24 * 60 * 60 * 1000);
    if (!limit.allowed) {
      const retryAfter = Math.max(1, Math.ceil(limit.msBeforeNext / 1000));
      return response({ error: "daily_limit", retryAfter }, 429, { "Retry-After": String(retryAfter) });
    }
    const result = await submitReppoEvaluation(run, wallet);
    return response(result, 202);
  } catch (error) {
    return publicError(error);
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ipLimited = await checkRateLimit(clientIp(request), "public");
  if (ipLimited) return privateRunResponse(ipLimited);
  const { id } = await params;
  try {
    const db = await getDb();
    const actor = await requestPrivacyActor(request, db);
    if (actor instanceof Response) return actor;
    if (!actor) return response({ error: "unauthenticated" }, 401);
    const ticket = request.headers.get("X-Keryx-Reppo-Ticket") ?? "";
    if (!ticket || ticket.length > 1_024) return response({ error: "invalid_ticket" }, 404);

    const dispatch = await resolveDispatch(id, db, actor);
    if (!dispatch || dispatch.visibility !== "public" || dispatch.archive) return response({ error: "not_found" }, 404);
    const evaluation = await readReppoEvaluation(ticket, id, actor.wallet);
    return response({ evaluation });
  } catch (error) {
    return publicError(error);
  }
}
