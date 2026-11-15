"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSiweAuth } from "@/lib/hooks/use-siwe-auth";
import { readBoundedJson } from "@/lib/read-bounded-json";

type ReviewStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
type Evaluation = {
  id: string;
  status: ReviewStatus;
  score: number | null;
  route: "ship" | "review" | "block" | null;
  decision: string | null;
  confidence: "low" | "medium" | "high" | null;
  reason: string | null;
  rubricScores: Array<{ label: string; score: number | string }>;
};
type Brief = { brief: string; criteria: string[] };
type Revision = { answer: string; changes: string };

const errorCopy: Record<string, string> = {
  not_configured: "SERV or Reppo is not configured for this deployment yet.",
  serv_unavailable: "SERV Reasoning could not prepare the evaluation brief. No Reppo review was submitted.",
  serv_invalid_response: "SERV returned a review brief in an unsupported format. No Reppo review was submitted.",
  reppo_submit_failed: "Reppo did not accept the evaluation request.",
  reppo_submit_unknown: "The Reppo submission could not be confirmed. Check your Reppo evaluation history before trying again.",
  reppo_read_failed: "The Reppo evaluation status is temporarily unavailable. You can check it again below.",
  serv_revision_failed: "SERV could not draft a revision from the available report and Reppo feedback.",
  evaluation_not_complete: "Wait for Reppo to finish this evaluation before drafting or scoring a revision.",
  daily_limit: "You have reached the limit of three Reppo reviews for this Arch account today.",
  daily_revision_limit: "You have reached the limit of three SERV revision drafts for this Arch account today.",
  unauthenticated: "Sign in to Arch to request an evaluation.",
  review_unavailable: "The evaluation service is temporarily unavailable.",
};

function routeLabel(route: Evaluation["route"]): string {
  if (route === "ship") return "SHIP";
  if (route === "review") return "HUMAN REVIEW";
  if (route === "block") return "BLOCK";
  return "PENDING";
}

function terminal(status: ReviewStatus | undefined): boolean {
  return status === "COMPLETED" || status === "FAILED";
}

