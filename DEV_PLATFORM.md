# DEV_PLATFORM.md — Platform, Workflow & Non-AI Experience Workstream

**Developer:** Developer 2  
**Integration branch:** `dev/platform`  
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

- Repository bootstrap, Prisma schema/migrations/seeds, CI, auth/RBAC, module barrels.
- All non-AI modules: M1, M2, M4, M5, M6, M8, M10, M11, M12.
- Deterministic half of M7: eligibility filters, missing-fact detection, ranking, hard disqualifiers, insurer rule outputs (`:276`–`:279`, `:598`–`:600`, `:612`).
- Non-AI half of M9: secure storage, camera/capture shell, capture metadata, deterministic `pass/fail/needs_review` routing, validation history, checklist auto-update (`:307`–`:312`, `:314`–`:317`, `:641`–`:642`, `:646`).
- M13 audit store, RBAC, admin/supervisor UI, and `PromptMetadata` persistence (`:359`–`:369`, `:487`–`:499`).
- All UI except AI panels: workspace shell, offline indicator, session UI, ID referral UI, institute directory, policy comparison shell/layout, checklist tracker, capture shell, application review/declarations, stubs.
- All integrations: institute directory/handoff, private GCS bucket with signed URLs, insurer submission adapter with idempotency, non-AI Sprint 9 hardening.

### You do not own

- LLM/inference gateway, prompt management, prompt/model provenance generation, Qdrant retrieval.
- Candidate fact extraction, customer-type inference, next-question selection, contradiction flagging.
- AI recommendation rationale generation, AI quality scoring, OCR/VHC field extraction, anomaly flags.
- AI-facing UI panels: fact-review with confidence/override, explanation cards, evidence exception review. Developer 1 owns these.

### Deliberate reassignments from the source sprint text

| Source item | Owner now |
|---|---|
| `:560` fact-review UI with confidence/override | Developer 1 (AI UI) |
| `:601` plain-language explanations | Developer 1 (AI logic) |
| `explanation-card` inside policy comparison | Developer 1; you own the comparison shell/layout (`:602`, `:607`) |
| `:643` photo quality checks | Developer 1 |
| `:644` VHC extraction | Developer 1 |
| `:645` agent exception review screen | Developer 1 |
| `PromptMetadata` payload generation | Developer 1; you persist it (`:369`) |

### Suggested code surface

- `prisma/**`, CI config, `src/lib/auth/**`, `src/lib/storage/**` (GCS adapter), `src/lib/insurer/**`.
- `src/modules/workspace/**`, `interaction/**`, `profile/**`, `id-referral/**`, `catalogue/**`, `checklist/**`, `application/**`, `stubs/**`, `admin/**`.
- `src/modules/recommendation/**` **excluding** `src/modules/recommendation/ai/**`.
- `src/modules/documents/**` **excluding** `src/modules/documents/ai/**`.
- `src/components/**` **excluding** `src/components/ai/**`.

Developer 1 owns `src/modules/conversation/**`, `src/lib/ai/**`, `src/components/ai/**`, and the two `.../ai/**` sub-barrels above. Cross-module access must go through typed barrel exports; no direct cross-table writes (`:184`, `:528`).

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

### 3.2 AI response envelope (you consume/persist, never generate)

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
- Store AI output as `unverified` until the AI-owned fact-review UI signals agent confirmation through `confirmProfileFact` (`:226`).
- Never silently promote low-confidence output (`:483`); `confidenceBand` is centralized in `@/contracts/enums`.
- Persist `ProvenancePayload` into `PromptMetadata` and `AuditEvent` (`:366`, `:369`, `:481`).
- `serializeSourceEvidence` / `deserializeSourceEvidence` are the only `sourceEvidence` ↔ Prisma string conversions.

### 3.3 Synchronous operations

All names and signatures live in `src/contracts/operations.ts`.

