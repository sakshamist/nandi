import {
  ChecklistItemStatus as PrismaChecklistItemStatus,
  type ChecklistItem,
  type ChecklistInstance,
  type InsuranceProduct,
} from "@prisma/client";
import type {
  ChecklistInstanceResult,
  EvidenceRequirement,
  EvidenceRequirementsInput,
  GenerateChecklistInput,
  RecalculateChecklistInput,
  RecordEvidenceValidationInput,
  RecordEvidenceValidationResult,
} from "@/contracts/operations";
import { ValidationStatus, EvidenceRefType, prismaAdapters } from "@/contracts/enums";
import { DomainEvent } from "@/contracts/events";
import { emit } from "@/lib/events/bus";
import { prisma } from "@/lib/prisma";
import { getInsurerPrerequisites } from "@/modules/catalogue";
import type { ComposedChecklistItem } from "./checklist-engine";
import { composeItems } from "./checklist-engine";
import { routeEvidence } from "./routing";

function toResultItems(items: ChecklistItem[]): ChecklistInstanceResult["items"] {
  return items.map((item) => ({
    code: item.code,
    category: item.category,
    status: prismaAdapters.checklistItemStatus.fromPrisma(item.status),
    requiredForSubmission: item.requiredForSubmission,
    requiredForIssuance: item.requiredForIssuance,
  }));
}

async function loadComposedItems(productId: string): Promise<{
  product: InsuranceProduct;
  composed: ComposedChecklistItem[];
}> {
  const product = await prisma.insuranceProduct.findUnique({ where: { id: productId } });
  if (!product) {
    throw new Error(`InsuranceProduct not found: ${productId}`);
  }
  const prerequisites = await getInsurerPrerequisites(productId);
  const template = await prisma.checklistTemplate.findFirst({
    where: { productId, active: true, version: product.version },
  });
  return { product, composed: composeItems({ product, prerequisites, template }) };
}

async function createChecklistItems(
  instanceId: string,
  composed: ComposedChecklistItem[],
): Promise<ChecklistItem[]> {
  const items: ChecklistItem[] = [];
  for (const item of composed) {
    items.push(
      await prisma.checklistItem.create({
        data: {
          checklistInstanceId: instanceId,
          code: item.code,
          title: item.title,
          description: item.description,
          category: item.category,
          status: item.status,
          requiredForSubmission: item.requiredForSubmission,
          requiredForIssuance: item.requiredForIssuance,
        },
      }),
    );
  }
  return items;
}

export async function generateChecklistInstance(
  input: GenerateChecklistInput,
): Promise<ChecklistInstanceResult> {
  void input.context;
  const { product, composed } = await loadComposedItems(input.productId);
  const instance = await prisma.checklistInstance.create({
    data: { policySelectionId: input.policySelectionId, version: product.version },
  });
  const items = await createChecklistItems(instance.id, composed);
  emit(DomainEvent.ChecklistCreated, {
    checklistInstanceId: instance.id,
    version: instance.version,
  });
  return { checklistInstanceId: instance.id, version: instance.version, items: toResultItems(items) };
}

export async function recalculateChecklist(
  input: RecalculateChecklistInput,
): Promise<ChecklistInstanceResult> {
  const instance: ChecklistInstance | null = await prisma.checklistInstance.findUnique({
    where: { id: input.checklistInstanceId },
  });
  if (!instance) {
    throw new Error(`ChecklistInstance not found: ${input.checklistInstanceId}`);
  }
  const selection = await prisma.policySelection.findUnique({
    where: { id: instance.policySelectionId },
    select: { productId: true },
  });
  if (!selection) {
    throw new Error(`PolicySelection not found: ${instance.policySelectionId}`);
  }
  const { composed } = await loadComposedItems(selection.productId);
  await prisma.checklistItem.deleteMany({ where: { checklistInstanceId: instance.id } });
  const items = await createChecklistItems(instance.id, composed);
  const updated = await prisma.checklistInstance.update({
    where: { id: instance.id },
    data: { version: instance.version + 1, isComplete: false },
  });
  return { checklistInstanceId: updated.id, version: updated.version, items: toResultItems(items) };
}

export async function getPendingEvidenceRequirements(
  input: EvidenceRequirementsInput,
): Promise<EvidenceRequirement[]> {
  const instance = await prisma.checklistInstance.findUnique({
    where: { id: input.checklistInstanceId },
    include: { items: true },
  });
  if (!instance) {
    throw new Error(`ChecklistInstance not found: ${input.checklistInstanceId}`);
  }
  return instance.items
    .filter((item) => item.status !== PrismaChecklistItemStatus.COMPLETED)
    .map((item) => ({
      code: item.code,
      category: item.category,
      evidenceRefType: item.evidenceRefType === "DOCUMENT" ? "document" : "photo",
      requiredForSubmission: item.requiredForSubmission,
      requiredForIssuance: item.requiredForIssuance,
    }));
}

export async function recordEvidenceValidation(
  input: RecordEvidenceValidationInput,
): Promise<RecordEvidenceValidationResult> {
  const { status, reasonCodes } = routeEvidence(input.evidence, input.quality, input.vhc);
  const items = await prisma.checklistItem.findMany({
    where: { evidenceId: input.evidence.evidenceId },
  });
  let checklistUpdated = false;
  if (items.length > 0) {
    const evidenceRefType: "PHOTO" | "DOCUMENT" =
      input.evidence.evidenceType === EvidenceRefType.Document ? "DOCUMENT" : "PHOTO";
    const data = {
      status:
        status === ValidationStatus.Pass
          ? PrismaChecklistItemStatus.COMPLETED
          : PrismaChecklistItemStatus.BLOCKED,
      evidenceId: input.evidence.evidenceId,
      evidenceRefType,
      reasonCode: reasonCodes[0] ?? null,
      updatedAt: new Date(),
      ...(status === ValidationStatus.Pass ? { completedAt: new Date() } : {}),
    };
    await prisma.checklistItem.updateMany({
      where: {
        id: { in: items.map((item) => item.id) },
        status: { not: PrismaChecklistItemStatus.COMPLETED },
      },
      data,
    });
    checklistUpdated = true;
  }
  return { evidence: input.evidence, status, reasonCodes, checklistUpdated };
}
