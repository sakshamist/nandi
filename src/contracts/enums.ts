export const ConfidenceBand = {
  High: "high",
  Medium: "medium",
  Low: "low",
} as const;
export type ConfidenceBand = (typeof ConfidenceBand)[keyof typeof ConfidenceBand];

export const VerificationState = {
  Unverified: "unverified",
  AgentConfirmed: "agent_confirmed",
  ExternallyVerified: "externally_verified",
  Rejected: "rejected",
} as const;
export type VerificationState = (typeof VerificationState)[keyof typeof VerificationState];

export const SourceEvidenceType = {
  ConversationTurn: "conversation_turn",
  Document: "document",
  Photo: "photo",
  ProductRule: "product_rule",
} as const;
export type SourceEvidenceType = (typeof SourceEvidenceType)[keyof typeof SourceEvidenceType];

export const ApplicationState = {
  ProfileIncomplete: "profile_incomplete",
  AwaitingTaggingInspection: "awaiting_tagging_inspection",
  ReadyForSubmission: "ready_for_submission",
  Submitted: "submitted",
  UnderwritingReview: "underwriting_review",
  Issued: "issued",
  Rejected: "rejected",
} as const;
export type ApplicationState = (typeof ApplicationState)[keyof typeof ApplicationState];

export const LivestockIdStatus = {
  Present: "present",
  Absent: "absent",
  Unknown: "unknown",
  NotApplicable: "not_applicable",
} as const;
export type LivestockIdStatus = (typeof LivestockIdStatus)[keyof typeof LivestockIdStatus];

export const ChecklistItemStatus = {
  Required: "required",
  Conditional: "conditional",
  Optional: "optional",
  Completed: "completed",
  Waived: "waived",
  Blocked: "blocked",
} as const;
export type ChecklistItemStatus = (typeof ChecklistItemStatus)[keyof typeof ChecklistItemStatus];

export const ValidationStatus = {
  Pending: "pending",
  Pass: "pass",
  Fail: "fail",
  NeedsReview: "needs_review",
} as const;
export type ValidationStatus = (typeof ValidationStatus)[keyof typeof ValidationStatus];

export const FactVerificationState = {
  Unverified: "unverified",
  AgentConfirmed: "agent_confirmed",
  ExternallyVerified: "externally_verified",
  Rejected: "rejected",
} as const;
export type FactVerificationState = (typeof FactVerificationState)[keyof typeof FactVerificationState];

export const CustomerType = {
  Individual: "individual",
  DairyFarm: "dairy_farm",
  Cooperative: "cooperative",
  Other: "other",
} as const;
export type CustomerType = (typeof CustomerType)[keyof typeof CustomerType];

