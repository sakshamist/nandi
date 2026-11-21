import { connection } from "next/server";
import type { EvidenceCategory } from "@prisma/client";
import EvidenceExceptionReview from "@/components/capture/evidence-exception-review";
import PhotoCaptureForm from "@/components/capture/photo-capture-form";
import type { DocumentAsset, EvidenceRequirement, PhotoAsset } from "@/contracts";
import { mockEvidenceRequirements } from "@/contracts/mocks";
import { prisma } from "@/lib/prisma";
import { assessEvidenceQuality } from "@/modules/documents/ai/assess-evidence-quality";
import { extractVhcFields } from "@/modules/documents/ai/extract-vhc-fields";

const PHOTO_CATEGORIES: EvidenceCategory[] = [
  "ANIMAL_FULL_BODY_PHOTO",
  "EAR_TAG_PHOTO",
  "ANIMAL_WITH_OWNER_PHOTO",
];

export default async function CaptureShell() {
  await connection();
  const instances = await prisma.checklistInstance.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 1,
  });
  const instance = instances[0] ?? null;
  const items = instance
    ? await prisma.checklistItem.findMany({
        where: { checklistInstanceId: instance.id, category: { in: PHOTO_CATEGORIES } },
        orderBy: [{ code: "asc" }],
      })
    : [];

  const photo: PhotoAsset = {
    id: `photo-demo-${instance?.id ?? "none"}`,
    storageUri: "demo://photos/ear-tag",
    mimeType: "image/jpeg",
    category: "EAR_TAG_PHOTO",
  };
  const document: DocumentAsset = {
    id: `document-demo-${instance?.id ?? "none"}`,
    storageUri: "demo://documents/vhc",
    mimeType: "application/pdf",
    category: "VETERINARY_HEALTH_CERTIFICATE",
  };
  const requirements: EvidenceRequirement[] = mockEvidenceRequirements;
  let quality;
  let vhc;
  try {
    quality = await assessEvidenceQuality(photo);
  } catch {
    quality = undefined;
  }
  try {
    vhc = await extractVhcFields(document);
  } catch {
    vhc = undefined;
  }

  return (
    <main className="flex flex-1 flex-col gap-6 bg-zinc-50 px-6 py-8 text-zinc-900 dark:bg-black">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Capture photos
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Capture clear photos with consent metadata. AI quality checks may flag retake needs.
          </p>
        </div>
      </header>
      {items.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {instance ? `No pending photo items in checklist ${instance.id}.` : "No checklist yet — select a policy first."}
        </p>
      )}
      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{item.title}</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{item.category}</p>
            <div className="mt-4">
              <PhotoCaptureForm category={item.category} />
            </div>
          </article>
        ))}
      </div>
      <EvidenceExceptionReview
        requirements={requirements}
        quality={quality}
        vhc={vhc}
      />
    </main>
  );
}

export const instant = false;
