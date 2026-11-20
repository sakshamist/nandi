"use client";

import { useEffect, useState } from "react";
import { drafts, isOnline, subscribeOffline } from "@/modules/workspace";

const SECTIONS = [
  { id: "conversation", label: "Conversation & facts", note: "Find out the farm details — livestock count and ownership." },
  { id: "livestock-id", label: "Livestock ID check", note: "Has the animal got a tag or RFID yet?" },
  { id: "recommendations", label: "Policy recommendations", note: "Why a policy matches, and what you need before submission." },
  { id: "checklist", label: "Checklist", note: "Photos, VHC and tasks for the selected policy." },
  { id: "documents", label: "Documents & photos", note: "Full-body, ear-tag and owner+animal photos with consent metadata." },
];

export default function WorkspaceShell() {
  const [offline, setOffline] = useState(() => !isOnline());
  const [pendingDrafts, setPendingDrafts] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const unsubscribe = subscribeOffline((online) => setOffline(!online));
    drafts()
      .then((store) => store.list())
      .then((list) => {
        if (!cancelled) setPendingDrafts(list.length);
      });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return (
    <main className="flex flex-1 flex-col gap-6 bg-zinc-50 px-6 py-8 text-zinc-900 dark:bg-black">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            SureLM Agent Workspace
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Stay connected to your work, even when the field link drops.
          </p>
        </div>
        {pendingDrafts !== null && (
          <p className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950">
            Drafts saved locally: <span className="font-medium">{pendingDrafts}</span>
          </p>
        )}
      </header>

      {offline && (
        <div
          role="status"
          className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-100"
        >
          You are offline. Keep working here — your work saves to this device and syncs when you reconnect.
        </div>
      )}

      <section aria-label="Workspace sections" className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <article
            key={section.id}
            className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{section.label}</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{section.note}</p>
            <div className="mt-3">
              <span
                className={
                  offline
                    ? "rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800"
                    : "rounded-md bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800"
                }
              >
                {offline ? "Ready for offline work" : "Synced"}
              </span>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