| Contract | Owner | Notes |
|---|---|---|
| `startInteraction`, `resumeInteraction`, `syncOfflineDraft`, `closeInteraction` | **PLATFORM** | Canonical names; `syncDraft` is not a contract. |
| `processConversationalInput` | AI | Returns `ConversationalTurnResult`. |
| `getNextQuestion` | AI | Supports early ID prompt injection (`:577`). |
| `proposeProfileFacts` | AI | You persist the proposal; emit `ProfileFactConfirmed` only via `confirmProfileFact`. |
| `confirmProfileFact` | **PLATFORM** | Called by Developer 1's fact-review UI; you emit `ProfileFactConfirmed`. |
| `checkIdStatus`, `recordIdDecision`, `createReferralHandoff` | **PLATFORM** | Parallel referral must not block sales. |
| `getRecommendationContext` | **PLATFORM** | Verified facts only. |
| `evaluatePolicyEligibility`, `getInsurerPrerequisites` | **PLATFORM** | Deterministic; feeds AI explanations. |
| `explainRecommendation` | AI | Mount `ExplanationResult` in your comparison shell. |
| `generateChecklistInstance`, `recalculateChecklist` | **PLATFORM** | Point-in-time snapshots. |
| `getPendingEvidenceRequirements` | **PLATFORM** | Feeds AI quality/OCR seams. |
| `assessEvidenceQuality` | AI | Returns `EvidenceQualityResult`. |
| `extractVhcFields` | AI | Returns `VhcExtractionResult`. |
| `recordQualityResult`, `attachRecommendationRationale` | **PLATFORM** | Persistence handoffs into your models. |
| `recordEvidenceValidation` | **PLATFORM** | Consumes AI results, applies deterministic routing (`:389`). |
| `evaluateSubmissionReadiness`, `evaluateIssuanceReadiness` | **PLATFORM** | Driven by `@/contracts/rules`. |
| `submitApplication`, `pollApplicationStatus` | **PLATFORM** | Idempotency keys required (`:499`, `:675`). |

### 3.4 Domain events — one emitter each

You emit and persist every event except `ProfileFactProposed` and `CustomerTypeInferred`. In particular, you are the **sole emitter** of `RecommendationGenerated` and `DocumentValidationCompleted` (`:403`, `:407`); Developer 1 returns typed fragments only. The emitter registry is `EventEmitter` in `src/contracts/events.ts`.

Parallel-flow rule (`:415`): `IdReferralCreated`/`IdReferralDeclined` must never block `RecommendationGenerated`, `PolicySelected`, or transition to `awaiting_tagging_inspection`.

### 3.5 Shared enums/datasets

Frozen in `src/contracts/enums.ts`: application states, ID status, checklist item status, validation status (including `pending`), customer types, confidence bands, verification states, source-evidence types, `ReasonCode`, and Prisma adapters. Insurer flags are normalized by `normalizeInsurerRules`; strict tag requirements override `allowsPendingTaggingInspection`. `Application.submissionEligible` / `issuanceEligible` are derived caches with you as the only writer.

---

## 4. Your modules in detail

| Source | Module | Your deliverables |
|---|---|---|
| `:186`–`:199` | M1 Workspace, Shell & Offline Drafts | Auth/role-aware shell, start/resume/close UI, IndexedDB drafts, sync queue, connectivity banner/sync indicator, low-literacy/high-contrast copy, views for conversation/facts/ID/recommendations/checklist/documents. No AI panels. |
| `:201`–`:212` | M2 Interaction Orchestrator | Lifecycle APIs, coordination across all modules, parallel referral preservation, idempotent replay of queued offline requests, domain events, audit entries. |
| `:228`–`:239` | M4 Profile | Canonical Customer/Organisation/Member/LivestockRecord/ProfileFact models, fact provenance/verification history, no rigid taxonomy menus. |
| `:241`–`:253` | M5 ID & Referral | Early ID status recording, institute directory lookup/handoff, referral status tracked independently, interface with M10 for `awaiting_tagging_inspection` rules. |
| `:255`–`:270` | M6 Catalogue & Rules | Versioned products, premium formulas, exclusions, `InsurerConstraint` flags, effective dates, structured rule evaluations for recommendation/checklist. |
| `:272`–`:283` | M7 deterministic slice | Filters, exclusions, missing-fact detection, ranking, hard disqualifiers, `RecommendationRun`/`RecommendationOutcome` persistence. AI rationale is injected from Developer 1. |
| `:285`–`:300` | M8 Checklist | Generation on policy selection, point-in-time snapshots, 3-angle photos, VHC, KYC, pre/post tagging tasks, item statuses, dependencies. |
| `:302`–`:317` | M9 non-AI slice | Private GCS storage, GCS signed URLs, camera/capture shell, capture metadata with consent, version/history, deterministic `pass/fail/needs_review` routing, checklist auto-update. Quality scoring/OCR/exception UI are Developer 1. |
| `:319`–`:334` | M10 State Machine | Seven states, submission vs issuance gates, review/declarations screen, insurer adapter with idempotency attempts/references/issuance tracking. |
| `:336`–`:357` | M11/M12 Stubs | Group entity traceability, bulk batch stub with `not_implemented`, CRM/Claims timeline/renewal/claim intimation contracts. Core flow unaffected. |
| `:359`–`:369` | M13 Governance | Admin configs, rule versions, checklist templates, institute directories, audit logs for agent actions/AI suggestions/human overrides/transitions, supervisor dashboards, `PromptMetadata` persistence. |

