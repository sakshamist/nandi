"use client";

import { useEffect, useState } from "react";
import { getReferralStatus, type ReferralStatusSummary } from "@/modules/id-referral/referral-status";

const LABELS: Record<string, string> = {
  PENDING: "Referral pending — institute handoff needed",
  HANDOFF_COMPLETED: "Referral handed off — institute will contact you",
  APPOINTMENT_SCHEDULED: "Referral appointment scheduled",
  TAGGED: "Animal tagged — referral complete",
  CANCELLED: "Referral declined — no tagging needed",
};

export default function ReferralStatus() {
  const [summary, setSummary] = useState<ReferralStatusSummary | null>(null);
  useEffect(() => {
    let cancelled = false;
    getReferralStatus().then((result) => {
      if (!cancelled) setSummary(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  if (!summary) return null;
  return (
    <p className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950">
      {LABELS[summary.status] ?? summary.status}
      {summary.instituteName ? ` — ${summary.instituteName}` : ""}
    </p>
  );
}
