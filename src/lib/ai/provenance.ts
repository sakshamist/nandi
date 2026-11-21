import type {
  AiEnvelope,
  ConfidenceBand,
  ProvenancePayload,
  ReasonCode,
  SourceEvidence,
} from "@/contracts";
import { VerificationState } from "@/contracts";

export interface CreateEnvelopeInput<T> {
  proposedValue: T;
  sourceEvidence: SourceEvidence;
  confidence: ConfidenceBand;
  promptVersion: string;
  modelVersion: string;
}

export function createEnvelope<T>(input: CreateEnvelopeInput<T>): AiEnvelope<T> {
  return {
    proposedValue: input.proposedValue,
    sourceEvidence: input.sourceEvidence,
    confidence: input.confidence,
    verificationState: VerificationState.Unverified,
    promptVersion: input.promptVersion,
    modelVersion: input.modelVersion,
  };
}

export interface BuildProvenanceInput<T> {
  envelope: AiEnvelope<T>;
  promptKey: string;
  provider: string;
  reasonCodes: ReasonCode[];
  rawEvidenceRef: string;
}

export function buildProvenance<T>(input: BuildProvenanceInput<T>): ProvenancePayload {
  return {
    promptKey: input.promptKey,
    promptVersion: input.envelope.promptVersion,
    modelVersion: input.envelope.modelVersion,
    provider: input.provider,
    confidence: input.envelope.confidence,
    sourceEvidence: input.envelope.sourceEvidence,
    reasonCodes: input.reasonCodes,
    rawEvidenceRef: input.rawEvidenceRef,
  };
}
