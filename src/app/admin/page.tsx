import { prisma } from "@/lib/prisma";
import { getAuditLog } from "@/modules/admin";

export default async function AdminConsole() {
  const [auditEvents, ruleVersions, institutes] = await Promise.all([
    getAuditLog({ limit: 30 }),
    prisma.ruleVersion.findMany({ orderBy: [{ productId: "asc" }, { version: "desc" }] }),
    prisma.institute.findMany({ orderBy: [{ name: "asc" }] }),
  ]);
  const statusLabel = (status: string) => status.replace(/_/g, " ");
  return (
    <main className="flex flex-1 flex-col gap-6 bg-zinc-50 px-6 py-8 text-zinc-900 dark:bg-black">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Admin & supervisor console
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Audit trail, rule versions and institute directory.
          </p>
        </div>
      </header>
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Audit trail</h2>
      <table className="w-full text-sm">
        <thead className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
          <tr>
            <th className="px-4 py-3">Actor</th>
            <th className="px-4 py-3">Action</th>
            <th className="px-4 py-3">Entity</th>
            <th className="px-4 py-3">States</th>
            <th className="px-4 py-3">When</th>
          </tr>
        </thead>
        <tbody>
          {auditEvents.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                No audit events yet.
              </td>
            </tr>
          )}
          {auditEvents.map((event) => (
            <tr
              key={event.id}
              className="border-b border-zinc-200 last:border-b-0 dark:border-zinc-800"
            >
              <td className="px-4 py-3">{event.actorId ?? "SYSTEM"}</td>
              <td className="px-4 py-3">{event.action}</td>
              <td className="px-4 py-3">{event.entityType}</td>
              <td className="px-4 py-3">
                {event.beforeStateJson && event.afterStateJson
                  ? `${event.beforeStateJson} → ${event.afterStateJson}`
                  : statusLabel(event.entityType)}
              </td>
              <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                {event.createdAt.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2 className="mt-6 text-base font-semibold text-zinc-900 dark:text-zinc-100">
        Rule versions
      </h2>
      <table className="w-full text-sm">
        <thead className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
          <tr>
            <th className="px-4 py-3">Product</th>
            <th className="px-4 py-3">Version</th>
            <th className="px-4 py-3">Effective from</th>
          </tr>
        </thead>
        <tbody>
          {ruleVersions.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                No rule versions yet.
              </td>
            </tr>
          )}
          {ruleVersions.map((version) => (
            <tr
              key={version.id}
              className="border-b border-zinc-200 last:border-b-0 dark:border-zinc-800"
            >
              <td className="px-4 py-3">{version.productId}</td>
              <td className="px-4 py-3">{version.version}</td>
              <td className="px-4 py-3">{version.effectiveFrom.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2 className="mt-6 text-base font-semibold text-zinc-900 dark:text-zinc-100">
        Institute directory
      </h2>
      <ul className="mt-2">
        {institutes.length === 0 && (
          <li className="text-sm text-zinc-500 dark:text-zinc-400">No institutes yet.</li>
        )}
        {institutes.map((institute) => (
          <li key={institute.id} className="text-sm text-zinc-600 dark:text-zinc-400">
            {institute.name} — {institute.district}, {institute.state}
          </li>
        ))}
      </ul>
    </main>
  );
}


export const instant = false;
