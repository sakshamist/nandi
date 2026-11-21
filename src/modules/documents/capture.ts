"use server";

import type { EvidenceCategory } from "@prisma/client";
import { createPhoto } from "@/modules/documents";

export interface CapturePhotoResult {
  ok: boolean;
  photoId?: string;
  error?: string;
}

export async function capturePhoto(formData: FormData): Promise<CapturePhotoResult> {
  const idempotencyKey = String(formData.get("idempotencyKey") ?? "").trim();
  const category = formData.get("category");
  const hasGeoConsent = formData.get("hasGeoConsent") === "true";
  const deviceInfo = formData.get("deviceInfo");
  const livestockIdentifierId = formData.get("livestockIdentifierId");
  const latitude = formData.get("latitude");
  const longitude = formData.get("longitude");
  const file = formData.get("file");
  if (!idempotencyKey || !category || !file) {
    return { ok: false, error: "Missing idempotency key, category or photo file" };
  }
  const photo = await createPhoto({
    idempotencyKey,
    category: String(category) as EvidenceCategory,
    livestockIdentifierId: livestockIdentifierId ? String(livestockIdentifierId) : null,
    hasGeoConsent,
    deviceInfo: deviceInfo ? String(deviceInfo) : null,
    latitude: typeof latitude === "string" && latitude !== "" ? Number(latitude) : null,
    longitude: typeof longitude === "string" && longitude !== "" ? Number(longitude) : null,
  });
  return { ok: true, photoId: photo.id };
}
