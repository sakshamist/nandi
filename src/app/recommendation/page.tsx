import { ExplanationCard } from "@/components/ai/explanation-card";
import { CustomerType } from "@/contracts/enums";
import type { RecommendationContext } from "@/contracts/ai";
import { mockExplainRecommendation } from "@/contracts/mocks";
import { getInsurerPrerequisites } from "@/modules/catalogue";
import { getRecommendationContext } from "@/modules/profile";
import { evaluatePolicyEligibility } from "@/modules/recommendation";
import { prisma } from "@/lib/prisma";

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
  const { interaction } = await searchParams;
  const context = interaction ? await getRecommendationContext(interaction) : FALLBACK_CONTEXT;
  const products = await prisma.insuranceProduct.findMany({
    where: { active: true },
    orderBy: [{ name: "asc" }],
  });
  const rows = [];
  for (const product of products) {
    rows.push({
      product,
      eligibility: await evaluatePolicyEligibility({ productId: product.id, context }),
      prerequisites: await getInsurerPrerequisites(product.id),
    });
  }
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
      <ExplanationCard result={mockExplainRecommendation} />
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
            {rows.map(({ product, eligibility, prerequisites }) => (
              <tr
                key={product.id}
                className="border-b border-zinc-200 last:border-b-0 dark:border-zinc-800"
              >
                <td className="px-4 py-3">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">{product.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{product.code}</p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      eligibility.eligible
                        ? "rounded px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-800"
                        : "rounded px-2 py-1 text-xs font-medium bg-zinc-200 text-zinc-600"
                    }
                  >
                    {eligibility.eligible ? "Eligible" : "Check details"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {[
                    prerequisites.requiresTagForSubmission ? "Tag required before submission" : null,
                    prerequisites.allowsPendingTaggingInspection
                      ? "Submit while tagging inspection is pending"
                      : null,
                    prerequisites.requiresTagForIssuance ? "Tag required before issuance" : null,
                    prerequisites.requiresVhc
                      ? "Veterinary health certificate required"
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" • ") || "None"}
                </td>
                <td className="px-4 py-3">
                  {eligibility.missingFacts.length > 0 ? eligibility.missingFacts.join(", ") : "All set"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}


export const instant = false;
