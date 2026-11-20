"use client";

import { useState } from "react";
import { VerificationState } from "@/contracts";
import type { ConfidenceBand, ProfileFactProposal } from "@/contracts";

export interface FactReviewPanelProps {
  proposals: ProfileFactProposal[];
  onConfirm: (factId: string, value: string) => void;
  onReject: (factId: string) => void;
}

function factKey(proposal: ProfileFactProposal, index: number): string {
  return `${proposal.proposedValue.entityType}:${proposal.proposedValue.attributeKey}:${index}`;
}

function confidenceLabel(confidence: ConfidenceBand): string {
  if (confidence === "high") return "High";
  if (confidence === "medium") return "Medium";
  return "Low";
}

export function FactReviewPanel({ proposals, onConfirm, onReject }: FactReviewPanelProps) {
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  return (
    <section
      aria-labelledby="fact-review-heading"
      className="rounded-lg border border-zinc-200 bg-white p-4 text-left dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h2 id="fact-review-heading" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Review extracted facts
      </h2>
      {proposals.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">No facts require review.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {proposals.map((proposal, index) => {
            const key = factKey(proposal, index);
            const value = overrides[key] ?? proposal.proposedValue.proposedValue;
            const label = proposal.proposedValue.attributeKey.replaceAll("_", " ");
            return (
              <li key={key} className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</p>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {confidenceLabel(proposal.confidence)} confidence
                  </span>
                  <span className="text-xs text-amber-700 dark:text-amber-300">
                    {proposal.verificationState === VerificationState.Unverified
                      ? "Needs confirmation"
                      : proposal.verificationState}
                  </span>
                </div>
                <input
                  aria-label={`Override ${label}`}
                  className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  value={value}
                  onChange={(event) => {
                    setOverrides((current) => ({ ...current, [key]: event.target.value }));
                  }}
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="rounded-md bg-emerald-600 px-3 py-1 text-sm font-medium text-white"
                    onClick={() => onConfirm(key, value)}
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-zinc-300 px-3 py-1 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
                    onClick={() => onReject(key)}
                  >
                    Reject
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
