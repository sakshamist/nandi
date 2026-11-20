import { ApplicationState, ReasonCode } from "./enums";
import type { InsurerPrerequisites } from "./operations";

export interface NormalizedInsurerRules {
  productId: string;
  requiresTagForSubmission: boolean;
  allowsPendingTaggingInspection: boolean;
  requiresTagForIssuance: boolean;
  requiresVhc: boolean;
  vhcRequirements: string[];
  canSubmitPendingTag: boolean;
  vhcGate: "required" | "not_applicable";
  tagGateForIssuance: true;
}

export interface SubmissionReadinessInput {
  applicationId: string;
  fromState: ApplicationState;
  rules: NormalizedInsurerRules;
  idStatus: "present" | "absent" | "unknown" | "not_applicable";
  tagVerified: boolean;
  vhcValid: boolean;
  checklistComplete: boolean;
  declarationsAccepted: boolean;
  referralStatus: "PENDING" | "HANDOFF_COMPLETED" | "APPOINTMENT_SCHEDULED" | "TAGGED" | "CANCELLED";
}

export interface ReadinessDecision {
  eligible: boolean;
  reasonCodes: ReasonCode[];
  toState: ApplicationState;
}

export interface IssuanceReadinessInput {
  applicationId: string;
  fromState: ApplicationState;
  rules: NormalizedInsurerRules;
  tagVerified: boolean;
  vhcValid: boolean;
  insurerAccepted: boolean;
}

const BLOCKING_REASON_CODES = new Set<ReasonCode>([
  ReasonCode.TagRequiredForSubmission,
  ReasonCode.TagRequiredForIssuance,
  ReasonCode.VhcRequired,
  ReasonCode.ChecklistIncomplete,
  ReasonCode.DeclarationsMissing,
  ReasonCode.InvalidStateTransition,
  ReasonCode.SubmissionTimeout,
]);

export function normalizeInsurerRules(prerequisites: InsurerPrerequisites): NormalizedInsurerRules {
  const canSubmitPendingTag =
    prerequisites.allowsPendingTaggingInspection && !prerequisites.requiresTagForSubmission;

  return {
    productId: prerequisites.productId,
    requiresTagForSubmission: prerequisites.requiresTagForSubmission,
    allowsPendingTaggingInspection: canSubmitPendingTag,
    requiresTagForIssuance: prerequisites.requiresTagForIssuance,
    requiresVhc: prerequisites.requiresVhc,
    vhcRequirements: prerequisites.vhcRequirements,
    canSubmitPendingTag,
    vhcGate: prerequisites.requiresVhc ? "required" : "not_applicable",
    tagGateForIssuance: true,
  };
}

export function referralBlocksSubmission(
  _rules: NormalizedInsurerRules,
  _referralStatus: SubmissionReadinessInput["referralStatus"],
): false {
  void _rules;
  void _referralStatus;
  return false;
}

export function evaluateSubmissionReadiness(input: SubmissionReadinessInput): ReadinessDecision {
  const reasonCodes: ReasonCode[] = [];

  if (!input.checklistComplete) {
    reasonCodes.push(ReasonCode.ChecklistIncomplete);
  }
  if (!input.declarationsAccepted) {
    reasonCodes.push(ReasonCode.DeclarationsMissing);
  }

  if (!input.tagVerified) {
    if (input.rules.canSubmitPendingTag) {
      reasonCodes.push(ReasonCode.InsurerAllowsPendingTag);
    } else {
      reasonCodes.push(ReasonCode.TagRequiredForSubmission);
    }
  }

  if (input.rules.vhcGate === "required" && !input.vhcValid) {
    reasonCodes.push(ReasonCode.VhcRequired);
  } else if (input.rules.vhcGate === "not_applicable") {
    reasonCodes.push(ReasonCode.VhcNotApplicable);
  }

  if (!referralBlocksSubmission(input.rules, input.referralStatus)) {
    reasonCodes.push(ReasonCode.ReferralDoesNotBlock);
  }

  const eligible = !reasonCodes.some((code) => BLOCKING_REASON_CODES.has(code));

  const vhcSatisfied = input.rules.vhcGate === "not_applicable" || input.vhcValid;
  let toState = input.fromState;
  if (eligible && input.tagVerified && vhcSatisfied) {
    toState = ApplicationState.ReadyForSubmission;
  } else if (eligible && input.rules.canSubmitPendingTag) {
    toState = ApplicationState.AwaitingTaggingInspection;
  }

  return { eligible, reasonCodes, toState };
}

export function evaluateIssuanceReadiness(input: IssuanceReadinessInput): ReadinessDecision {
  const reasonCodes: ReasonCode[] = [];

  if (!input.tagVerified) {
    reasonCodes.push(ReasonCode.TagRequiredForIssuance);
  }
  if (input.rules.vhcGate === "required" && !input.vhcValid) {
    reasonCodes.push(ReasonCode.VhcRequired);
  }
  if (!input.insurerAccepted) {
    reasonCodes.push(ReasonCode.InvalidStateTransition);
  }

  const eligible = !reasonCodes.some((code) => BLOCKING_REASON_CODES.has(code));
  return {
    eligible,
    reasonCodes,
    toState: eligible ? ApplicationState.Issued : input.fromState,
  };
}

export const RULE_TRUTH_TABLE = [
  {
    requiresTagForSubmission: false,
    allowsPendingTaggingInspection: true,
    canSubmitPendingTag: true,
  },
  {
    requiresTagForSubmission: false,
    allowsPendingTaggingInspection: false,
    canSubmitPendingTag: false,
  },
  {
    requiresTagForSubmission: true,
    allowsPendingTaggingInspection: true,
    canSubmitPendingTag: false,
  },
  {
    requiresTagForSubmission: true,
    allowsPendingTaggingInspection: false,
    canSubmitPendingTag: false,
  },
] as const;
