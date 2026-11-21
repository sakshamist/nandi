"use server";

import { VerificationState } from "@/contracts";
import type { ProfileFactProposal } from "@/contracts";
import { prisma } from "@/lib/prisma";
import { interactionService } from "@/modules/interaction";
import { confirmProfileFact, persistProfileFactProposal } from "./profile-facts";

const DEMO_INTERACTION_ID = "workspace-demo";

let demoInteraction: string | null = null;

export async function ensureFactReviewInteraction(): Promise<{ interactionId: string }> {
  if (demoInteraction) {
    return { interactionId: demoInteraction };
  }
  const agent = await prisma.agent.findFirst({ orderBy: { createdAt: "asc" } });
  const agentId = agent?.id ?? "agent-demo";
  const started = await interactionService.startInteraction({
    interactionId: DEMO_INTERACTION_ID,
    agentId,
  });
  demoInteraction = started.interactionId;
  return { interactionId: started.interactionId };
}

export async function confirmProposedFact(input: {
  proposal: ProfileFactProposal;
  value: string;
  actorId?: string;
}): Promise<{ ok: boolean; factId?: string; error?: string }> {
  try {
    const { interactionId } = await ensureFactReviewInteraction();
    const saved = await persistProfileFactProposal(interactionId, input.proposal);
    const agent = await prisma.agent.findFirst({ orderBy: { createdAt: "asc" } });
    const result = await confirmProfileFact({
      factId: saved.id,
      acceptedValue: input.value,
      actorId: input.actorId ?? agent?.id ?? "agent-demo",
      verificationState: VerificationState.AgentConfirmed,
    });
    return { ok: true, factId: result.factId };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to confirm fact" };
  }
}
