# DEV_AI.md — AI & Intelligence Workstream

**Developer:** Developer 1 (AI-strong)  
**Integration branch:** `dev/ai`  
**Source of truth:** `SureLM_Architecture_and_Sprint_Plan.md` + `DEV_SPLIT_ADDENDUM.md`  
**Derived-document rule:** This file is a workstream slice. `DEV_SPLIT_ADDENDUM.md` is authoritative for ownership conflicts with the source spec. Product behavior remains governed by the source spec. Do not edit either source document from this workstream; propose changes through `main`.

---

## 1. Shared product context

SureLM is an agent-operated, AI-assisted financial-distribution tool for livestock insurance. The **insurance agent** is the operator; the villager/customer is not expected to understand product taxonomies or forms.

Core principles you must preserve (source: `SureLM_Architecture_and_Sprint_Plan.md:42`–`:52`):

- Agent-led, AI-assisted; conversation before forms; progressive profiling.
- Missing livestock ID triggers a **parallel referral**, never a blocked sale (`:22`–`:25`, `:45`, `:415`).
- Recommendations must be explainable using **approved product rules** (`:49`, `:460`, `:601`).
- Human control: the agent reviews facts, recommendations, documents, photos, and application data before submission (`:51`).
- **No fabricated eligibility or issuance** (`:52`). AI assists with extraction and explanations; only deterministic rules and insurer responses establish eligibility/acceptance/issuance.
- Submission eligibility is decoupled from issuance eligibility (`:34`–`:37`, `:332`, `:809`, `:814`).
- Offline field operation via IndexedDB; never plaintext PII/documents in `localStorage` (`:48`, `:490`–`:499`).

Architecture baseline (`:93`–`:108`): one modular monolith, typed public interfaces, Next.js 16 App Router, React 19, TypeScript, Tailwind, Postgres/Prisma, IndexedDB drafts, Qdrant retrieval, mock-first LLM gateway with optional Gemini on Vertex AI, session/token auth with RBAC. Pilot deployment target: Cloud Run, Cloud SQL for PostgreSQL free trial, Qdrant Cloud Free, and private GCS storage in `project-nandi`; keep AI flags off unless separately funded.

MVP completion definition (`:821`–`:834`) includes conversational profiling, early ID check with parallel referral, explainable recommendation, dynamic checklist, evidence collection/validation, state machine, and submission handoff, with bulk/CRM as honest stubs.

---

## 2. Your ownership boundary

### You own

- **All AI logic** across the product.
- **AI-facing UI panels**: fact-review with confidence/override, explanation cards, low-confidence/anomaly exception review.
- Mock-first inference gateway, optional Vertex AI/Gemini provider seam, prompt management, prompt/model provenance, Qdrant retrieval.
- M3 Conversation Intelligence in full (`:214`–`:226`).
- AI explanation layer for M7 (`:280`, `:460`, `:601`) and AI rationale on `RecommendationRun` (`:436`).
- AI evidence processing for M9 (`:313`, `:461`–`:462`, `:643`–`:644`).
- AI response schema and guardrails (`:474`–`:483`).
- AI-specific regression/eval checks in Sprint 9.

You provide the `ProvenancePayload` from `@/contracts/ai` (`:369`, `:481`); Developer 2's M13 persists it into `PromptMetadata` and `AuditEvent`.

### You do not own

- Deterministic eligibility gates, exclusions, ranking, premium formulas, checklist composition, state transitions, submission/issuance gates (`:464`–`:472`).
- Prisma schema ownership, migrations, seeds, CI, auth/RBAC, object storage, insurer adapter, institute directory.
- Non-AI UI: workspace shell, offline indicator, session UI, ID referral UI, catalogue UI, policy comparison shell/layout, checklist tracker, camera/storage capture shell, application review/declarations, admin/supervisor screens, stubs.

### Suggested code surface

- `src/modules/conversation/**` — full M3 implementation and barrel.
- `src/lib/ai/**` — mock-first inference gateway, optional Vertex AI/Gemini adapter, prompt registry, Qdrant retrieval client, provenance helpers, response schema.
- `src/components/ai/**` — `fact-review-panel`, `explanation-card`, `evidence-exception-review`.
- `src/modules/recommendation/ai/**` — `explainRecommendation` seam.
- `src/modules/documents/ai/**` — `assessEvidenceQuality`, `extractVhcFields` seams.

