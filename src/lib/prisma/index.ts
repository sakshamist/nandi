import { PrismaClient } from "@prisma/client";

const globalRef = globalThis as { __surelmPrisma?: PrismaClient };
if (!globalRef.__surelmPrisma) {
  globalRef.__surelmPrisma = new PrismaClient();
}
export const prisma = globalRef.__surelmPrisma;
