import { PrismaClient } from "@prisma/client";
import type { Interaction } from "@prisma/client";

const prisma = new PrismaClient();

export interface InteractionStore {
  createInteraction(agentId: string): Promise<Interaction>;
  findByClientDraftKey(clientDraftKey: string): Promise<Interaction | null>;
  findById(interactionId: string): Promise<Interaction | null>;
  closeInteraction(interactionId: string): Promise<void>;
}

export const prismaInteractionStore: InteractionStore = {
  async createInteraction(agentId: string) {
    return prisma.interaction.create({
      data: { agentId, clientDraftKey: `draft-${crypto.randomUUID()}` },
    });
  },
  async findByClientDraftKey(clientDraftKey: string) {
    return prisma.interaction.findUnique({ where: { clientDraftKey } }) ?? null;
  },
  async findById(interactionId: string) {
    return prisma.interaction.findUnique({ where: { id: interactionId } }) ?? null;
  },
  async closeInteraction(interactionId: string) {
    await prisma.interaction.update({ where: { id: interactionId }, data: { status: "CLOSED" } });
  },
};