Developer 2 owns all other `src/modules/**` and `src/components/**`. Cross-module access must go through typed barrel exports; no direct cross-table writes (`:184`, `:528`).

---

## 3. Shared contracts — frozen in code

The Sprint 0 contract freeze is defined under `src/contracts/` in the integration baseline. Import from `@/contracts`; do not redefine these types in your modules. Source behavior: `SureLM_Architecture_and_Sprint_Plan.md:373`–`:415`.

### 3.1 Frozen files

| File | Contents |
|---|---|
| `src/contracts/enums.ts` | Canonical enums, Prisma adapters, `confidenceBand`, `ReasonCode`, `serializeSourceEvidence` |
| `src/contracts/ai.ts` | `AiEnvelope<T>`, `ExplanationResult`, `EvidenceQualityResult`, `VhcExtractionResult`, `ProvenancePayload`, `ProfileFactProposal` |
| `src/contracts/operations.ts` | All operation signatures and handoff seams |
| `src/contracts/events.ts` | Event payloads and the single-emitter registry |
| `src/contracts/rules.ts` | `normalizeInsurerRules`, `evaluateSubmissionReadiness`, `evaluateIssuanceReadiness`, `referralBlocksSubmission` |
| `src/contracts/mocks/index.ts` | Shared fixtures for both workstreams |

### 3.2 Required AI response envelope (non-negotiable, `:474`–`:483`)

`AiEnvelope<T>` from `src/contracts/ai.ts`:

```ts
{
  proposedValue: T
  sourceEvidence: { type: 'conversation_turn' | 'document' | 'photo' | 'product_rule'; ref: string }
  confidence: 'high' | 'medium' | 'low'
  verificationState: 'unverified' | 'agent_confirmed' | 'externally_verified' | 'rejected'
  promptVersion: string
  modelVersion: string
}
```

Rules:
- AI output starts as `unverified` (`:226`).
- Low-confidence output must never be silently promoted to a confirmed fact (`:483`).
- Numeric score → band mapping is centralized in `confidenceBand` (`>= 0.8` high, `>= 0.5` medium, otherwise low).
- Agent confirmation happens in your fact-review UI; call `confirmProfileFact` so Developer 2 persists `ProfileFactConfirmed`.
- `extractVhcFields` carries an aggregate envelope confidence plus per-field confidence on each `VhcField`.

### 3.3 Synchronous operations

All names and signatures live in `src/contracts/operations.ts`.

| Contract | Owner | Notes |
|---|---|---|
| `startInteraction`, `resumeInteraction`, `syncOfflineDraft`, `closeInteraction` | PLATFORM | Canonical names; `syncDraft` is not a contract. |
| `processConversationalInput` | **AI** | Returns `ConversationalTurnResult`. |
| `getNextQuestion` | **AI** | Supports early ID prompt injection (`:577`) and no repeated prompts (`:786`). |
| `proposeProfileFacts` | **AI** | Returns `ProfileFactProposal[]`; does not persist. |
| `confirmProfileFact` | **PLATFORM** | Called by your fact-review UI; emits `ProfileFactConfirmed`. |
| `checkIdStatus`, `recordIdDecision`, `createReferralHandoff` | PLATFORM | You supply ID-related prompt content, not status storage. |
| `getRecommendationContext` | PLATFORM | Input to your explanation layer. |
| `evaluatePolicyEligibility`, `getInsurerPrerequisites` | PLATFORM | Deterministic; your explanations cite these outputs only. |
| `explainRecommendation` | **AI** | Returns `ExplanationResult`. |
| `generateChecklistInstance`, `recalculateChecklist` | PLATFORM | You do not compose checklists. |
| `getPendingEvidenceRequirements` | PLATFORM | Input to your evidence-processing seams. |
| `assessEvidenceQuality` | **AI** | Returns `EvidenceQualityResult`. |
| `extractVhcFields` | **AI** | Returns `VhcExtractionResult`. |
| `recordQualityResult`, `attachRecommendationRationale` | **PLATFORM** | Persistence handoffs into PLATFORM-owned models. |
| `recordEvidenceValidation` | PLATFORM | Applies deterministic routing; you do not set final status. |
| `evaluateSubmissionReadiness`, `evaluateIssuanceReadiness` | PLATFORM | Never bypass. |
| `submitApplication`, `pollApplicationStatus` | PLATFORM | Insurer adapter. |

