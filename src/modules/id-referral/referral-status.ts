"use server";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface ReferralStatusSummary {
  referralId: string;
  instituteName: string | null;
  status: string;
}

export async function getReferralStatus(
  interactionId?: string,
): Promise<ReferralStatusSummary | null> {
  const referral = await prisma.idReferral.findMany({
    where: interactionId ? { interactionId } : {},
    orderBy: [{ createdAt: "desc" }],
    take: 1,
  });
  const latest = referral[0] ?? null;
  if (!latest) {
    return null;
  }
  const institute = latest.instituteId
    ? await prisma.institute.findUnique({ where: { id: latest.instituteId } })
    : null;
  return {
    referralId: latest.id,
    instituteName: institute?.name ?? null,
    status: latest.status,
  };
}
