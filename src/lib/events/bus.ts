import type { DomainEventName, DomainEventPayloadMap } from "@/contracts/events";

type Listener = (name: DomainEventName, payload: unknown) => void;

interface Subscription {
  name: DomainEventName;
  listener: Listener;
}

const subscriptions = new Set<Subscription>();
const anyListeners = new Set<Listener>();

export function emit<K extends DomainEventName>(name: K, payload: DomainEventPayloadMap[K]): void {
  for (const subscription of [...subscriptions]) {
    if (subscription.name === name) {
      subscription.listener(name, payload);
    }
  }
  for (const listener of [...anyListeners]) {
    listener(name, payload);
  }
}

export function on(name: DomainEventName, listener: Listener): () => void {
  const subscription: Subscription = { name, listener };
  subscriptions.add(subscription);
  return () => {
    subscriptions.delete(subscription);
  };
}

export function onAny(listener: Listener): () => void {
  anyListeners.add(listener);
  return () => {
    anyListeners.delete(listener);
  };
}
