"use client";

import { ConfidenceBand, VerificationState } from "@/contracts";
import type { ExplanationResult } from "@/contracts";

export interface ExplanationCardProps {
  result: ExplanationResult;
}

function confidenceLabel(confidence: ConfidenceBand): string {
  if (confidence === "high") return "High";
  if (confidence === "medium") return "Medium";
  return "Low";
}

function ExplanationList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">None</p>
      ) : (
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ExplanationCard({ result }: ExplanationCardProps) {
  const value = result.proposedValue;

  return (
    <article
      aria-labelledby="explanation-card-heading"
      className="rounded-lg border border-zinc-200 bg-white p-4 text-left dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="explanation-card-heading" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Policy explanation
        </h2>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {confidenceLabel(result.confidence)} confidence
        </span>
        <span className="text-xs text-amber-700 dark:text-amber-300">
          {result.verificationState === VerificationState.Unverified
            ? "Needs agent confirmation"
            : result.verificationState}
        </span>
      </div>
      <p className="mt-3 text-sm text-zinc-800 dark:text-zinc-200">{value.rationale}</p>
      <ExplanationList title="Prerequisites" items={value.prerequisites} />
      <ExplanationList title="Exclusions" items={value.exclusions} />
      <ExplanationList title="Missing facts" items={value.missingFacts} />
      <ExplanationList title="Post-submission requirements" items={value.postSubmissionSteps} />
    </article>
  );
}
