export interface ScenarioStep {
  id: string;
  action: string;
  module: string;
  note: string;
}

export const SCENARIOS: Record<string, ScenarioStep[]> = {
  A: [
    {
      id: "A1",
      action: "startInteraction",
      module: "interaction",
      note: "Agent starts interaction in workspace; local draft created in IndexedDB",
    },
    {
      id: "A2",
      action: "proposeProfileFacts + persistProfileFactProposal",
      module: "profile",
      note: "AI proposes facts; platform persists as UNVERIFIED with provenance",
    },
    {
      id: "A3",
      action: "confirmProfileFact",
      module: "profile",
      note: "Agent confirms via fact-review; emits ProfileFactConfirmed; unclear facts stay unconfirmed",
    },
    {
      id: "A4",
      action: "checkIdStatus + recordIdDecision",
      module: "id-referral",
      note: "Customer confirms livestock has RFID; LivestockIdentifier records PRESENT",
    },
    {
      id: "A5",
      action: "rankPolicies",
      module: "recommendation",
      note: "Policy options shown with insurer prerequisites; hard disqualifiers excluded immediately",
    },
    {
      id: "A6",
      action: "selectPolicy",
      module: "checklist",
      note: "Customer selects policy",
    },
    {
      id: "A7",
      action: "generateChecklistInstance",
      module: "checklist",
      note: "Dynamic snapshot: 3-angle photos, VHC, KYC, insurer tagging tasks",
    },
    {
      id: "A8",
      action: "recordEvidenceValidation",
      module: "documents",
      note: "3-angle + VHC pass; deterministic routing completes checklist items",
    },
    {
      id: "A9",
      action: "evaluateSubmissionReadiness + transitionApplication",
      module: "application",
      note: "Validation passes; application transitions profile_incomplete -> ready_for_submission",
    },
    {
      id: "A10",
      action: "submitApplication + pollApplicationStatus",
      module: "application",
      note: "Agent records declarations, submits (idempotent attempt) and tracks status",
    },
  ],
  B1: [
    {
      id: "B1-1",
      action: "startInteraction",
      module: "interaction",
      note: "Agent starts interaction in workspace",
    },
    {
      id: "B1-2",
      action: "checkIdStatus",
      module: "id-referral",
      note: "Early ID check detects tag is ABSENT",
    },
    {
      id: "B1-3",
      action: "createReferralHandoff",
      module: "id-referral",
      note: "Customer expresses interest; referral created; sales flow continues in parallel",
    },
    {
      id: "B1-4",
      action: "proposeProfileFacts + persistProfileFactProposal + confirmProfileFact",
      module: "profile",
      note: "Profiling continues without blocking; facts persisted and confirmed by agent",
    },
    {
      id: "B1-5",
      action: "rankPolicies",
      module: "recommendation",
      note: "Selected insurer has allowsPendingTaggingInspection = true",
    },
    {
      id: "B1-6",
      action: "selectPolicy + generateChecklistInstance",
      module: "checklist",
      note: "Policy selected; checklist flags tagging/inspection as pending",
    },
    {
      id: "B1-7",
      action: "recordEvidenceValidation",
      module: "documents",
      note: "Non-tag evidence and pre-inspection photos validated",
    },
    {
      id: "B1-8",
      action: "transitionApplication",
      module: "application",
      note: "profile_incomplete -> awaiting_tagging_inspection",
    },
    {
      id: "B1-9",
      action: "submitApplication",
      module: "application",
      note: "awaiting_tagging_inspection -> Submitted (pending-tag submission allowed)",
    },
    {
      id: "B1-10",
      action: "pollApplicationStatus",
      module: "application",
      note: "Application moves toward underwriting_review once tag and final VHC validate",
    },
  ],
  B2: [
    {
      id: "B2-1",
      action: "startInteraction",
      module: "interaction",
      note: "Agent starts interaction in workspace",
    },
    {
      id: "B2-2",
      action: "checkIdStatus",
      module: "id-referral",
      note: "Early ID check detects tag is ABSENT",
    },
    {
      id: "B2-3",
      action: "createReferralHandoff",
      module: "id-referral",
      note: "Customer expresses interest; referral created; sales flow continues in parallel",
    },
    {
      id: "B2-4",
      action: "rankPolicies",
      module: "recommendation",
      note: "Selected insurer has requiresTagForSubmission = true",
    },
    {
      id: "B2-5",
      action: "selectPolicy + generateChecklistInstance",
      module: "checklist",
      note: "Checklist includes TAG_REQUIRED_BEFORE_SUBMISSION",
    },
    {
      id: "B2-6",
      action: "transitionApplication",
      module: "application",
      note: "profile_incomplete -> awaiting_tagging_inspection",
    },
    {
      id: "B2-7",
      action: "evaluateSubmissionReadiness",
      module: "application",
      note: "Not eligible: TagRequiredForSubmission; submission button stays disabled with clear reason",
    },
    {
      id: "B2-8",
      action: "recordEvidenceValidation",
      module: "documents",
      note: "Ear tag close-up photo validated; checklist EAR_TAG_PHOTO item completes",
    },
    {
      id: "B2-9",
      action: "evaluateSubmissionReadiness + transitionApplication",
      module: "application",
      note: "Eligible now: awaiting_tagging_inspection -> Submitted after tag verified",
    },
  ],
  C: [
    {
      id: "C1",
      action: "startInteraction",
      module: "interaction",
      note: "Agent starts interaction in workspace",
    },
    {
      id: "C2",
      action: "checkIdStatus",
      module: "id-referral",
      note: "Early ID check reveals animal has no tag (ABSENT)",
    },
    {
      id: "C3",
      action: "declineReferralHandoff",
      module: "id-referral",
      note: "Customer declines institute referral; decision recorded; no repeated prompting",
    },
    {
      id: "C4",
      action: "rankPolicies",
      module: "recommendation",
      note: "Recommendations show ID-mandatory policies with issuer tag requirements",
    },
    {
      id: "C5",
      action: "selectPolicy + generateChecklistInstance",
      module: "checklist",
      note: "Checklist marks tagging task outstanding/blocked until an ID is arranged",
    },
  ],
  D: [
    {
      id: "D1",
      action: "startInteraction",
      module: "interaction",
      note: "Agent starts interaction in workspace",
    },
    {
      id: "D2",
      action: "proposeProfileFacts + confirmProfileFact",
      module: "profile",
      note: "AI infers cooperative from conversation; agent confirms customer type",
    },
    {
      id: "D3",
      action: "rankPolicies + selectPolicy + generateChecklistInstance",
      module: "checklist",
      note: "Group policy recommended and selected; group-level checklist snapshot",
    },
    {
      id: "D4",
      action: "createBulkBatch",
      module: "stubs",
      note: "Bulk entry point shows batch progress stub (not_implemented); individual traceability preserved",
    },
  ],
};