---

## 5. Sprint-by-sprint work

### Sprint 0 — Repository bootstrap & contract freeze

Source: `:507`–`:528`. The contract-freeze baseline is defined for integration on `main`: Next.js 16/React 19/TypeScript/Tailwind, hardened Prisma schema + migration + seed, `src/contracts/**`, CI, and tests.

- [ ] Branch `dev/platform` from the contract-freeze commit; do not redefine frozen types.
- [ ] Verify Next.js 16 App Router, React 19, TypeScript, Tailwind baseline (`:512`).
- [ ] Verify Prisma schema, initial migration, and seed (`:513`, `:521`, `:527`).
- [ ] Create module directories under `src/modules/` as you implement: `workspace`, `interaction`, `profile`, `id-referral`, `catalogue`, `recommendation`, `checklist`, `documents`, `application`, `stubs`, plus `admin` (`:514`; `admin` added per `:359`–`:369` and ratified in `DEV_SPLIT_ADDENDUM.md`).
- [ ] Own application domain types/enums and module barrels; AI owns AI response/seam types in `src/contracts/ai.ts` (`:515`).
- [ ] Keep seed data current for agents, customers, breeds, product rules, institutes (`:516`).
- [ ] Keep CI green for lint, typecheck, tests, Prisma validate (`:517`).
- [ ] Enforce module boundaries via TypeScript barrel exports (`:528`); your parent barrels re-export AI sub-barrels.

**Deliverables:** runnable baseline, applied migrations/seed, typed contracts, CI.  
**Acceptance:** `npm run dev` works; seeds clean; barrels enforced (`:526`–`:528`).

### Sprint 1 — Agent workspace, interaction lifecycle & offline drafts

Source: `:530`–`:549`. You own the entire sprint.

- [ ] Build agent interaction shell and session management UI (`:535`).
- [ ] Implement IndexedDB persistence for active drafts and field inputs (`:536`).
- [ ] Add connectivity detector: online/offline banner, queued-sync indicator (`:537`).
- [ ] Implement `create`, `resume`, `syncOfflineDraft`, `close` lifecycle APIs (`:538`).
- [ ] Connect customer lookup and minimal creation flow (`:539`).
- [ ] Emit `InteractionStarted` / `DraftSynced`; never store plaintext PII in `localStorage`.

**Acceptance:** disconnect/reconnect syncs drafts; reload restores exact state; interactions link to authenticated agents (`:547`–`:549`).

### Sprint 2 — Profile persistence; AI handles conversation/UI

Source: `:551`–`:570`.

- [ ] Build profile management service and canonical persistence for proposed facts (`:564`).
- [ ] Implement `confirmProfileFact`; emit `ProfileFactConfirmed` only when Developer 1's fact-review UI calls it.
- [ ] Do **not** build the fact-review UI (`:560` is Developer 1, ratified in `DEV_SPLIT_ADDENDUM.md`).
- [ ] Expose `getRecommendationContext` from verified profile data (`:385`).
- [ ] Provide mocked `getRecommendationContext` to Developer 1 until this lands.

**Acceptance:** structured facts persist with provenance; agent can correct/confirm; unclear facts are not auto-confirmed (`:568`–`:570`).

### Sprint 3 — Early ID check, parallel referral & state integration

Source: `:572`–`:591`.

- [ ] Record ID status `present|absent|unknown|not_applicable` (`:578`).
- [ ] Build institute referral handoff with directory lookup (`:579`).
- [ ] Ensure referral creation runs in parallel and leaves interaction stage active (`:580`, `:415`).
- [ ] Wire initial application state to `profile_incomplete` or `awaiting_tagging_inspection` (`:581`).
- [ ] Build institute directory seed and management UI (`:585`).
- [ ] Build referral status indicator in workspace (`:586`).
- [ ] Developer 1 supplies the early ID prompt via `getNextQuestion` (`:577`).

**Acceptance:** accepted referral recorded; sales profiling/recommendation proceed immediately; declined decision logged without repeated prompting (`:589`–`:591`).

### Sprint 4 — Catalogue, rules & deterministic recommendation

Source: `:593`–`:612`.

