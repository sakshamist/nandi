import { DomainEvent, EventEmitter } from "@/contracts";
import type { DomainEventEnvelope, DomainEventPayloadMap } from "@/contracts";

export type AiDomainEventName =
  | typeof DomainEvent.ProfileFactProposed
  | typeof DomainEvent.CustomerTypeInferred;

export interface CreateAiEventOptions {
  occurredAt?: string;
  correlationId?: string;
}

export function createAiEvent<K extends AiDomainEventName>(
  name: K,
  payload: DomainEventPayloadMap[K],
  options: CreateAiEventOptions = {},
): DomainEventEnvelope<K> {
  if (EventEmitter[name] !== "AI") {
    throw new Error(`Event ${name} is not owned by AI`);
  }

  return {
    name,
    payload,
    occurredAt: options.occurredAt ?? new Date().toISOString(),
    correlationId: options.correlationId ?? crypto.randomUUID(),
  };
}
