import { randomUUID } from "node:crypto";
import { connection } from "next/server";
import type { ConversationalInput, ProfileFactProposal } from "@/contracts";
import { proposeProfileFacts } from "@/modules/conversation/propose-profile-facts";
import { ensureFactReviewInteraction } from "@/modules/profile/fact-review-actions";
import WorkspaceShell from "@/components/workspace/workspace-shell";

export default async function WorkspacePage() {
  await connection();
  const { interactionId } = await ensureFactReviewInteraction();
  const input: ConversationalInput = {
    interactionId,
    turnId: `turn-${randomUUID()}`,
    speaker: "AGENT",
    messageText: "Farmer says there are 2 cattle in a small farm.",
    languageCode: "en-IN",
    idempotencyKey: `workspace-fact-review-${randomUUID()}`,
  };
  let proposals: ProfileFactProposal[] = [];
  try {
    proposals = await proposeProfileFacts(input);
  } catch {
    proposals = [];
  }

  return <WorkspaceShell initialProposals={proposals} />;
}

export const instant = false;
