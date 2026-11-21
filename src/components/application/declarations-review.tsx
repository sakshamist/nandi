"use client";

import { useState } from "react";
import { saveApplicationDeclarations } from "@/modules/application/declarations-action";

export default function DeclarationsReview({
  applicationId,
  accepted,
}: {
  applicationId: string;
  accepted: boolean;
}) {
  const [declared, setDeclared] = useState(accepted);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleDeclare(value: boolean) {
    setSaving(true);
    await saveApplicationDeclarations(applicationId, value);
    setDeclared(value);
    setMessage(
      value ? "Declarations recorded." : "Declarations recorded as not accepted.",
    );
    setSaving(false);
  }

  return (
    <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
      <input
        type="checkbox"
        checked={declared}
        disabled={saving}
        onChange={(event) => handleDeclare(event.target.checked)}
        className="mt-0.5"
      />
      <span>Agent accepted the application summary and its conditions</span>
      {message && (
        <span className="text-xs text-emerald-600 dark:text-emerald-400">{message}</span>
      )}
    </div>
  );
}
