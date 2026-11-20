# Agent Quick-Start — SureLM Agent Workspace

Welcome, agent. This quick start covers the workspace shell, offline operation, interaction lifecycle,
profiling, the Livestock ID check, recommendations, capture, the checklist, the application flow and
the audit trail.

## 1. Workspace

Go to `/`. The workspace shell shows:

- Conversation & facts (customer details, livestock count and ownership)
- Livestock ID check (has the animal got a tag or RFID yet?)
- Policy recommendations
- Checklist (photos, VHC and tasks for the selected policy)
- Documents & photos

It also shows a drafts indicator and — when offline — an offline banner: keep working; your drafts
save locally and sync when you reconnect.

## 2. Interaction lifecycle

- Start: agents start an interaction from the workspace shell.
- Offline: drafts are stored in IndexedDB; queued sync is replayed safely on reconnect.
- Resume and close interactions; nothing is lost on network drops.

## 3. Profiling

AI proposes facts as you chat. Unconfirmed facts are shown as **not verified**. To confirm a fact,
use the fact review (this is where your confirmation is recorded). You can also correct a value
before confirming. Unclear facts are never auto-confirmed.

## 4. Livestock ID check

Very early, the system checks the animal's tag status: `present`, `absent`, `unknown`, or
`not_applicable`. If the tag is missing and the customer is interested, you get a referral to an
institute; the sales flow continues immediately. Decline without repeating prompts.

## 5. Recommendations

Go to `/recommendation`. The table shows each policy's eligibility, insurer requirements
(tag/VHC requirements) and missing facts. Hard disqualifiers exclude immediately.

## 6. Policy selection & checklist

Select a policy — the system generates a dynamic checklist at `/checklist`:
3-angle photos (full body, ear tag, animal with owner), veterinary health certificate, KYC and
insurer tagging tasks.

## 7. Capture

Go to `/capture`. Capture clear photos for the 3-angle items; allow GPS where legal and record
consent. AI quality checks (blur, illumination, legibility) may flag retake needs.

## 8. Application

Go to `/application`: review the application summary, accept the declarations, and see states:
`profile_incomplete` → `awaiting_tagging_inspection` → `ready_for_submission` → `submitted` →
`underwriting_review` → `issued` / `rejected`. Submission is blocked while pre-submission rules
are unmet (e.g. a required tag).

## 9. Admin console

Go to `/admin`: the audit trail of all actions, rule versions, and the institute directory.

## 10. Scenario suite

The full E2E scenario walkthroughs live in `src/modules/application/e2e-scenarios.ts`
(scenarios A, B1, B2, C and D).