### 3.4 Domain events — one emitter each

You emit only `ProfileFactProposed` and `CustomerTypeInferred`. You do **not** emit `RecommendationGenerated` or `DocumentValidationCompleted`; you return typed fragments that Developer 2 persists and emits. The full emitter registry is `EventEmitter` in `src/contracts/events.ts`.

Developer 2 emits/persists all other events, including `RecommendationGenerated`, `DocumentValidationCompleted`, `ProfileFactConfirmed`, ID referral events, checklist events, application events, and stubs.

Parallel-flow rule (`:415`): `IdReferralCreated`/`IdReferralDeclined` must never block `RecommendationGenerated`, `PolicySelected`, or transition to `awaiting_tagging_inspection`.

### 3.5 Shared enums/datasets

Frozen in `src/contracts/enums.ts`: application states, ID status, checklist item status, validation status (including `pending`), customer types, confidence bands, verification states, source-evidence types, `ReasonCode`, and Prisma adapters. Insurer flags are normalized by `normalizeInsurerRules`; strict tag requirements override `allowsPendingTaggingInspection`.

---

## 4. Your modules in detail

| Source | Module slice | Your deliverables |
|---|---|---|
| `:214`–`:226` | M3 Conversation Intelligence | Dialogue understanding, single-topic prompts, internal customer/org classification, candidate fact extraction with evidence/confidence/timestamp, contradiction/ambiguity flagging, next-question selection, early ID prompt injection, explanation generation. |
| `:272`–`:283` | M7 AI slice | `explainRecommendation` using only approved rule outputs; rationale, prerequisites/exclusions, missing facts, post-submission steps; `explanation-card` UI mounted in Developer 2's policy comparison shell. |
| `:302`–`:317` | M9 AI slice | `assessEvidenceQuality` (blur, illumination, ear-tag legibility), `extractVhcFields` (vet signoff/license, date, dentition age, milk yield, health status), anomaly flags, `evidence-exception-review` UI. Deterministic `pass/fail/needs_review` remains Developer 2. |
| `:359`–`:369` | M13 prompt slice | Emit prompt/model versions, confidence scores, raw evidence references, and human-override metadata for `AuditEvent`/`PromptMetadata`; do not own the audit store. |
| `:106`–`:107` | Infrastructure | Qdrant retrieval for product knowledge/guidelines; mock-first LLM gateway with optional Vertex AI/Gemini adapter and provenance. |

---

## 5. Sprint-by-sprint work

### Sprint 0 — Contract freeze (joint with Developer 2)

Source: `SureLM_Architecture_and_Sprint_Plan.md:507`–`:528`.

- [ ] Branch `dev/ai` from the contract-freeze commit on `main`; do not redefine frozen types.
- [ ] Import `AiEnvelope<T>` and result types from `@/contracts/ai`.
- [ ] Implement gateway interfaces behind `src/lib/ai/**`: provider routing, prompt lookup, retrieval lookup, provenance payload.
- [ ] Implement `explainRecommendation`, `assessEvidenceQuality`, `extractVhcFields` against the frozen signatures.
- [ ] Import shared fixtures from `@/contracts/mocks` (section 6).
- [ ] Emit `ProvenancePayload` for M13 persistence; do not create a `PromptMetadata` table.

**Acceptance:** `npm run typecheck` passes against frozen contracts; no direct cross-table writes.

### Sprint 1 — No owned feature work

Source: `:530`–`:549`. Developer 2 owns the entire sprint.

- [ ] Provide mock conversational responses if Developer 2 needs them for workspace/orchestrator smoke tests.
- [ ] Keep `dev/ai` rebased on `main`.

### Sprint 2 — Conversational profiling & customer inference

Source: `:551`–`:570`.

