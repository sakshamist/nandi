import type { ClaimCaseStub, CrmCase } from "@prisma/client";
import { DomainEvent } from "@/contracts/events";
import { emit } from "@/lib/events/bus";
import { prisma } from "@/lib/prisma";

export interface CreateCrmCaseInput {
  customerId: string;
  applicationId?: string | null;
  caseType: string;
  title: string;
  description?: string | null;
  followUpDate?: Date | null;
}

export async function createCrmCase(input: CreateCrmCaseInput): Promise<CrmCase> {
  return prisma.crmCase.create({
    data: {
      customerId: input.customerId,
      applicationId: input.applicationId ?? null,
      caseType: input.caseType,
      title: input.title,
      description: input.description ?? null,
      followUpDate: input.followUpDate ?? null,
    },
  });
}

export async function getCrmCases(customerId?: string): Promise<CrmCase[]> {
  return prisma.crmCase.findMany({
    where: customerId ? { customerId } : {},
    orderBy: [{ createdAt: "desc" }],
  });
}

export interface CreateClaimStubInput {
  crmCaseId: string;
  reference: string;
  status?: "claim_intimated" | "inspector_assigned" | "settled";
  notes?: string | null;
}

export async function createClaimStub(input: CreateClaimStubInput): Promise<ClaimCaseStub> {
  const stub = await prisma.claimCaseStub.create({
    data: {
      crmCaseId: input.crmCaseId,
      reference: input.reference,
      status: input.status ?? "claim_intimated",
      notes: input.notes ?? null,
    },
  });
  emit(DomainEvent.ClaimCaseReferenced, { caseId: stub.id });
  return stub;
}

export async function getClaimStubs(crmCaseId?: string): Promise<ClaimCaseStub[]> {
  return prisma.claimCaseStub.findMany({
    where: crmCaseId ? { crmCaseId } : {},
    orderBy: [{ createdAt: "desc" }],
  });
}
