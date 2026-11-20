import { PrismaClient } from "@prisma/client";
import type { Institute } from "@prisma/client";

const prisma = new PrismaClient();

export async function listInstitutes(filters?: {
  district?: string;
  state?: string;
}): Promise<Institute[]> {
  return prisma.institute.findMany({
    where: {
      active: true,
      ...(filters?.district ? { district: filters.district } : {}),
      ...(filters?.state ? { state: filters.state } : {}),
    },
    orderBy: [{ name: "asc" }],
  });
}

export async function getInstitute(instituteId: string): Promise<Institute | null> {
  return prisma.institute.findUnique({ where: { id: instituteId } }) ?? null;
}

export async function lookupReferralDestination(filters?: {
  district?: string;
  state?: string;
}): Promise<Institute | null> {
  const institutes = await listInstitutes(filters);
  return institutes[0] ?? null;
}
