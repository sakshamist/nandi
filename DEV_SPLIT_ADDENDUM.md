# DEV Split Addendum — Authority Record

**Status:** Ratified for the two-developer execution model.  
**Applies to:** `DEV_AI.md`, `DEV_PLATFORM.md`, and `SureLM_Architecture_and_Sprint_Plan.md`.

This addendum resolves conflicts between the source architecture document and the two workstream docs. Where the source spec and a workstream doc disagree, **this addendum is authoritative** for ownership. Everything else in `SureLM_Architecture_and_Sprint_Plan.md` remains unchanged and authoritative for product behavior.

## 1. Ratified ownership overrides

| Source item | Original text | Authoritative owner |
|---|---|---|
| `SureLM_Architecture_and_Sprint_Plan.md:560` | Build agent fact-review UI with confidence scores and manual override controls | Developer 1 (AI UI), `src/components/ai/fact-review-panel` |
| `:601` | Generate plain-language policy explanations | Developer 1 (AI logic), `explainRecommendation` |
| `:602`, `:607` | Policy comparison UI / card view | Developer 2 owns shell/layout; Developer 1's `explanation-card` is mounted inside |
| `:643` | Photo quality checks | Developer 1 (AI), `assessEvidenceQuality` |
| `:644` | VHC document extraction | Developer 1 (AI), `extractVhcFields` |
| `:645`, `:651` | Agent exception review / manual confirmation UI | Developer 1 (AI UI), `evidence-exception-review` |
| `:369` | `PromptMetadata` | Developer 1 generates the payload; Developer 2 persists it in M13 |
| `:514` module list | Does not include `admin` | Developer 2 adds `src/modules/admin/**` for M13 per `:359`–`:369` |

Source section `:40` is a heading; the actual principles are `:42`–`:52`.

## 2. Canonical names and single-emitter rule

- Lifecycle contract names are `startInteraction`, `resumeInteraction`, `syncOfflineDraft`, `closeInteraction`. The Sprint 1 shorthand `syncDraft` is not a contract name.
- Each domain event has exactly one emitter. Developer 2 emits and persists `RecommendationGenerated` and `DocumentValidationCompleted`. Developer 1 returns typed rationale/quality/extraction fragments as **return values only**, never as events.
- Developer 1 emits `ProfileFactProposed` and `CustomerTypeInferred`. Developer 2 emits `ProfileFactConfirmed` after the AI-owned fact-review UI signals agent confirmation through `confirmProfileFact`.
- The source spec's `AuditLog` at `:369` is canonically `AuditEvent` (`:448`, `:498`). No separate `AuditLog` model is created.

## 3. Contract freeze location

The Sprint 0 freeze is code in the integration baseline, not just documentation:

- `src/contracts/enums.ts` — canonical enums, Prisma adapters, confidence bands, reason codes.
- `src/contracts/ai.ts` — `AiEnvelope<T>` and AI result types.
- `src/contracts/operations.ts` — all synchronous operations and cross-stream handoff seams.
- `src/contracts/events.ts` — event payloads and the single-emitter registry.
- `src/contracts/rules.ts` — deterministic rule normalization and submission/issuance decisions.
- `src/contracts/mocks/index.ts` — the shared fixtures both developers import.

Both workstreams import from `src/contracts`; neither developer edits another stream's contract-owned implementation without a PR to `main`.

## 4. Schema decisions

- `PromptMetadata`, `ValidationResult`, `ReviewLog`, `ApplicationStateTransition`, `PolicyIssuance`, `InsurerConstraint`, `RecommendationOutcome`, `RuleVersion`, `AdminConfig`, `BatchItemStub`, `ClaimCaseStub`, and `CaptureMetadata` are canonical tables.
- `FieldDraft` remains client-side IndexedDB only; it is deliberately not a Postgres table.
- `ChecklistItem.evidenceRefType` discriminates `PHOTO` vs `DOCUMENT` for the polymorphic `evidenceId`.
- `AuditEvent.entityId` is a plain polymorphic string; `AuditEvent.interactionId` is the only typed relation to `Interaction`.
- `Application.submissionEligible` and `Application.issuanceEligible` are derived caches with a single writer: the state-machine service in M10.
- Insurer flag precedence is defined by `normalizeInsurerRules` in `src/contracts/rules.ts`; strict tag requirements override `allowsPendingTaggingInspection`.
- Early referrals may be created before a canonical customer exists: `IdReferral.customerId` is nullable and may be backfilled via `provisionalCustomerName`.
- `Customer.primaryPhone` is not globally unique, so cooperative members may share a contact number.

## 5. Branch model

`main` is the integration target for this addendum, the frozen contracts, the hardened schema, CI, and seeds. Long-lived integration branches are `dev/ai` and `dev/platform`. Contract changes land on `main` first via PR, then both branches rebase/merge.

## 6. Deployment authority

The $5-credit GCP pilot in `project-nandi` is authoritative for deployment documentation. Runtime is Next.js on Cloud Run with min instances `0`; relational storage is the Cloud SQL for PostgreSQL free-trial instance; vector storage remains Qdrant Cloud Free; assets use a private GCS bucket; secrets use Secret Manager; operational visibility uses Cloud Logging and Cloud Monitoring. AI is mock-first with feature flags off; Gemini/Vertex AI requires explicit separate funding. GitHub Actions CI and app-level session/token RBAC remain unchanged in this phase.
