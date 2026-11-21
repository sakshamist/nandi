import type { ChecklistTemplate, InsuranceProduct } from "@prisma/client";
import type { InsurerPrerequisites } from "@/contracts/operations";
import type { EvidenceCategory } from "@prisma/client";
import { ChecklistItemStatus as PrismaChecklistItemStatus } from "@prisma/client";

export interface ComposedChecklistItem {
  code: string;
  title: string;
  description?: string | null;
  category: EvidenceCategory;
  status: PrismaChecklistItemStatus;
  requiredForSubmission: boolean;
  requiredForIssuance: boolean;
}

const CATEGORY_BY_CODE: Record<string, EvidenceCategory> = {
  ANIMAL_FULL_BODY_PHOTO: "ANIMAL_FULL_BODY_PHOTO",
  EAR_TAG_PHOTO: "EAR_TAG_PHOTO",
  ANIMAL_WITH_OWNER_PHOTO: "ANIMAL_WITH_OWNER_PHOTO",
  VETERINARY_HEALTH_CERTIFICATE: "VETERINARY_HEALTH_CERTIFICATE",
  VHC: "VETERINARY_HEALTH_CERTIFICATE",
  KYC_IDENTITY_PROOF: "KYC_IDENTITY_PROOF",
  KYC_ADDRESS_PROOF: "KYC_ADDRESS_PROOF",
  OWNERSHIP_PROOF: "OWNERSHIP_PROOF",
  TAGGING_PENDING_INSPECTION_ALLOWED: "OTHER",
  TAG_REQUIRED_BEFORE_SUBMISSION: "OTHER",
};

const VHC_DEPENDENCIES = [
  "VET_LICENSE_NUMBER",
  "VET_SIGNOFF",
  "DENTITION_AGE",
  "MILK_YIELD",
  "HEALTH_STATUS",
];

function humanize(code: string): string {
  return code.replace(/_/g, " ");
}

function mandatoryItems(prerequisites: InsurerPrerequisites): ComposedChecklistItem[] {
  const items: ComposedChecklistItem[] = [
    {
      code: "ANIMAL_FULL_BODY_PHOTO",
      title: "Animal full-body photo",
      description: "Side profile of the animal",
      category: "ANIMAL_FULL_BODY_PHOTO",
      status: PrismaChecklistItemStatus.REQUIRED,
      requiredForSubmission: true,
      requiredForIssuance: true,
    },
    {
      code: "EAR_TAG_PHOTO",
      title: "Ear tag close-up photo",
      description: "Readable ear tag photo",
      category: "EAR_TAG_PHOTO",
      status: PrismaChecklistItemStatus.REQUIRED,
      requiredForSubmission: true,
      requiredForIssuance: true,
    },
    {
      code: "ANIMAL_WITH_OWNER_PHOTO",
      title: "Photo of animal with owner",
      description: "Animal alongside the owner or agent",
      category: "ANIMAL_WITH_OWNER_PHOTO",
      status: PrismaChecklistItemStatus.REQUIRED,
      requiredForSubmission: true,
      requiredForIssuance: true,
    },
    {
      code: "KYC_IDENTITY_PROOF",
      title: "KYC identity proof",
      description: "Proof of owner identity",
      category: "KYC_IDENTITY_PROOF",
      status: PrismaChecklistItemStatus.REQUIRED,
      requiredForSubmission: true,
      requiredForIssuance: true,
    },
  ];
  if (prerequisites.requiresVhc) {
    items.push({
      code: "VETERINARY_HEALTH_CERTIFICATE",
      title: "Veterinary health certificate",
      description: "Signed veterinary certification",
      category: "VETERINARY_HEALTH_CERTIFICATE",
      status: PrismaChecklistItemStatus.REQUIRED,
      requiredForSubmission: true,
      requiredForIssuance: true,
    });
  }
  if (prerequisites.requiresTagForSubmission) {
    items.push({
      code: "TAG_REQUIRED_BEFORE_SUBMISSION",
      title: "Ear tag required before submission",
      description: "The insurer requires a verified tag before accepting the application",
      category: "OTHER",
      status: PrismaChecklistItemStatus.REQUIRED,
      requiredForSubmission: true,
      requiredForIssuance: true,
    });
  }
  if (prerequisites.allowsPendingTaggingInspection) {
    items.push({
      code: "TAG_PENDING_INSPECTION_ALLOWED",
      title: "Submit while tagging is pending inspection",
      description: "The insurer permits submission while the tag is being verified",
      category: "OTHER",
      status: PrismaChecklistItemStatus.REQUIRED,
      requiredForSubmission: false,
      requiredForIssuance: true,
    });
  }
  return items;
}

export function composeItems(input: {
  product: InsuranceProduct;
  prerequisites: InsurerPrerequisites;
  template?: ChecklistTemplate | null;
}): ComposedChecklistItem[] {
  const items = mandatoryItems(input.prerequisites);
  const seen = new Set(items.map((item) => item.code));
  const templateCodes = input.template ? (JSON.parse(input.template.itemsConfigJson) as string[]) : [];
  for (const code of templateCodes) {
    if (seen.has(code)) {
      continue;
    }
    seen.add(code);
    items.push({
      code,
      title: humanize(code),
      description: null,
      category: CATEGORY_BY_CODE[code] ?? "OTHER",
      status: PrismaChecklistItemStatus.REQUIRED,
      requiredForSubmission: true,
      requiredForIssuance: true,
    });
  }
  return enforceDependencies(items);
}

export function enforceDependencies(items: ComposedChecklistItem[]): ComposedChecklistItem[] {
  const codes = new Set(items.map((item) => item.code));
  if (codes.has("VETERINARY_HEALTH_CERTIFICATE")) {
    for (const code of VHC_DEPENDENCIES) {
      if (!codes.has(code)) {
        items.push({
          code,
          title: humanize(code),
          description: "Required by the veterinary health certificate",
          category: "OTHER",
          status: PrismaChecklistItemStatus.REQUIRED,
          requiredForSubmission: true,
          requiredForIssuance: true,
        });
        codes.add(code);
      }
    }
  }
  return items;
}
