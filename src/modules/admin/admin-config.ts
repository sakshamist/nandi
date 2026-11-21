import type { AdminConfig } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getAdminConfig(key: string): Promise<AdminConfig | null> {
  return prisma.adminConfig.findFirst({ where: { key } }) ?? null;
}

export async function setAdminConfig(key: string, valueJson: string): Promise<AdminConfig> {
  return prisma.adminConfig.upsert({
    where: { key },
    update: { valueJson },
    create: { key, valueJson },
  });
}