- [ ] Implement versioned product catalogue (`:598`).
- [ ] Model insurer constraints: `requiresTagForSubmission`, `allowsPendingTaggingInspection`, `requiresTagForIssuance`, `requiresVhc`, `vhcRequirements` (`:599`, `:261`–`:266`).
- [ ] Build deterministic filter/ranking engine and hard disqualifiers (`:600`, `:612`).
- [ ] Emit `getInsurerPrerequisites` / `evaluatePolicyEligibility` outputs for Developer 1's `explainRecommendation` (`:386`).
- [ ] Build policy comparison shell/card layout (`:602`, `:607`) and mount Developer 1's `explanation-card`.
- [ ] Do **not** generate plain-language explanations (`:601` is Developer 1).

**Acceptance:** seeded profiles return expected policies; UI shows rationale/missing facts/post-selection requirements; disqualifiers exclude immediately (`:610`–`:612`).

### Sprint 5 — Policy selection & dynamic checklist

Source: `:614`–`:634`. You own the entire sprint.

- [ ] Implement policy selection capture (`:619`).
- [ ] Build point-in-time checklist snapshot engine (`:620`, `:298`, `:632`).
- [ ] Inject 3-angle photo requirements (`:621`, `:293`).
- [ ] Inject VHC requirements: health, dentition, milk yield (`:622`, `:294`, `:811`).
- [ ] Configure pre/post-submission tagging tasks from insurer rules (`:623`, `:296`).
- [ ] Build checklist progress tracker UI (`:624`, `:629`).
- [ ] Enforce item dependencies, e.g. VHC requires vet license number (`:634`).

**Acceptance:** snapshot tied to selected product version; 3-angle + VHC items present; dependencies enforced (`:632`–`:634`).

### Sprint 6 — Capture/storage/routing; AI handles scoring/OCR/UI

Source: `:636`–`:657`.

- [ ] Implement photo/document capture with camera integration (`:641`).
- [ ] Capture timestamp, device info, consented geolocation (`:642`, `:494`–`:496`).
- [ ] Store assets in a private encrypted GCS bucket with time-limited signed URLs (`:307`, `:497`).
- [ ] Build validation pipeline consuming `assessEvidenceQuality` / `extractVhcFields` from Developer 1.
- [ ] Apply deterministic `pass|fail|needs_review` routing with reason codes (`:314`, `:471`).
- [ ] Auto-update checklist item completion states (`:646`).
- [ ] Build document/photo management service (`:649`).
- [ ] Do **not** build quality scoring, OCR, or exception/manual confirmation UI (`:643`–`:645`, `:651` are Developer 1).

**Acceptance:** 3-angle photos + VHC captured; metadata captured on consent; warnings/retakes surfaced from AI scores; checklist updates on validation (`:654`–`:657`).

### Sprint 7 — Application state machine & issuance handoff

Source: `:659`–`:687`. You own the entire sprint.

- [ ] Implement all seven states: `profile_incomplete`, `awaiting_tagging_inspection`, `ready_for_submission`, `submitted`, `underwriting_review`, `issued`, `rejected` (`:664`–`:670`).
- [ ] Enforce submission vs issuance separation through `evaluateSubmissionReadiness` / `evaluateIssuanceReadiness` (`:671`–`:673`).
- [ ] Normalize flags with `normalizeInsurerRules`; strict tag requirements override pending-tag allowance (`:672`, `:325`).
- [ ] Require tag verification plus `requiresVhc ? VHC.valid : not_applicable` before `issued` (`:673`, `:329`, `:31`).
- [ ] Treat `Application.submissionEligible` / `issuanceEligible` as derived caches updated only by the state-machine service.
- [ ] Build application summary review with declarations (`:674`).
- [ ] Implement insurer submission adapter with idempotency keys (`:675`, `:499`).
- [ ] Track attempts, references, issuance events (`:676`).
- [ ] Ensure AI outputs never drive transitions (`:52`, `:464`–`:472`).

**Acceptance:** valid transitions only; no submission with unmet pre-submission rules; pending-tag submission allowed where permitted but never `issued` early; unique attempt references (`:684`–`:687`).

### Sprint 8 — Bulk validation & CRM/claims stubs

Source: `:689`–`:706`. You own the entire sprint.

- [ ] Implement organisation/member/animal traceability for groups (`:694`, `:704`).
- [ ] Build bulk validation stub: batch model, upload entry point, progress indicator, explicit `not_implemented` response (`:695`).
- [ ] Build CRM/Claims stub: timeline, renewal reminders, claim intimation states `claim_intimated|inspector_assigned|settled` (`:696`, `:355`).
- [ ] Keep core sales/issuance path unaffected (`:706`).

**Acceptance:** individual traceability preserved; stubs clearly labelled; main flow unaffected (`:703`–`:706`).

### Sprint 9 — End-to-end hardening (non-AI portions)