export function ReppoReview({ reportId }: { reportId: string }) {
  const { session } = useSiweAuth();
  const wallet = session?.address.toLowerCase() ?? "";
  const [ticket, setTicket] = useState("");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [baselineEvaluation, setBaselineEvaluation] = useState<Evaluation | null>(null);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [revision, setRevision] = useState<Revision | null>(null);
  const [busy, setBusy] = useState(false);
  const [polling, setPolling] = useState(false);
  const [autoPolling, setAutoPolling] = useState(false);
  const [notice, setNotice] = useState("");
  const [unknownSubmission, setUnknownSubmission] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const baselineRef = useRef<Evaluation | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  const loadStatus = useCallback(async (currentTicket = ticket) => {
    if (!currentTicket || !wallet || controller.current) return;
    const owned = new AbortController(); controller.current = owned;
    setPolling(true);
    try {
      const response = await fetch(`/api/dispatch/${encodeURIComponent(reportId)}/reppo-review`, {
        method: "GET", credentials: "same-origin", cache: "no-store", redirect: "error", referrerPolicy: "no-referrer",
        headers: { "X-Keryx-Expected-Wallet": wallet, "X-Keryx-Reppo-Ticket": currentTicket }, signal: AbortSignal.any([owned.signal, AbortSignal.timeout(12_000)]),
      });
      const value = await readBoundedJson(response, 64_000) as { evaluation?: Evaluation; error?: string };
      if (!response.ok || !value.evaluation || value.evaluation.id !== evaluation?.id) throw new Error(value.error ?? "reppo_read_failed");
      setEvaluation(value.evaluation); setNotice(""); setAutoPolling(!terminal(value.evaluation.status));
      if (value.evaluation.status === "COMPLETED" && !baselineRef.current) {
        baselineRef.current = value.evaluation; setBaselineEvaluation(value.evaluation);
      }
    } catch (error) {
      if (!owned.signal.aborted) { setAutoPolling(false); setNotice(error instanceof Error && error.message in errorCopy ? errorCopy[error.message] : errorCopy.reppo_read_failed); }
    } finally {
      if (controller.current === owned) controller.current = null;
      setPolling(false);
    }
  }, [evaluation, reportId, ticket, wallet]);

  useEffect(() => {
    if (!ticket || !wallet || !evaluation || terminal(evaluation.status) || polling || !autoPolling) return;
    const timer = setTimeout(() => { void loadStatus(ticket); }, 5_000);
    return () => clearTimeout(timer);
  }, [ticket, wallet, evaluation, polling, autoPolling, loadStatus]);

  const submit = async () => {
    if (!wallet || busy || unknownSubmission) return;
    const owned = new AbortController(); controller.current = owned;
    const deadline = AbortSignal.timeout(55_000);
    const signal = AbortSignal.any([owned.signal, deadline]);
    setBusy(true); setNotice(""); setTicket(""); setEvaluation(null); setBaselineEvaluation(null); baselineRef.current = null;
    setBrief(null); setRevision(null); setAutoPolling(false);
    try {
      const response = await fetch(`/api/dispatch/${encodeURIComponent(reportId)}/reppo-review`, {
        method: "POST", credentials: "same-origin", cache: "no-store", redirect: "error", referrerPolicy: "no-referrer",
        headers: { "X-Keryx-Expected-Wallet": wallet, "Content-Type": "application/json" }, body: JSON.stringify({ operation: "evaluate" }), signal,
      });
      const value = await readBoundedJson(response, 64_000) as { ticket?: string; evaluation?: Evaluation; servBrief?: Brief; error?: string; retrySafe?: boolean };
      if (!response.ok || typeof value.ticket !== "string" || !value.evaluation || !value.servBrief) {
        if (value.error === "reppo_submit_unknown" || response.status >= 500 && owned.signal.aborted) setUnknownSubmission(true);
        throw new Error(value.error ?? "review_unavailable");
      }
      setTicket(value.ticket); setEvaluation(value.evaluation); setBrief(value.servBrief); setAutoPolling(!terminal(value.evaluation.status));
      if (value.evaluation.status === "COMPLETED") { baselineRef.current = value.evaluation; setBaselineEvaluation(value.evaluation); }
      setNotice(value.evaluation.status === "COMPLETED" ? "Reppo's independent evaluation is complete." : "Submitted to Reppo. Waiting for independent evaluators.");
    } catch (error) {
      if (deadline.aborted) { setUnknownSubmission(true); setNotice(errorCopy.reppo_submit_unknown); }
      else if (!owned.signal.aborted) setNotice(error instanceof Error && error.message in errorCopy ? errorCopy[error.message] : errorCopy.review_unavailable);
    } finally {
      if (controller.current === owned) controller.current = null;
      setBusy(false);
    }
  };

  const requestRevision = async () => {
    if (!wallet || !ticket || evaluation?.status !== "COMPLETED" || busy) return;
    const owned = new AbortController(); controller.current = owned; setBusy(true); setNotice(""); setRevision(null);
    try {
      const response = await fetch(`/api/dispatch/${encodeURIComponent(reportId)}/reppo-review`, {
        method: "POST", credentials: "same-origin", cache: "no-store", redirect: "error", referrerPolicy: "no-referrer",
        headers: { "X-Keryx-Expected-Wallet": wallet, "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "draft_revision", ticket }),
        signal: AbortSignal.any([owned.signal, AbortSignal.timeout(45_000)]),
      });
      const value = await readBoundedJson(response, 32_000) as { revision?: Revision; error?: string };
      if (!response.ok || !value.revision || typeof value.revision.answer !== "string" || typeof value.revision.changes !== "string") {
        throw new Error(value.error ?? "serv_revision_failed");
      }
      setRevision(value.revision);
      setNotice("SERV drafted a revision. Review or edit it before asking Reppo to score it.");
    } catch (error) {
      if (!owned.signal.aborted) setNotice(error instanceof Error && error.message in errorCopy ? errorCopy[error.message] : errorCopy.serv_revision_failed);
    } finally {
      if (controller.current === owned) controller.current = null;
      setBusy(false);
    }
  };

  const evaluateRevision = async () => {
    if (!wallet || !ticket || !revision?.answer.trim() || busy || unknownSubmission) return;
    const owned = new AbortController(); controller.current = owned;
    const deadline = AbortSignal.timeout(55_000), signal = AbortSignal.any([owned.signal, deadline]);
    setBusy(true); setNotice("");
    try {
      const response = await fetch(`/api/dispatch/${encodeURIComponent(reportId)}/reppo-review`, {
        method: "POST", credentials: "same-origin", cache: "no-store", redirect: "error", referrerPolicy: "no-referrer",
        headers: { "X-Keryx-Expected-Wallet": wallet, "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "evaluate_revision", ticket, answer: revision.answer }), signal,
      });
      const value = await readBoundedJson(response, 64_000) as { ticket?: string; evaluation?: Evaluation; revisedAnswer?: string; error?: string };
      if (!response.ok || typeof value.ticket !== "string" || !value.evaluation || typeof value.revisedAnswer !== "string") {
        if (value.error === "reppo_submit_unknown") setUnknownSubmission(true);
        throw new Error(value.error ?? "review_unavailable");
      }
      setTicket(value.ticket); setRevision(current => current ? { ...current, answer: value.revisedAnswer! } : current);
      setEvaluation(value.evaluation); setAutoPolling(!terminal(value.evaluation.status));
      setNotice(value.evaluation.status === "COMPLETED" ? "Reppo has scored the revised answer." : "Revision submitted. Waiting for Reppo to score it.");
    } catch (error) {
      if (deadline.aborted) { setUnknownSubmission(true); setNotice(errorCopy.reppo_submit_unknown); }
      else if (!owned.signal.aborted) setNotice(error instanceof Error && error.message in errorCopy ? errorCopy[error.message] : errorCopy.review_unavailable);
    } finally {
      if (controller.current === owned) controller.current = null;
      setBusy(false);
    }
  };

  return <section className="mt-8 max-w-[860px] border border-ink bg-paper p-5 sm:p-6" aria-labelledby="reppo-review-title">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-seal">SERV HACKATHON · REPPO TRACK</p>
        <h2 id="reppo-review-title" className="mt-1 font-display text-2xl text-ink">Independent Reppo review</h2>
      </div>
      <span className="border border-line px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-ink-3">SERV → Reppo</span>
    </div>

    <p className="mt-4 max-w-[700px] font-serif text-sm leading-6 text-ink-2">
      SERV Reasoning prepares a focused evaluation brief. Reppo’s independent evaluators then assess this Arch report and return a score, critique, and route.
    </p>
    <p className="mt-3 max-w-[700px] text-xs leading-5 text-ink-3">
      Requesting a review sends the public question, answer, citation references, and visible reasoning messages to SERV and Reppo. It uses this deployment’s configured service accounts and may consume Reppo credits. After Reppo responds, SERV can draft a conservative revision; you review or edit it before Reppo evaluates it again. The original answer, payments, and report are not changed. A score change measures Reppo’s assessment of the revision, not factual correctness.
    </p>

    {session === undefined ? <p className="mt-4 font-mono text-xs text-ink-3">Checking Keryx account…</p> : session === null ? <p className="mt-4 font-mono text-xs text-ink-2">
      <Link href="/connect" className="underline underline-offset-4">Sign in to Arch</Link> to request a review.
    </p> : <div className="mt-4 flex flex-wrap items-center gap-3">
      <button type="button" disabled={busy || unknownSubmission || Boolean(evaluation && !terminal(evaluation.status))} onClick={() => void submit()}
        className="min-h-11 border border-ink bg-ink px-4 py-2 font-mono text-xs uppercase tracking-wide text-paper transition-colors hover:bg-seal disabled:cursor-wait disabled:opacity-50">
        {busy ? "Preparing SERV review…" : evaluation && !terminal(evaluation.status) ? "Review in progress" : unknownSubmission ? "Submission needs checking" : evaluation ? "Request another review" : "Request independent review"}
      </button>
      {ticket && evaluation && !terminal(evaluation.status) && <span role="status" className="font-mono text-xs text-ink-3">Reppo: {evaluation.status.toLowerCase()}</span>}
    </div>}

    {notice && <p role="status" className="mt-4 border-l-2 border-seal pl-3 font-serif text-sm text-ink-2">{notice}</p>}
    {ticket && evaluation && notice === errorCopy.reppo_read_failed && <button type="button" disabled={polling} onClick={() => { setAutoPolling(true); void loadStatus(); }}
      className="mt-3 min-h-11 border border-line px-3 py-2 font-mono text-xs underline disabled:opacity-50">{polling ? "Checking…" : "Check Reppo status"}</button>}

    {brief && <details className="mt-5 border border-line bg-paper-2 p-4" open>
      <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-wide text-ink">SERV Reasoning evaluation brief</summary>
      <p className="mt-3 font-serif text-sm leading-6 text-ink-2">{brief.brief}</p>
      <ul className="mt-3 list-disc space-y-1 pl-5 font-serif text-sm text-ink-2">{brief.criteria.map((criterion, index) => <li key={`${index}:${criterion}`}>{criterion}</li>)}</ul>
    </details>}

    {evaluation?.status === "COMPLETED" && <div className="mt-5 border-t border-line pt-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">REPPO SCORE</p>
          <p className="mt-1 font-display text-4xl text-ink">{evaluation.score === null ? "—" : `${evaluation.score}/100`}</p>
          {baselineEvaluation && baselineEvaluation.id !== evaluation.id && baselineEvaluation.score !== null && evaluation.score !== null && <p className="mt-1 font-mono text-xs text-ink-3">Original: {baselineEvaluation.score}/100 · Change: {evaluation.score - baselineEvaluation.score > 0 ? "+" : ""}{evaluation.score - baselineEvaluation.score} points</p>}
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">RECOMMENDED ROUTE</p>
          <p className={`mt-1 font-mono text-sm ${evaluation.route === "ship" ? "text-seal" : "text-ink"}`}>{routeLabel(evaluation.route)}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[11px] text-ink-3">
        {evaluation.decision && <span>Decision: {evaluation.decision}</span>}
        {evaluation.confidence && <span>Confidence: {evaluation.confidence}</span>}
      </div>
      {evaluation.reason && <p className="mt-4 whitespace-pre-wrap font-serif text-sm leading-6 text-ink-2">{evaluation.reason}</p>}
      {evaluation.rubricScores.length > 0 && <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm"><thead><tr className="border-b border-line font-mono text-[10px] uppercase text-ink-3"><th className="py-2 pr-4">Dimension</th><th className="py-2">Score / note</th></tr></thead>
          <tbody>{evaluation.rubricScores.map(({ label, score }) => <tr key={label} className="border-b border-line last:border-0"><th scope="row" className="py-2 pr-4 font-medium text-ink-2">{label}</th><td className="py-2 font-mono text-xs text-ink-2">{String(score)}</td></tr>)}</tbody>
        </table>
      </div>}
    </div>}
    {evaluation?.status === "FAILED" && <p role="status" className="mt-4 font-serif text-sm text-ink-2">Reppo marked this evaluation as failed. Check your Reppo evaluation history before submitting another review.</p>}

    {evaluation?.status === "COMPLETED" && <div className="mt-5 border-t border-line pt-4">
      <h3 className="font-mono text-xs uppercase tracking-wide text-ink">Turn Reppo feedback into a measured revision</h3>
      {!revision ? <button type="button" disabled={busy || unknownSubmission} onClick={() => void requestRevision()}
        className="mt-3 min-h-11 border border-line px-3 py-2 font-mono text-xs underline disabled:opacity-50">{busy ? "SERV is drafting…" : "Draft revision with SERV"}</button> : <div className="mt-3">
        <p className="font-serif text-sm leading-5 text-ink-2">{revision.changes}</p>
        <label className="mt-3 block font-mono text-[11px] text-ink-2">Review and edit the SERV draft before scoring it
          <textarea aria-label="SERV revised answer" rows={8} maxLength={12_000} value={revision.answer}
            onChange={event => setRevision(current => current ? { ...current, answer: event.target.value } : current)}
            className="mt-2 block w-full min-w-0 border border-line bg-paper-2 p-3 font-serif text-sm leading-6 text-ink" />
        </label>
        <button type="button" disabled={busy || unknownSubmission || !revision.answer.trim()} onClick={() => void evaluateRevision()}
          className="mt-3 min-h-11 border border-ink bg-ink px-4 py-2 font-mono text-xs uppercase tracking-wide text-paper disabled:opacity-50">{busy ? "Submitting revision…" : "Evaluate revision with Reppo"}</button>
      </div>}
    </div>}
  </section>;
}
