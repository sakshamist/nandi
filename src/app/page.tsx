export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 px-6 py-16 text-center dark:bg-black">
      <div className="rounded-full border border-emerald-600/30 bg-emerald-50 px-4 py-1 text-sm font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
        Contract-freeze baseline
      </div>
      <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        SureLM Agent Workspace
      </h1>
      <p className="max-w-xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
        The application shell is intentionally minimal. Feature work is split between the AI and
        platform workstreams defined in DEV_AI.md and DEV_PLATFORM.md.
      </p>
      <div className="grid w-full max-w-xl gap-3 text-left sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Developer 1</p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">AI logic and AI-facing UI</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Developer 2</p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Platform, workflow and non-AI UI</p>
        </div>
      </div>
    </main>
  );
}
