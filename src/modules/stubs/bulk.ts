import type { BulkBatch, BatchItemStub } from "@prisma/client";
import { DomainEvent } from "@/contracts/events";
import { emit } from "@/lib/events/bus";
import { prisma } from "@/lib/prisma";

export interface CreateBulkBatchInput {
  organisationId: string;
  batchName: string;
  items: Array<{ customerId?: string | null; livestockRecordId?: string | null }>;
}

export async function createBulkBatch(
  input: CreateBulkBatchInput,
): Promise<{ batch: BulkBatch; items: BatchItemStub[] }> {
  const batch = await prisma.bulkBatch.create({
    data: {
      organisationId: input.organisationId,
      batchName: input.batchName,
      totalRecords: input.items.length,
      status: "STUB_NOT_IMPLEMENTED",
      notes: "Bulk validation stub: batch queued as not_implemented (M11)",
    },
  });
  const items: BatchItemStub[] = [];
  for (const item of input.items) {
    items.push(
      await prisma.batchItemStub.create({
        data: {
          batchId: batch.id,
          customerId: item.customerId ?? null,
          livestockRecordId: item.livestockRecordId ?? null,
          status: "STUB_NOT_IMPLEMENTED",
          notes: "Bulk validation stub: not_implemented (M11)",
        },
      }),
    );
  }
  emit(DomainEvent.BulkValidationRequested, { batchId: batch.id });
  return { batch, items };
}

export async function getBulkBatch(batchId: string): Promise<BulkBatch | null> {
  return prisma.bulkBatch.findUnique({ where: { id: batchId } }) ?? null;
}

export async function listBulkBatches(organisationId?: string): Promise<BulkBatch[]> {
  return prisma.bulkBatch.findMany({
    where: organisationId ? { organisationId } : {},
    orderBy: [{ createdAt: "desc" }],
  });
}

export interface BulkBatchProgress {
  total: number;
  processed: number;
  percent: number;
  notImplemented: true;
}

export async function getBatchProgress(batchId: string): Promise<BulkBatchProgress> {
  const batch = await getBulkBatch(batchId);
  if (!batch) {
    throw new Error(`BulkBatch not found: ${batchId}`);
  }
  const total = batch.totalRecords;
  const percent = total === 0 ? 0 : Math.round((batch.processedRecords / total) * 100);
  return { total, processed: batch.processedRecords, percent, notImplemented: true };
}
