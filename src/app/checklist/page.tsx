import { prisma } from "@/lib/prisma";

export default async function ChecklistTracker() {
  const instances = await prisma.checklistInstance.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 10,
    include: { items: { orderBy: { code: "asc" } } },
  });
  return (
    <main className="flex flex-1 flex-col gap-6 bg-zinc-50 px-6 py-8 text-zinc-900 dark:bg-black">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Checklist tracker
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Progress for the selected policy: photos, VHC and tasks.
          </p>
        </div>
      </header>
      {instances.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No checklist yet — select a policy first.
        </p>
      )}
      <div className="flex flex-col gap-4">
        {instances.map((instance) => {
          const total = instance.items.length;
          const completed = instance.items.filter((item) => item.status === "COMPLETED").length;
          const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
          return (
            <article
              key={instance.id}
              className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {instance.id}
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {completed} of {total} done · {percent}%
                </p>
              </div>
              <table className="mt-4 w-full text-sm">
                <tbody>
                  {instance.items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-zinc-200 last:border-b-0 dark:border-zinc-800"
                    >
                      <td className="py-2 pr-4 font-medium text-zinc-900 dark:text-zinc-100">
                        {item.code}
                      </td>
                      <td className="py-2 pr-4 text-zinc-500 dark:text-zinc-400">{item.category}</td>
                      <td className="py-2 text-right text-zinc-500 dark:text-zinc-400">
                        {item.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          );
        })}
      </div>
    </main>
  );
}


export const instant = false;
