import type { Document, EvidenceCategory, PhotoEvidence } from "@prisma/client";
import { DomainEvent } from "@/contracts/events";
import { emit } from "@/lib/events/bus";
import { prisma } from "@/lib/prisma";
import { signUrl } from "@/lib/storage/gcs";

export interface CreatePhotoInput {
  idempotencyKey: string;
  category: EvidenceCategory;
  livestockIdentifierId?: string | null;
  livestockRecordId?: string | null;
  hasGeoConsent: boolean;
  deviceInfo?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export async function createPhoto(input: CreatePhotoInput): Promise<PhotoEvidence> {
  const consent = input.hasGeoConsent === true;
  const photo = await prisma.photoEvidence.create({
    data: {
      idempotencyKey: input.idempotencyKey,
      livestockIdentifierId: input.livestockIdentifierId ?? null,
      livestockRecordId: input.livestockRecordId ?? null,
      category: input.category,
      storageUri: signUrl(`photos/${input.idempotencyKey}`, { method: "GET" }).url,
      hasGeoConsent: consent,
    },
  });
  await prisma.captureMetadata.create({
    data: {
      photoEvidenceId: photo.id,
      capturedAt: new Date(),
      deviceInfo: input.deviceInfo ?? null,
      latitude: consent ? (input.latitude ?? null) : null,
      longitude: consent ? (input.longitude ?? null) : null,
      hasGeoConsent: consent,
    },
  });
  emit(DomainEvent.PhotoEvidenceCaptured, {
    photoId: photo.id,
    category: photo.category,
  });
  return photo;
}

export async function getPhotoHistory(livestockIdentifierId: string): Promise<PhotoEvidence[]> {
  return prisma.photoEvidence.findMany({
    where: { livestockIdentifierId },
    orderBy: [{ createdAt: "asc" }],
  });
}

export interface CreateDocumentInput {
  idempotencyKey: string;
  category: EvidenceCategory;
  title: string;
  customerId?: string | null;
  hasUploadConsent: boolean;
}

export async function createDocument(input: CreateDocumentInput): Promise<Document> {
  return prisma.document.create({
    data: {
      idempotencyKey: input.idempotencyKey,
      category: input.category,
      title: input.title,
      storageUri: signUrl(`documents/${input.idempotencyKey}`, { method: "GET" }).url,
      hasUploadConsent: input.hasUploadConsent,
    },
  });
}

export async function getDocumentHistory(customerId: string): Promise<Document[]> {
  return prisma.document.findMany({ where: { customerId }, orderBy: [{ createdAt: "asc" }] });
}
