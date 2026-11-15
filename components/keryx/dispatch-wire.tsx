"use client";


import { formatRecordedUsdc } from "@/lib/i18n/format";

import type { PaymentRecord } from "@/lib/types";
import { paymentSettlementStatus } from "@/lib/payments/payment-state";
import { recordedArcLabel } from "@/lib/arc-network-display";
import { useUiMessages } from "@/lib/i18n/ui-copy";
import { useLedgerResource } from "@/lib/hooks/use-ledger-resource";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";





type State = "loading" | "ready" | "empty" | "error";

function settledCitations(body: unknown): PaymentRecord[] {
  if (!body || typeof body !== "object" || !("payments" in body) || !Array.isArray(body.payments)) throw new Error("Invalid payment feed");
  return (body.payments as PaymentRecord[]).filter((p) =>
    p.kind === "citation" && p.settled === true && paymentSettlementStatus(p) === "settled" && p.amountUsdc > 0,
  ).slice(0, 12);
}

export function DispatchWire() {
  const copy = useUiMessages();
  const resource = useLedgerResource("/api/payments?limit=50", settledCitations, true, 30_000);
  const payments = resource.data ?? [];
  const state: State = resource.retrying || resource.status === "loading" ? "loading"
    : resource.status === "error" ? "error" : payments.length ? "ready" : "empty";

  if (state === "empty") return null;

  return (
    <div className="border-b border-line bg-paper-2">
      <div className="mx-auto flex min-h-10 max-w-[1120px] items-center gap-3 px-4 sm:px-8">
      <BadgeWithDot type="modern" color="gray" size="sm" className="shrink-0 font-sans text-xs">
        {copy("dispatchWire.citations")}
      </BadgeWithDot>
      <div className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap py-2 text-xs text-ink-3" aria-live="polite">
        {state === "loading" && copy("dispatchWire.loading")}
        {state === "error" && copy("dispatchWire.unavailable")}
        {state === "ready" && (
          <div className="flex w-max gap-5 whitespace-nowrap">
            {payments.map((p) => <span key={p.id ?? `${p.queryId}-${p.sourceId}-${p.createdAt}`} className="flex items-center gap-2"><span className="font-medium text-ink-2">{p.sourceName}</span><span>{copy("dispatchWire.paid")}</span><span className="text-paid">{formatRecordedUsdc(p.amountUsdc, { minimumFractionDigits: 6 })} USDC</span><span>{recordedArcLabel(p.network)}</span></span>)}
          </div>
        )}
      </div>
      {state === "error" && <Button type="button" onPress={resource.retry} color="link-gray" size="sm" className="shrink-0 text-xs">{copy("dispatchWire.retry")}</Button>}
      </div>
    </div>
  );
}
