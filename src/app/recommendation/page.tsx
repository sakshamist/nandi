import { connection } from "next/server";
import { ExplanationCard } from "@/components/ai/explanation-card";
import { ConfidenceBand, CustomerType, SourceEvidenceType, VerificationState } from "@/contracts";
import type { ExplanationResult, RecommendationContext } from "@/contracts/ai";
import { getInsurerPrerequisites } from "@/modules/catalogue";
import { getRecommendationContext } from "@/modules/profile";
import { rankPolicies } from "@/modules/recommendation";
import { explainRecommendation } from "@/modules/recommendation/ai/explain-recommendation";

const FALLBACK_CONTEXT: RecommendationContext = {
  interactionId: "",
  customerType: CustomerType.Individual,
  verifiedFacts: {},
  livestock: [],
};

interface PageProps {
  searchParams: Promise<{ interaction?: string }>;
}

export default async function RecommendationShell({ searchParams }: PageProps) {
  await connection();
  const { interaction } = await searchParams;
  const context = interaction ? await getRecommendationContext(interaction) : FALLBACK_CONTEXT;
  const rankedPolicies = await rankPolicies(context);
  const prerequisites = await Promise.all(
    rankedPolicies.map((policy) => getInsurerPrerequisites(policy.productId)),
  );
  let explanation: ExplanationResult;
  try {
    explanation = await explainRecommendation({ context, rankedPolicies, prerequisites });
  } catch {
    explanation = {
      proposedValue: {
        rationale: "Explanation unavailable.",
        prerequisites: [],
        exclusions: [],
        missingFacts: [],
        postSubmissionSteps: [],
      },
      sourceEvidence: { type: SourceEvidenceType.ProductRule, ref: rankedPolicies[0]?.productId ?? "none" },
      confidence: ConfidenceBand.Low,
      verificationState: VerificationState.Unverified,
      promptVersion: "fallback",
      modelVersion: "fallback",
    };
  }
  const rows = rankedPolicies.map((policy, index) => ({
    policy,
    prerequisites: prerequisites[index],
  }));

  return (
    <main className="flex flex-1 flex-col gap-6 bg-zinc-50 px-6 py-8 text-zinc-900 dark:bg-black">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Recommended policies
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            What fits this animal, per insurer rules.
          </p>
        </div>
      </header>
      <ExplanationCard result={explanation} />
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
            <tr>
              <th className="px-4 py-3">Policy</th>
              <th className="px-4 py-3">Eligible</th>
              <th className="px-4 py-3">Requirements</th>
              <th className="px-4 py-3">Missing facts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ policy, prerequisites: prereq }) => (
              <tr
                key={policy.productId}
                className="border-b border-zinc-200 last:border-b-0 dark:border-zinc-800"
              >
                <td className="px-4 py-3">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">{policy.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{policy.code}</p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      policy.eligible
                        ? "rounded px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-800"
                        : "rounded px-2 py-1 text-xs font-medium bg-zinc-200 text-zinc-600"
                    }
                  >
                    {policy.eligible ? "Eligible" : "Check details"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {[
                    prereq.requiresTagForSubmission ? "Tag required before submission" : null,
                    prereq.allowsPendingTaggingInspection
                      ? "Submit while tagging inspection is pending"
                      : null,
                    prereq.requiresTagForIssuance ? "Tag required before issuance" : null,
                    prereq.requiresVhc ? "Veterinary health certificate required" : null,
                  ]
                    .filter(Boolean)
                    .join(" • ") || "None"}
                </td>
                <td className="px-4 py-3">
                  {policy.missingFacts.length > 0 ? policy.missingFacts.join(", ") : "All set"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
