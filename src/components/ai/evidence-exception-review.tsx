"use client";

import type {
  EvidenceQualityResult,
  EvidenceRequirement,
  VhcExtractionResult,
} from "@/contracts";

export interface EvidenceExceptionReviewProps {
  requirements: EvidenceRequirement[];
  quality?: EvidenceQualityResult;
  vhc?: VhcExtractionResult;
  onRetake: (evidenceId: string) => void;
  onConfirm: (
    evidenceId: string,
    payload: { quality?: EvidenceQualityResult; vhc?: VhcExtractionResult },
  ) => void;
  onReject: (evidenceId: string) => void;
}

function reasonCodes(quality?: EvidenceQualityResult, vhc?: VhcExtractionResult): string[] {
  return [...new Set([
    ...(quality?.reasonCodes ?? []),
    ...(vhc?.reasonCodes ?? []),
  ])];
}

export function EvidenceExceptionReview({
  requirements,
  quality,
  vhc,
  onRetake,
  onConfirm,
  onReject,
}: EvidenceExceptionReviewProps) {
  const evidenceId = quality?.sourceEvidence.ref ?? vhc?.sourceEvidence.ref ?? "";
  const codes = reasonCodes(quality, vhc);
  const needsReview = codes.length > 0;

  return (
    <section
      aria-labelledby="evidence-exception-heading"
      className="rounded-lg border border-zinc-200 bg-white p-4 text-left dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h2 id="evidence-exception-heading" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Agent exception review
      </h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {needsReview
          ? "Low-confidence or failed validation requires agent review."
          : "No exception requires review."}
      </p>

      <div className="mt-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Evidence requirements
        </h3>
        {requirements.length === 0 ? (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">None</p>
        ) : (
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
            {requirements.map((requirement) => (
              <li key={requirement.code}>
                {requirement.code} ({requirement.evidenceRefType})
                {requirement.requiredForSubmission ? " — required before submission" : ""}
              </li>
            ))}
          </ul>
        )}
      </div>

      {codes.length > 0 ? (
        <div className="mt-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Reason codes
          </h3>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
            {codes.map((code) => (
              <li key={code}>{code}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {quality ? (
        <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
          Quality confidence: {(quality.proposedValue.scores.overall * 100).toFixed(0)}%
        </p>
      ) : null}

      {vhc ? (
        <ul className="mt-2 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
          {vhc.proposedValue.map((field) => (
            <li key={field.key}>
              {field.key}: {field.value} ({field.confidence})
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-md border border-zinc-300 px-3 py-1 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
          onClick={() => onRetake(evidenceId)}
        >
          Retake
        </button>
        <button
          type="button"
          className="rounded-md bg-emerald-600 px-3 py-1 text-sm font-medium text-white"
          onClick={() => onConfirm(evidenceId, { quality, vhc })}
        >
          Confirm for validation
        </button>
        <button
          type="button"
          className="rounded-md border border-red-300 px-3 py-1 text-sm font-medium text-red-700 dark:border-red-700 dark:text-red-300"
          onClick={() => onReject(evidenceId)}
        >
          Reject
        </button>
      </div>
    </section>
  );
}
