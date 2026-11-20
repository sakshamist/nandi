import type {
  CloseInteractionInput,
  InteractionContext,
  ResumeInteractionInput,
  StartInteractionResult,
  SyncOfflineDraftInput,
  SyncOfflineDraftResult,
} from "@/contracts/operations";
import { ApplicationState } from "@/contracts/enums";
import { DomainEvent } from "@/contracts/events";
import { emit } from "@/lib/events/bus";
import type { InteractionStore } from "./interaction-store";
import { prismaInteractionStore } from "./interaction-store";

export interface InteractionService {
  startInteraction: (input: InteractionContext) => Promise<StartInteractionResult>;
  resumeInteraction: (input: ResumeInteractionInput) => Promise<InteractionContext>;
  syncOfflineDraft: (input: SyncOfflineDraftInput) => Promise<SyncOfflineDraftResult>;
  closeInteraction: (input: CloseInteractionInput) => Promise<void>;
}

interface SyncRecord {
  accepted: boolean;
  version: number;
}

export function createInteractionService(store: InteractionStore): InteractionService {
  const versions = new Map<string, number>();
  const ledger = new Map<string, Map<string, SyncRecord>>();

  const versionFor = (interactionId: string): number => versions.get(interactionId) ?? 0;

  return {
    async startInteraction(input) {
      const interaction = await store.createInteraction(input.agentId);
      versions.set(interaction.id, 0);
      emit(DomainEvent.InteractionStarted, {
        interactionId: interaction.id,
        agentId: interaction.agentId,
      });
      return { interactionId: interaction.id, state: ApplicationState.ProfileIncomplete };
    },

    async resumeInteraction(input) {
      const interaction =
        (await store.findById(input.interactionId)) ??
        (await store.findByClientDraftKey(input.clientDraftKey ?? ""));
      if (!interaction) {
        throw new Error(`Interaction not found: ${input.interactionId}`);
      }
      return {
        interactionId: interaction.id,
        agentId: interaction.agentId,
        customerId: interaction.customerId ?? undefined,
      };
    },

    async syncOfflineDraft(input) {
      let seen = ledger.get(input.interactionId);
      if (!seen) {
        seen = new Map();
        ledger.set(input.interactionId, seen);
      }
      const recorded = seen.get(input.idempotencyKey);
      if (recorded) {
        return { interactionId: input.interactionId, ...recorded };
      }

      const interaction = await store.findById(input.interactionId);
      if (!interaction) {
        const record: SyncRecord = { accepted: false, version: 0 };
        seen.set(input.idempotencyKey, record);
        return { interactionId: input.interactionId, ...record };
      }

      const current = versionFor(interaction.id);
      if (input.baseVersion !== current) {
        const record: SyncRecord = { accepted: false, version: current };
        seen.set(input.idempotencyKey, record);
        return { interactionId: interaction.id, ...record };
      }

      const next = current + 1;
      versions.set(interaction.id, next);
      seen.set(input.idempotencyKey, { accepted: true, version: next });
      emit(DomainEvent.DraftSynced, {
        interactionId: interaction.id,
        version: next,
        clientMutationId: input.clientMutationId,
      });
      return { interactionId: interaction.id, accepted: true, version: next };
    },

    async closeInteraction(input) {
      await store.closeInteraction(input.interactionId);
    },
  };
}

export const interactionService = createInteractionService(prismaInteractionStore);