- [ ] Implement conversational turn API/port and prompt management (`:556`).
- [ ] Build extraction engine for customer, farm scale, livestock count, ownership (`:557`).
- [ ] Implement internal classification inference: individual owner vs commercial dairy vs cooperative (`:558`).
- [ ] Build progressive question selection for missing policy-relevant fields (`:559`).
- [ ] Build `fact-review-panel` with confidence scores and manual override controls (`:560`).
- [ ] Emit `ProfileFactProposed` / `CustomerTypeInferred`; never auto-confirm.
- [ ] Consume mocked `getRecommendationContext` until Developer 2's profile service lands.

**Deliverables:** conversation intelligence module, fact-review component (you); profile management service (Developer 2, `:564`).

**Acceptance:** structured facts extracted without taxonomy menus; questions target only missing fields; unclear facts surfaced for agent confirmation (`:568`–`:570`).

### Sprint 3 — Early ID prompt in conversation

Source: `:572`–`:591`.

- [ ] Inject early livestock ID prompt into `getNextQuestion` (`:577`).
- [ ] Respect ID statuses `present|absent|unknown|not_applicable` supplied by Developer 2.
- [ ] Ensure declined referrals are not re-prompted (`:786`).
- [ ] Keep referral events independent of recommendation/selection flow (`:415`).

Developer 2 owns ID status recording, institute handoff, directory UI, initial state wiring (`:578`–`:586`).

**Acceptance:** ID checked early; sales conversation continues immediately whether referral is accepted or declined (`:589`–`:591`).

### Sprint 4 — Explainable recommendation

Source: `:593`–`:612`.

- [ ] Implement `explainRecommendation` (`:601`) using only `evaluatePolicyEligibility` / `getInsurerPrerequisites` outputs from Developer 2.
- [ ] Render rationale, prerequisites/exclusions, missing facts, and post-submission requirements in `explanation-card` (`:280`, `:611`).
- [ ] Mount your card in Developer 2's policy comparison UI; do not own the comparison shell/layout (`:602`, `:607`).
- [ ] Return rationale + prompt/model provenance in `ExplanationResult` for Developer 2 to persist through `attachRecommendationRationale`; do not write models directly (`:436`).

Developer 2 owns catalogue, versioned rules, insurer constraints, deterministic filter/ranking, hard disqualifiers, comparison shell (`:598`–`:600`, `:602`, `:605`, `:607`, `:612`).

**Acceptance:** recommendations clearly state why they match, missing facts, and post-selection requirements (`:611`); no AI-generated eligibility.

### Sprint 5 — No owned feature work

Source: `:614`–`:634`. Developer 2 owns the entire sprint.

- [ ] Verify explanation cards still render correctly once checklist snapshots are generated.
- [ ] Keep AI seams stable for evidence requirements.

### Sprint 6 — AI evidence processing

Source: `:636`–`:657`.

- [ ] Implement `assessEvidenceQuality`: blur, illumination, ear-tag readability (`:643`).
- [ ] Implement `extractVhcFields`: vet signoff/license number, date, dentition age, milk yield, certified health status (`:644`).
- [ ] Return reason codes with every score/extraction using the AI response envelope.
- [ ] Build `evidence-exception-review` for low-confidence or failed validations (`:645`).
- [ ] Hand results to Developer 2's `recordEvidenceValidation`; you do not set final `pass/fail/needs_review` (`:314`, `:471`).
- [ ] Consume `getPendingEvidenceRequirements` from Developer 2.

Developer 2 owns camera/storage capture, metadata, deterministic routing, checklist auto-update, document service (`:641`–`:642`, `:646`, `:649`). The agent review/manual confirmation UI (`:645`, `:651`) is yours: `evidence-exception-review`.

**Acceptance:** blurry photos or illegible ear tags trigger a warning/retake request; low-confidence extraction requires agent review (`:656`, `:314`).

### Sprint 7 — No owned feature work

Source: `:659`–`:687`. Developer 2 owns state machine and insurer handoff.

- [ ] Ensure AI outputs never influence `issued` or `submitted` transitions.
- [ ] Verify provenance payloads are available for audit trail checks.

### Sprint 8 — No owned feature work

Source: `:689`–`:706`. Developer 2 owns stubs.

- [ ] Confirm no AI logic is imported into stub flows.

### Sprint 9 — AI regression, eval & hardening

Source: `:708`–`:727`.

