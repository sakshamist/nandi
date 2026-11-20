import { prisma } from "@/lib/prisma";
import DeclarationsReview from "@/components/application/declarations-review";

export default async function ApplicationShell() {
  const applications = await prisma.application.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 10,
    include: { product: true },
  });
  const isDeclared = (application: { declarationsJson: string | null }) =>
    application.declarationsJson ? JSON.parse(application.declarationsJson).accepted === true : false;
  return (
    <main className="flex flex-1 flex-col gap-6 bg-zinc-50 px-6 py-8 text-zinc-900 dark:bg-black">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Applications
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Review application summaries and record customer declarations.
          </p>
        </div>
      </header>
      {applications.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No applications yet.</p>
      )}
      <div className="flex flex-col gap-4">
        {applications.map((application) => (
          <article
            key={application.id}
            className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {application.product.name}
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">State: {application.state}</p>
              </div>
              <DeclarationsReview
                applicationId={application.id}
                accepted={isDeclared(application)}
              />
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