export const Role = {
  Agent: "agent",
  Supervisor: "supervisor",
  Admin: "admin",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const EvidenceRefType = {
  Photo: "photo",
  Document: "document",
} as const;
export type EvidenceRefType = (typeof EvidenceRefType)[keyof typeof EvidenceRefType];

export const ReasonCode = {
  TagRequiredForSubmission: "TAG_REQUIRED_FOR_SUBMISSION",
  TagRequiredForIssuance: "TAG_REQUIRED_FOR_ISSUANCE",
  VhcRequired: "VHC_REQUIRED",
  VhcNotApplicable: "VHC_NOT_APPLICABLE",
  ChecklistIncomplete: "CHECKLIST_INCOMPLETE",
  DeclarationsMissing: "DECLARATIONS_MISSING",
  InsurerAllowsPendingTag: "INSURER_ALLOWS_PENDING_TAG",
  ReferralDoesNotBlock: "REFERRAL_DOES_NOT_BLOCK",
  LowConfidenceReviewRequired: "LOW_CONFIDENCE_REVIEW_REQUIRED",
  BlurryPhoto: "BLURRY_PHOTO",
  PoorIllumination: "POOR_ILLUMINATION",
  IllegibleTag: "ILLEGIBLE_TAG",
  MissingVhcField: "MISSING_VHC_FIELD",
  InvalidStateTransition: "INVALID_STATE_TRANSITION",
  SubmissionTimeout: "SUBMISSION_TIMEOUT",
} as const;
export type ReasonCode = (typeof ReasonCode)[keyof typeof ReasonCode];

const PRISMA_APPLICATION_STATE = {
  [ApplicationState.ProfileIncomplete]: "PROFILE_INCOMPLETE",
  [ApplicationState.AwaitingTaggingInspection]: "AWAITING_TAGGING_INSPECTION",
  [ApplicationState.ReadyForSubmission]: "READY_FOR_SUBMISSION",
  [ApplicationState.Submitted]: "SUBMITTED",
  [ApplicationState.UnderwritingReview]: "UNDERWRITING_REVIEW",
  [ApplicationState.Issued]: "ISSUED",
  [ApplicationState.Rejected]: "REJECTED",
} as const;

const PRISMA_LIVESTOCK_ID_STATUS = {
  [LivestockIdStatus.Present]: "PRESENT",
  [LivestockIdStatus.Absent]: "ABSENT",
  [LivestockIdStatus.Unknown]: "UNKNOWN",
  [LivestockIdStatus.NotApplicable]: "NOT_APPLICABLE",
} as const;

const PRISMA_CHECKLIST_ITEM_STATUS = {
  [ChecklistItemStatus.Required]: "REQUIRED",
  [ChecklistItemStatus.Conditional]: "CONDITIONAL",
  [ChecklistItemStatus.Optional]: "OPTIONAL",
  [ChecklistItemStatus.Completed]: "COMPLETED",
  [ChecklistItemStatus.Waived]: "WAIVED",
  [ChecklistItemStatus.Blocked]: "BLOCKED",
} as const;

const PRISMA_VALIDATION_STATUS = {
  [ValidationStatus.Pending]: "PENDING",
  [ValidationStatus.Pass]: "PASS",
  [ValidationStatus.Fail]: "FAIL",
  [ValidationStatus.NeedsReview]: "NEEDS_REVIEW",
} as const;

const PRISMA_FACT_VERIFICATION_STATE = {
  [FactVerificationState.Unverified]: "UNVERIFIED",
  [FactVerificationState.AgentConfirmed]: "AGENT_CONFIRMED",
  [FactVerificationState.ExternallyVerified]: "EXTERNALLY_VERIFIED",
  [FactVerificationState.Rejected]: "REJECTED",
} as const;

const PRISMA_CUSTOMER_TYPE = {
  [CustomerType.Individual]: "INDIVIDUAL",
  [CustomerType.DairyFarm]: "DAIRY_FARM",
  [CustomerType.Cooperative]: "COOPERATIVE",
  [CustomerType.Other]: "OTHER",
} as const;

const PRISMA_ROLE = {
  [Role.Agent]: "AGENT",
  [Role.Supervisor]: "SUPERVISOR",
  [Role.Admin]: "ADMIN",
} as const;

type PrismaEnumValue<T extends Record<string, string>> = T[keyof T];

function invert<T extends string, U extends string>(map: Record<T, U>): Record<U, T> {
  return Object.fromEntries(Object.entries(map).map(([key, value]) => [value, key])) as Record<U, T>;
}

export const prismaAdapters = {
  applicationState: {
    toPrisma: (value: ApplicationState) => PRISMA_APPLICATION_STATE[value],
    fromPrisma: (value: PrismaEnumValue<typeof PRISMA_APPLICATION_STATE>) => invert(PRISMA_APPLICATION_STATE)[value],
  },
  livestockIdStatus: {
    toPrisma: (value: LivestockIdStatus) => PRISMA_LIVESTOCK_ID_STATUS[value],
    fromPrisma: (value: PrismaEnumValue<typeof PRISMA_LIVESTOCK_ID_STATUS>) => invert(PRISMA_LIVESTOCK_ID_STATUS)[value],
  },
  checklistItemStatus: {
    toPrisma: (value: ChecklistItemStatus) => PRISMA_CHECKLIST_ITEM_STATUS[value],
    fromPrisma: (value: PrismaEnumValue<typeof PRISMA_CHECKLIST_ITEM_STATUS>) => invert(PRISMA_CHECKLIST_ITEM_STATUS)[value],
  },
  validationStatus: {
    toPrisma: (value: ValidationStatus) => PRISMA_VALIDATION_STATUS[value],
    fromPrisma: (value: PrismaEnumValue<typeof PRISMA_VALIDATION_STATUS>) => invert(PRISMA_VALIDATION_STATUS)[value],
  },
  factVerificationState: {
    toPrisma: (value: FactVerificationState) => PRISMA_FACT_VERIFICATION_STATE[value],
    fromPrisma: (value: PrismaEnumValue<typeof PRISMA_FACT_VERIFICATION_STATE>) => invert(PRISMA_FACT_VERIFICATION_STATE)[value],
  },
  customerType: {
    toPrisma: (value: CustomerType) => PRISMA_CUSTOMER_TYPE[value],
    fromPrisma: (value: PrismaEnumValue<typeof PRISMA_CUSTOMER_TYPE>) => invert(PRISMA_CUSTOMER_TYPE)[value],
  },
  role: {
    toPrisma: (value: Role) => PRISMA_ROLE[value],
    fromPrisma: (value: PrismaEnumValue<typeof PRISMA_ROLE>) => invert(PRISMA_ROLE)[value],
  },
} as const;

const CONFIDENCE_SCORES: Record<ConfidenceBand, number> = {
  [ConfidenceBand.High]: 0.9,
  [ConfidenceBand.Medium]: 0.65,
  [ConfidenceBand.Low]: 0.3,
};

export function confidenceBand(score: number): ConfidenceBand {
  if (score >= 0.8) return ConfidenceBand.High;
  if (score >= 0.5) return ConfidenceBand.Medium;
  return ConfidenceBand.Low;
}

export function bandToScore(band: ConfidenceBand): number {
  return CONFIDENCE_SCORES[band];
}

export function serializeSourceEvidence(source: { type: SourceEvidenceType; ref: string }): string {
  return `${source.type}:${source.ref}`;
}

export function deserializeSourceEvidence(value: string): { type: SourceEvidenceType; ref: string } {
  const separator = value.indexOf(":");
  if (separator <= 0) {
    throw new Error(`Invalid source evidence: ${value}`);
  }
  const type = value.slice(0, separator);
  const ref = value.slice(separator + 1);
  if (!(type in SourceEvidenceType)) {
    throw new Error(`Invalid source evidence type: ${type}`);
  }
  return { type: type as SourceEvidenceType, ref };
}