- [ ] Run AI-specific regression checks: prompt/model version capture, extraction consistency, confidence-threshold behavior, no silent low-confidence promotion, explanation grounding in approved rules.
- [ ] Cover AI-related E2E steps: A step 2 (`:750`); B1 steps 1/3 (`:761`, `:763`); B2 steps 1/3 shared with B1 (`:774`, `:763`); C steps 1/3 (`:784`, `:786`); D step 1 (`:792`). Section 9 is authoritative for lead/support splits.
- [ ] Validate exception review under simulated low-confidence and quality failures (`:716`).
- [ ] Confirm all AI suggestions/overrides appear in audit trail (`:727`).

**Acceptance:** all E2E scenarios pass; no data loss on network interruption; full audit trail generated.

---

## 6. Mocks & parallel development

Provide these mocks to Developer 2 from day one:

| Mock | Shape | Purpose |
|---|---|---|
| `mockProcessConversationalInput` | turns + candidate facts + next question | workspace/orchestrator smoke tests |
| `mockEarlyIdPrompt` | injected question + ID status fixture | Sprint 3 referral tests (`:577`) |
| `mockProposeProfileFacts` | AI envelope array | profile service tests |
| `mockExplainRecommendation` | rationale + prerequisites + missing facts | policy comparison UI layout |
| `mockAssessEvidenceQuality` | scores + reason codes + confidence | validation routing tests |
| `mockExtractVhcFields` | candidate fields + confidence | document review tests |

Consume these mocks from Developer 2:

- `getRecommendationContext` fixture with verified profile/livestock facts.
- `evaluatePolicyEligibility` / `getInsurerPrerequisites` fixtures including all rule flags.
- `getPendingEvidenceRequirements` fixture with 3-angle photos, VHC, KYC, pre/post tagging tasks.
- `recordEvidenceValidation` stub for integration tests.
- `AuditEvent`/`PromptMetadata` persistence stub.

---

## 7. Test checklist

- [ ] Every AI response has all five envelope fields.
- [ ] `unverified` is the default verification state.
- [ ] Low-confidence output requires explicit agent review; never auto-promoted.
- [ ] Contradictory/ambiguous answers are flagged, not guessed.
- [ ] Early ID prompt appears once and does not block referral or sales flow.
- [ ] Explanations cite only deterministic rule outputs; no invented eligibility/issuance.
- [ ] Quality/OCR failures return reason codes and route to exception review.
- [ ] Prompt/model versions appear in audit metadata.
- [ ] Voice-input boundary remains channel-agnostic (deferred per `:817`).
- [ ] No plaintext PII/documents in `localStorage`.

---

## 8. Git & integration workflow

- `main` holds the contract freeze and sprint integration merges.
- Work from `dev/ai`; task branches `dev/ai/*` merge back into `dev/ai` via PR.
- Rebase/merge `main` into `dev/ai` daily; open integration PRs to `main` at each sprint boundary.
- Cross-stream changes require a contract change PR to `main` first, then both workstreams pick it up.
- Developer 2 owns the feature-flag registry; you declare required flag names in `@/contracts` before Sprint 2.

---

## 9. E2E ownership map

| Scenario | You lead | You support (Developer 2 leads) |
|---|---|---|
| A — ID present (`:747`) | 2a conversation/inference | 2b fact persistence; 4b explanation card; 1, 3, 5–9 |
| B1 — referral accepted, pending submission allowed (`:759`) | 1a prompt delivery, 3 no-repeat prompt | 1b ID status recording; 4b explanation card; 2, 4a, 5–10 |
| B2 — referral accepted, tag mandatory (`:772`) | 1a, 3 (shared with B1) | 1b, 2, 4b, 4–7 |
| C — referral declined (`:782`) | 1a early ID prompt, 3 no-repeat prompt | 1b early ID status recording; 2, 4a/b, 5 |
| D — cooperative (`:790`) | 1 inference | 2–5 |

---

## 10. Done criteria for this workstream

- All AI logic and AI-facing UI listed above is implemented behind typed seams.
- Developer 2 can replace every mock with a real implementation without changing your public contracts.
- No deterministic rule, checklist, state transition, or insurer response is generated by AI.
- Sprint 9 AI regression checks pass and audit/provenance metadata is complete.
