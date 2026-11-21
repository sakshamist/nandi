"use server";

import { setApplicationDeclarations } from "@/modules/application";

export async function saveApplicationDeclarations(
  applicationId: string,
  accepted: boolean,
): Promise<void> {
  await setApplicationDeclarations(applicationId, { accepted });
}