Source: `:708`–`:727`.

- [ ] Run E2E scenarios A/B1/B2/C/D for non-AI steps (`:713`).
- [ ] Test offline disconnection/recovery during profiling, capture, sync (`:714`, `:726`).
- [ ] Validate no plaintext PII/documents in `localStorage`; test signed URL expiry (`:715`).
- [ ] Test submission timeouts and retry idempotency (`:716`, `:499`).
- [ ] Validate UI copy/readability for field agents (`:717`).
- [ ] Produce pilot build, test scenario suite, agent onboarding quick-start (`:719`–`:722`).
- [ ] Verify full audit trail for all test interactions (`:727`).

Developer 1 runs AI regression/eval checks and AI-related scenario steps.

**Acceptance:** all E2E scenarios pass; no data loss; full audit trail (`:725`–`:727`).

---

## 6. Mocks & parallel development

Provide these mocks to Developer 1 from day one:

| Mock | Shape | Purpose |
|---|---|---|
| `mockGetRecommendationContext` | verified profile/livestock facts | explanation tests |
| `mockRuleOutputs` | `evaluatePolicyEligibility` + `getInsurerPrerequisites` with all flags | explanation grounding |
| `mockEvidenceRequirements` | 3-angle photos + VHC + KYC + tagging tasks | quality/OCR seam tests |
| `mockRecordEvidenceValidation` | accepts AI envelope, returns routing | evidence pipeline tests |
| `mockAuditSink` | records `PromptMetadata`/audit payloads | provenance tests |

Consume these mocks from Developer 1:

- `mockProcessConversationalInput`, `mockProposeProfileFacts` for workspace/orchestrator/profile tests.
- `mockExplainRecommendation` for policy comparison layout.
- `mockAssessEvidenceQuality`, `mockExtractVhcFields` for validation routing tests.
- `mockEarlyIdPrompt` for Sprint 3 without waiting on real inference.

---

## 7. Test checklist

- [ ] `npm run dev`, `npm run lint`, `npm run typecheck` pass.
- [ ] Seeds succeed with zero errors.
- [ ] Barrel exports enforced; no direct cross-table writes.
- [ ] Offline drafts survive disconnect/reconnect/reload; no plaintext PII in `localStorage`.
- [ ] Parallel referral never blocks recommendation, selection, or `awaiting_tagging_inspection`.
- [ ] Deterministic gates hard-exclude ineligible policies; no AI-generated eligibility.
- [ ] Checklist snapshots are tied to product version; 3-angle/VHC/KYC tasks present.
- [ ] Consent recorded before GPS/document upload; signed URLs expire.
- [ ] Submission retry uses idempotency keys; unique reference IDs.
- [ ] `issued` requires tag verification + VHC signoff + insurer acceptance.
- [ ] Stubs clearly labelled `not_implemented` and do not affect core flow.
- [ ] Audit trail captures agent actions, AI suggestions, human overrides, transitions.

---

## 8. Git & integration workflow

- `main` holds the contract freeze and sprint integration merges.
- Work from `dev/platform`; task branches `platform/*` merge back into `dev/platform` via PR.
- Rebase/merge `main` into `dev/platform` daily; open integration PRs to `main` at each sprint boundary.
- Cross-stream changes require a contract change PR to `main` first, then both workstreams pick it up.
- You own the feature-flag registry; consume the flag names declared by Developer 1 in `@/contracts` so platform flows stay testable if inference is not ready.

---

## 9. E2E ownership map

| Scenario | You lead | Developer 1 leads/supports |
|---|---|---|
| A — ID present (`:747`) | 1, 2b fact persistence, 3, 4a deterministic ranking, 5–9 | 2a conversation/inference; supports 4b |
| B1 — referral accepted, pending submission allowed (`:759`) | 1b ID status, 2, 4a, 5–10 | 1a prompt delivery, 3; supports 4b |
| B2 — referral accepted, tag mandatory (`:772`) | 1b, 2, 4a, 4–7 | 1a, 3; supports 4b |
| C — referral declined (`:782`) | 1b early ID status, 2, 4a, 5 | 1a early ID prompt, 3; supports 4b |
| D — cooperative (`:790`) | 2–5 | 1 inference |

---

## 10. Done criteria for this workstream

- All non-AI modules, deterministic rules, storage, state machine, integrations, stubs, and non-AI UI listed above are implemented.
- Developer 1's mocks can be swapped for real AI services without changing your public contracts.
- No deterministic rule, checklist, state transition, or insurer response is delegated to AI.
- Sprint 9 non-AI hardening passes and the full audit trail is verifiable.
