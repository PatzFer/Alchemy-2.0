# Alchemy 2.0 — Build Roadmap to Version 1.0

Status: Active delivery plan — user-approved direction
Branch: build/phase-2-planner

## Delivery decision

Build Alchemy 2.0 to a complete, usable **Version 1.0 in the existing GitHub repository first**. Google AI Studio is a later portability/runtime step, not the primary development environment for this build.

GitHub remains the canonical source of truth throughout implementation. Work stays on the feature branch until the product is reviewed and ready. Do not merge directly to main.

## Working agreement

- Continue through implementation phases without asking for approval of every visual detail.
- Use considered design defaults and preserve the user's confirmed decisions.
- Stop and ask only when a product decision materially affects privacy, data ownership, irreversible behavior, costs, or the user experience in a way that cannot be safely inferred.
- At the end of each meaningful phase, report what was completed, what was tested, what remains, and ask whether to start the next phase.
- Do not describe work as complete or tested unless the relevant checks actually ran.
- Preserve existing user data and feature behavior. Prefer gradual migration and compatibility over destructive replacement.

## Confirmed product decisions

- Neutral Home with two equally weighted entry points: Mariluna and Privé.
- Separate internal navigation and contextual dashboards for each domain.
- One shared planner, with Agenda and Taken views and an optional combined agenda view.
- Quick Capture available globally; it inherits the active domain and supports explicit reassignment or Shared.
- One Jarvis assistant available in both domains, using layered memory and explicit privacy boundaries.
- Dark-first, warm, editorial design foundation.
- Mariluna identity: Botanical Alchemy — forest green #263D35, moss #A9B88A, antique gold/champagne and warm ivory.
- Privé identity: Earthbound — espresso #39312B, copper #B49A7A, muted taupe and soft cream.
- Preserve existing modules and stored data; evolve rather than rebuild from scratch.
- Keep Gemini as the current AI provider and target no additional AI spend.
- Gmail/email integration is not required and is excluded from the product roadmap.
- Integrations requested for Version 1.0: calendar/agenda, health data and Renpho smart-scale data, subject to supported APIs and explicit user consent.
- AI Studio transition happens only after the Version 1.0 build and verification.

## Delivery phases

### Phase A — Product shell and design foundation
- Introduce semantic design tokens for shared surfaces, typography, borders, focus, status and domain accents.
- Establish neutral Home launcher.
- Establish explicit active-domain routing and internal navigation.
- Keep global utilities distinct from domain navigation.
- Ensure the app remains responsive and existing entry points remain reachable during migration.

### Phase B — Domain dashboards and module routing
- Build focused Mariluna and Privé dashboards.
- Route existing modules into their approved domain menus.
- Split the current combined Today experience into domain-specific overviews while reusing valuable daily brief logic.
- Preserve deep links and existing state.

### Phase C — Shared planner and capture
- Unify Agenda and Taken navigation over existing records.
- Implement domain filters and opt-in combined agenda.
- Implement global Quick Capture for task, idea, note, appointment and reminder.
- Ensure shared status is explicit and no duplicate records are created.

### Phase D — Jarvis and privacy enforcement
- Implement centralized server-side context assembly.
- Enforce active-domain and sensitive-data boundaries before provider calls.
- Add explicit cross-domain permission flow.
- Clearly distinguish Gemini responses from local fallback.
- Add action previews and confirmations, with explicit confirmation for destructive actions.
- Add tests for allowed and denied context paths.

### Phase E — Platform foundations and resilience
- Implement a provider-based integration layer for calendar/agenda, Android health data (evaluate Health Connect as the platform bridge), and Renpho smart-scale data.
- Determine whether Renpho exposes or exports measurements through Health Connect, Google Fit or another supported method; do not assume a direct public API exists.
- Import only user-approved data types, with field-level permissions, source attribution, timestamps, deduplication and disconnect/delete controls.
- Keep health and body measurements in the sensitive Private scope; never expose them to Mariluna or Jarvis by default.
- Define and implement durable persistence, authentication and recovery.
- Resolve local-first/offline behavior, cloud sync, data ownership, conflict handling, export and deletion.
- Harden integrations and accurately represent authorization/sync status.
- Review Google Calendar synchronization semantics.
- Keep secrets server-side and verify session/security persistence.

### Phase F — Version 1.0 verification and release candidate
- Install dependencies in a controlled environment.
- Run production build, TypeScript checks, lint and automated tests where configured.
- Add or update tests for navigation, domain filtering, capture, privacy, persistence and fallback behavior.
- Manually review mobile and desktop layouts.
- Verify migration preserves existing local data.
- Fix critical and high-severity issues.
- Produce a release candidate and a clear known-limitations list.
- Open a pull request for review; do not merge without explicit user approval.

### Phase G — Google AI Studio portability
Only after Version 1.0 is stable:
- Test importing/running the project in Google AI Studio.
- Verify the React client, Express server routes, Gemini calls, environment variables/secrets, Firebase, OAuth origins, PWA behavior and persistence.
- Compare runtime behavior against the GitHub release candidate.
- Keep GitHub as canonical source unless the user explicitly chooses a different source-of-truth workflow.
- Do not remove backend capabilities or weaken security to force a successful import.

## Quality gates

A phase is not complete merely because files have been edited. Completion requires its stated checks and a concise report of test evidence.

Version 1.0 is not ready if:
- Mariluna and Private data can leak across domains through UI, API or Jarvis context.
- Existing user data is lost or silently reclassified.
- Security/session behavior is represented as production-ready without durable storage and recovery verification.
- Integrations show Connected without verified authorization and API behavior.
- Offline/local fallback behavior is unclear to the user.
- Core flows fail on mobile.
- Build/type checks fail.

## Current starting point

The source-level audit found a React 19 + Vite + TypeScript client, an Express/Node server, Gemini integration, Firebase/OAuth code, PWA behavior, localStorage persistence and substantial existing modules. The audit did not run a build, tests, live integrations or security tests. The first implementation changes must therefore be incremental, with validation as soon as an executable environment is available.

## Integration requirements added by user

The user wants Alchemy to synchronize with three existing apps/services:

1. **Agenda / calendar** — connect the calendar app/account the user uses and bring events into the shared Alchemy planner. Confirm the exact provider during integration setup; Google Calendar support already exists in the repository but its current sync behavior needs review.
2. **Health** — connect the user's health app/data source. On Android, evaluate Health Connect as the preferred interoperability layer and identify whether the actual source is Samsung Health, Google Fit/Fitbit or another app. Do not equate a connected status with successful data access.
3. **Renpho** — import smart-scale measurements if a supported export/API/Health Connect route is available. First verify the available pathway and which measurements can be read. Do not scrape private endpoints or store Renpho credentials directly.

**Explicit exclusion:** Gmail and email synchronization are not part of Alchemy's planned integrations.

Integration principles:
- Read-only import by default; writing back to external apps requires a separate explicit decision.
- User chooses data categories and sync direction/frequency.
- Health and body-composition data are sensitive Private data, with least-privilege access and no Mariluna/Jarvis cross-domain access by default.
- Every imported record retains provider/source, measurement type, unit, measured-at timestamp and import timestamp.
- Deduplicate repeated imports and handle corrections/deletions where the provider supports them.
- Provide connection status, last successful sync, errors, disconnect and local-data deletion controls.
- If an app cannot provide a supported integration, clearly state the limitation and offer a user-controlled export/import alternative.

## Implementation progress log

### Current checkpoint — 18 November 2026

Incremental implementation commits on `design/phase-1`:

- Neutral Home launcher and initial domain entry routing are in place.
- Dark-first semantic design tokens and the shared app shell have been introduced.
- Mariluna and Privé dashboard headers have been aligned to their respective visual identities.
- Internal navigation styling has been aligned with the dark Alchemy foundation.
- Quick Capture now supports task, reminder, idea, note and appointment capture, with date/time fields where relevant.
- Quick Capture is reachable from the Home launcher and from a persistent in-app shortcut.

**Phase status:** Phases A and B have substantial implementation started, and Phase C has begun. None of these phases is declared complete yet. The quality gates still require a working build, type/lint checks where configured, and mobile/desktop validation. Shared-record semantics are also not complete: the current `Realm` model only supports `personal` and `mariluna`, so the approved optional Shared destination must be designed and migrated carefully rather than simulated with an existing realm.

**Validation status:** GitHub file updates are committed on the feature branch. No production build, TypeScript check, automated test suite, live integration test or device/browser review has been run in this environment. Do not treat the current checkpoint as a release-ready phase boundary.

**Next implementation focus:** complete domain-specific dashboard/module routing and shared planner behavior, then address the Shared capture model and its migration/privacy implications before declaring Phase C complete.


## Progress log — 18 November 2026 (continued)

- Calendar event creation now defaults its realm to the active domain (Mariluna when the Mariluna filter is active; otherwise Private), reducing accidental cross-domain placement while preserving the explicit realm selector.
- Task status counters now respect the active domain filter, so the Active and Completed totals match the task list currently shown.
- Task creation and due-date defaults now use local calendar dates rather than UTC ISO date slicing, avoiding date shifts around local midnight/time zones.
- These are incremental improvements to phases A/B/C; no phase is complete. No build, TypeScript/lint, automated test, or browser/mobile validation has been run yet.


## Progress log — 18 November 2026 (planner and visual consistency)

- Universal Quick Capture, morning check-in dismissal, and quick-capture creation now use the user's local calendar date rather than UTC date slicing. This complements the local-date correction already made in TasksView.
- Corrected navigation contrast for the Mariluna and Private tabs and hover states so labels remain legible against the dark surfaces.
- Reworked the shared Calendar and Tasks view's most prominent headers, filters, buttons, empty states, cards, and borders to use the semantic dark-theme tokens. This is a focused visual consistency pass, not a claim that every nested control in both views has been fully audited.
- Shared realm remains deliberately unimplemented: Realm is used across tasks, goals, ideas, projects, calendar events, routines, commitments, memory, and other data. Adding 'shared' safely requires a deliberate migration and domain/privacy review rather than changing only the capture buttons.
- No build, lint/typecheck, automated test, or visual device/browser validation has been run. Phases A/B/C remain in progress.


## Progress log — 18 November 2026 (planner visual QA pass)

- Extended the semantic-token pass across the Calendar and Tasks views so nested planner surfaces, event cards, date navigation, form controls, and status labels use the dark Alchemy palette more consistently.
- Corrected contrast defects found during source review, including Mariluna task labels and task action buttons that previously paired a light foreground and background.
- Updated key planner copy to Dutch and corrected the calendar working-hours subtitle.
- Confirmed in source review that the remaining Shared model is cross-cutting: Tasks, Ideas, Calendar Events, Goals, Projects, Routines, Commitments and Memory currently share the Realm type in different privacy contexts. No schema migration has been made yet; adding Shared without explicit scoping would risk exposing records to the wrong domain or assistant context.
- Source-level review only. No executable build, TypeScript/lint check, unit tests, browser rendering, mobile review, or persistence migration test has run. Phases A/B/C remain in progress and are not signed off.


## Progress log — 18 November 2026 (domain dashboard and navigation refinement)

- Extended the semantic dark palette from the shared planner into the Mariluna and Private dashboard cards, secondary panels, dialogs and form surfaces, while retaining the distinct forest-green and espresso domain headers.
- Corrected navigation contrast on the Jarvis action and mobile world switcher, and localized the mobile world labels and security/settings tooltips.
- Updated the app authentication-loading and setup wrapper surfaces to use the dark design foundation rather than reverting to the old light shell.
- Follow-up source review still finds legacy light/dark literal styling in deeper nested module content, so the visual migration is not considered globally complete. Further focused audits are required.
- No executable build, typecheck, lint, automated tests, browser rendering or device review has been run. Phases A/B/C remain in progress.


## Progress log — 18 November 2026 (private modules and system surfaces)

- Migrated the Goals and Ideas modules to semantic dark tokens for cards, forms, filters, text and empty states.
- Extended the same treatment through Today, Wellbeing, Cycle and MyLife, preserving distinct success/error/health status colors where they communicate meaning rather than replacing them with neutral colors.
- Applied semantic dark surfaces to Settings, including privacy/memory controls and warning/error surfaces.
- Follow-up source scans show the largest old light-palette clusters in these audited modules have been reduced; remaining literals are primarily intentional domain accents or semantic status colors. This is source inspection, not rendered visual QA.
- Integration screens have not yet been redesigned or behaviorally validated; their provider status colors and connection semantics require a separate careful pass.
- No build, typecheck, lint, automated tests, browser/mobile rendering, or migration tests have run. Phases A/B/C remain in progress.


## Progress log — 18 November 2026 (integrations and least-privilege review)

- Migrated the Integrations hub, provider cards, dialogs, form controls and status surfaces to the semantic dark palette while retaining distinct connection/error/warning status colors.
- Reduced Google Calendar OAuth requests to the read-only calendar scope and now persist/display the connection as read-only. The current calendar UI does not implement Google event creation, so the additional calendar.events write scope was unnecessary for the implemented workflow.
- Corrected the health integration label: the existing code uses the Google Fit REST API and OAuth fitness scope, not Android Health Connect. The UI now identifies it as a temporary Google Fit legacy connection and explicitly states that it is not Health Connect.
- External official Android documentation checked 18 November 2026: Google states Google Fit APIs, including REST, are supported only until the end of 2026; Health Connect is a native Android/on-device SDK integration with Android manifest and runtime permissions, not a browser OAuth connection. The proper long-term path for the Android app is a native Health Connect bridge, not relabeling the existing Google Fit code.
- Renpho direct sync remains unverified; do not promise a provider API or claim a connection. Evaluate supported Health Connect sharing or explicit export/import during the integration design.
- No build, typecheck, lint, automated tests, browser/device validation or live provider authorization tests have run. Phases A/B/C remain in progress.


## Progress log — 18 November 2026 (integration truthfulness and calendar reliability)

- Google Calendar event retrieval now follows all `nextPageToken` pages instead of silently stopping after the first 250 events.
- Timed Google Calendar events are converted from their API instants into the device's local date/time before being shown in the local planner. All-day events retain their date-only semantics.
- Hardened the Health Connect integration boundary: the server no longer accepts a client-supplied `verified: true` flag as proof of a real provider connection and returns HTTP 501 until a native Android bridge exists.
- New installs now show Health Connect as unavailable until the native bridge is implemented. Existing persisted Google Fit OAuth status is normalized to unavailable while historical step values are retained; the UI now describes the actual native Health Connect status rather than presenting Google Fit as Health Connect.
- This is a deliberate safety/accuracy improvement, not completion of Health Connect sync. Native Android permissions, data reading, provider provenance, sync lifecycle and device tests remain outstanding.
- No build, typecheck, lint, automated tests, browser/device tests or live OAuth/provider tests have run. Phases A/B/C remain in progress.


## Progress log — 18 November 2026 (integration status and privacy hardening)

- Removed client calls that copied Gmail message content, Calendar metadata and Instagram post snapshots into the server's process-local integration registry. The provider data remains in the app's local state after successful provider/API reads; it is no longer redundantly sent to a non-durable in-memory server object.
- Removed the client-side integration registry connect/sync helpers that could imply server persistence or report a successful sync despite no real provider sync being performed.
- Removed the obsolete Google Fit browser OAuth connect/sync/disconnect handlers from the Health Connect screen. The existing legacy REST helper remains in the service module but is no longer used by the UI; native Android Health Connect remains unavailable until implemented.
- Removed the Instagram sync handler's fabricated last-sync timestamp. The UI now reports that Meta Graph API refresh is not implemented and retains existing imported data without falsely claiming a fresh sync.
- Provider connection status is now based on a successful provider OAuth/API read in the client rather than a client-posted `verified` flag to the ephemeral server registry. This still does not provide durable multi-device connection storage; that needs a proper authenticated persistent integration model.
- No build, TypeScript/lint check, automated tests, browser/mobile tests, or live provider tests have run. Phases A/B/C remain in progress.


## Progress log — 18 November 2026 (integration UI cleanup and storage security review)

- Removed remaining client calls to the server's process-local integration disconnect registry. Disconnecting Calendar, Gmail or Instagram now updates the app's local provider state only; it no longer implies a durable server-side revocation. Actual Google token revocation/credential deletion still needs a dedicated implementation.
- Removed the now-unreachable Health Connect connected-data panel and legacy action affordances. The UI always presents native Health Connect as not yet available; it cannot show old Google Fit values as a live Health Connect feed.
- Source audit confirmed app state, including private and sensitive records, is currently serialized as plaintext JSON into browser localStorage. The security vault and sessions are also in-memory on the server. This means current app authentication does not by itself establish encrypted-at-rest storage or durable multi-device security. Do not claim those protections; a proper key-management, encryption and persistent-auth design is required before production handling of sensitive data.
- The current TypeScript configuration does not enable noUnusedLocals/noUnusedParameters. No compiler, build, automated test, browser/mobile test, storage migration test or OAuth revocation test has run in this environment.
- Phases A/B/C remain in progress. Sensitive-data persistence and integration credential lifecycle are explicit open security requirements.


## Progress log — 18 November 2026 (release hardening sprint)

- Added a GitHub Actions quality-gate workflow on `design/phase-1` and pull requests targeting `main`. It installs dependencies, runs the existing TypeScript check (`npm run lint`) and production build (`npm run build`). The repository currently has no npm lockfile, so CI does not enable lockfile caching. Workflow execution and results still need to be observed; adding the workflow is not proof that the checks pass.
- Aligned the installed PWA manifest identity with the product name `P & M Alchemy` and changed its theme/background colors to the dark-first app shell (`#171916`). Updated the document theme color and body fallback classes to match.
- Removed the obsolete Google Fit REST step-count helper from the Google auth service. The app's Health Connect integration remains explicitly unavailable until a native Android bridge is built; this removes dead legacy API code, not the Health Connect feature gap.
- Source review of disconnect behavior found that Calendar and Gmail currently share one in-memory Google access-token cache. Disconnecting either clears the shared cache, but does not revoke the provider token. This is not a correct independent credential lifecycle and must be redesigned before claiming reliable provider disconnect/security. No speculative quick fix was applied.
- A combined commit status query for the CI workflow commit currently returned no reported statuses. No successful CI run, build, typecheck, automated tests, browser rendering or Android device validation is claimed yet.
- A/B/C remain in progress. Production security and integration lifecycle gaps remain release blockers until implemented and tested.


## Progress log — 18 November 2026 (authentication and integration isolation)

- Replaced the shared Google OAuth access-token cache with independent in-memory caches for Calendar and Gmail. Both connection and refresh flows now request/store the correct service-specific token, and disconnect clears only that service's cache. This fixes accidental cross-service cache invalidation; provider-side token revocation is still not implemented.
- Hardened the app authentication perimeter to fail closed: if `/api/auth/status` returns a non-success response or cannot be reached, the client now shows the locked state rather than treating the app as authenticated. This prevents an API outage from silently bypassing the lock screen. It does not replace durable server-side sessions or encrypted persistent storage.
- These are source changes committed to `design/phase-1`; no local build, typecheck, browser test, provider OAuth test or Android device test has run in this environment.
- CI's initial run failed. The first workflow definition expected an npm lockfile for caching even though none exists; that cache requirement has been removed in a follow-up commit. A successful rerun has not yet been observed, so the quality gate remains open.


## Progress log — 18 November 2026 (critical authentication bypass and data recovery)

- Security review found a hard-coded recovery credential (`PMAL-DEMO-2026`) accepted by the server's recovery-code verifier without checking the generated one-time recovery-code hashes. This was a real authentication bypass, not merely a preview convenience.
- Removed the hard-coded credential acceptance from `server/security.ts` and removed the corresponding quick-unlock / prefilled-demo-code affordances from the lock screen. Preview unlock is separately disabled by default unless explicitly enabled outside production.
- Removed the direct `method: 'passkey'` success path from the generic `/unlock-app` credential endpoint. Passkey unlock must flow through the WebAuthn challenge and signature verification endpoint.
- Improved data recoverability: if stored Alchemy JSON is unreadable, the loader now attempts to preserve the original raw payload under a timestamped recovery key before the app can autosave its fallback state over the main key. This is a recovery safeguard, not encryption; localStorage still contains plaintext data and remains a production blocker for sensitive information.
- Source changes are committed on `design/phase-1`. No executable tests, build, browser checks, authentication penetration tests or storage recovery tests have been run here. The new CI workflow must still be observed passing.


## Progress log — 18 November 2026 (second sensitive-unlock bypass closed)

- A follow-up audit found a second client-flag bypass in `POST /api/auth/unlock-sensitive`: sending `method: 'passkey'` was accepted without checking a verified credential. The endpoint now requires the current server-side session to be authenticated, authenticated specifically through a passkey, and still inside its server-issued step-up window.
- The first hard-coded demo recovery bypass and generic app-unlock passkey shortcut remain removed. The lock screen no longer displays or prefills the demo recovery code.
- Remaining security limitations are substantial: the security vault/session state is process-memory only, the browser stores app state in plaintext localStorage, and no automated penetration or authentication regression tests have run. This work closes identified bypass paths; it does not establish production-grade security.


## Progress log — 18 November 2026 (WebAuthn hardening and test-readiness)

- Tightened both passkey registration and authentication verification to require the exact request origin and RP ID rather than accepting localhost and alternate-scheme fallbacks. Both flows now require user verification.
- Sensitive-data unlock now also requires the app session to be authenticated before a TOTP, recovery-code or passkey step-up can be considered. Passkey step-up must still be present and unexpired in the server-side session.
- The CI workflow is configured to run on pushes to `design/phase-1`, pull requests to `main`, and manual dispatch. Recent commits have been made on the watched branch; the GitHub commit-status endpoint currently reports no statuses for the latest commits, so there is still no evidence that CI has run successfully.
- The app is not yet ready to label as production 1.0: sessions and security vault remain in-memory, app state remains plaintext in localStorage, provider disconnect/revocation is incomplete, native Health Connect is unavailable, and no automated UI/integration tests exist. This work is moving toward a testable candidate, not certifying production safety.


- Final source inspection caught that the first strict-origin edit had changed registration verification but left the login verification on the previous permissive fallback. Corrected the login verifier as well: both registration and authentication now require exact request origin/RP ID and user verification. This was found by rereading the committed source, not by a passing test.

## Progress log — 18 November 2026 (reproducible CI and first green build)

- The first observed CI run reached the TypeScript check and exposed a stale Calendar token call in `src/App.tsx` after the token cache was split by service. Updated event creation to request the Calendar token explicitly.
- The corrected run passed both `npm run lint` (TypeScript) and `npm run build` (Vite client plus bundled Express server).
- The repository contains a committed `bun.lock`, so CI was updated to use Bun with `bun install --frozen-lockfile` rather than an unlocked npm install. The frozen install, TypeScript check and production build all passed on commit `d83dfc2467f38e7f790f17468dd68fa7d40f3184`.
- Added `docs/ALCHEMY-1.0-RELEASE-TEST-CHECKLIST.md` to distinguish checks that have actually run from those that remain outstanding.
- This is the first confirmed green automated quality gate. It is not a browser, mobile, OAuth, authentication regression or penetration test, and it does not remove the current production blockers: plaintext browser persistence, process-memory-only security vault/sessions, incomplete provider token revocation, and unavailable native Health Connect.
- The type model still uses only `personal` and `mariluna` realms. A Shared realm remains a cross-cutting migration and was deliberately not introduced as a superficial enum change.

## Progress log — 18 November 2026 (Jarvis realm privacy firewall)

- A deeper review of the legacy `/api/ai/chat` path found that its server-side sanitizer was primarily a blacklist. The client payload included mixed-realm calendar events, projects, ideas, intentions and untagged memory strings. Several of those arrays were not filtered by the older sanitizer, so relying on client-side filtering alone was insufficient.
- Added server-side realm filtering for Mariluna and Personal chat contexts: calendar events, projects, ideas, intentions, tasks and goals are retained only when their explicit `realm` matches the active domain. Ambiguous active-context items are dropped. Untagged `memoriesSample` strings are removed because they cannot be safely assigned to a realm.
- Removed personal work-context details and private-derived capacity/check-in signals from the Mariluna structured Brain context. Heritage and personal planning preference fields are also withheld from that business scope.
- Added Node test-runner regression tests for both realm directions and included them in CI. The test suite, TypeScript check and production build all passed together on commit `994618c39ae7d9c2622aa7626784430aecf4773b`.
- These tests cover the sanitizer's known payload fields. They are not a complete proof of privacy: the broader client payload schema, other AI endpoints, balanced-mode consent semantics and all future fields still require a systematic audit. Authentication persistence and encrypted at-rest storage remain unresolved production blockers.

## Progress log — 18 November 2026 (server-side authorization boundary)

- Added `requireAppAuth` middleware that rejects requests without an authenticated app session and enforces the configured inactivity timeout at the server boundary. Successful authorized requests refresh session activity.
- Applied the middleware to the legacy Jarvis chat, day-planning, goal-breakdown and idea-analysis endpoints; to all Alchemy Brain endpoints (brief, task split, query and styling evaluation); and to integration status/connect/disconnect/sync/test-push routes.
- This closes an important gap where the client lock screen could otherwise be bypassed by calling private API endpoints directly. The in-memory session store remains a limitation: server restarts invalidate sessions and multi-instance deployments do not share session state.
- CI was repeatedly cancelled by the workflow's `cancel-in-progress: true` setting while several small commits landed in quick succession. A clean run against the latest commit is required before treating this authorization change as validated.

## Progress log — 18 November 2026 (privacy defaults and integration trust)

- Changed AI permissions so personal records, Mariluna business records, cycle data and wellbeing data are all excluded from AI context by default. Access requires explicit permission through the protected settings flow.
- Hardened permission updates with an explicit allowlist of supported boolean settings and AI provider values. Unknown properties are ignored; mandatory confirmation requirements remain immutable.
- Added regression tests for privacy-by-default and permission allowlisting.
- Closed a false-connection path in the integration API: client-supplied `verified` flags, email addresses or imported post/message arrays are not proof of Google or Meta authorization. Google Calendar/Gmail and Instagram now return an explicit not-implemented response instead of recording a fake connected state. Native Health Connect remains unavailable until its Android bridge exists. Browser push permission remains a local browser capability.
- Remaining architecture blockers are unchanged: security state and integration state are in-memory, app data is plaintext in browser local storage, and OAuth token exchange/refresh/revocation is not implemented server-side. These are not production-ready conditions.

### Additional release blocker found during security review

- The current security vault creates recovery codes at process startup but only stores their hashes; the initial plaintext codes are not delivered through a safe first-owner setup flow.
- Passkey/TOTP enrollment now correctly requires an authenticated session, but a fresh deployment has no persisted credential store or owner bootstrap mechanism. Since sessions and credentials are currently in-memory, a server restart can invalidate the only enrolled authentication methods.
- Before any real deployment, implement durable identity/session/credential storage and a one-time owner bootstrap flow (or a trusted external identity provider). Do not reopen unauthenticated passkey/TOTP enrollment as a workaround.

## Progress log — 18 November 2026 (CI stability and dependency hygiene)

- Removed the duplicate `vite` entry from `devDependencies`; it remains a production dependency as required by the Vite build.
- Changed the GitHub Actions concurrency policy to queue branch validations instead of cancelling an in-progress validation whenever a second commit arrives. This makes rapid implementation iterations less likely to leave only cancelled checks.
- Verified the privacy-firewall fix that keeps nutrition and dietary preferences behind the wellbeing AI opt-in. The latest validation run on commit `4c3fd190fa8a58d7f86502d467fdf981f8f27d5c` completed successfully: frozen Bun install, TypeScript, privacy regression tests and production build.
- The next architecture step is still a design-and-migration boundary, not a live database cutover. No Supabase project credentials or existing database schema are present in the repository context. Do not point the app at a guessed project or migrate existing local data without a verified project and export/restore path.

## Progress log — 18 November 2026 (verified backup and restore workflow)

- Added `src/lib/backup.ts`: exports a versioned Alchemy backup envelope with a SHA-256 checksum, validates the envelope and required AppState structure, rejects checksum mismatches, and provides an explicit restore helper.
- Added backup tests for successful round-trip verification, tampered payload rejection, unsupported format rejection and incomplete-state rejection.
- Wired the Settings > Data Sovereignty & Backups controls to the new export/verification flow. New exports use the checksummed envelope. Import verifies the checksum before replacing app state and requires explicit confirmation. Legacy raw JSON exports remain importable only after structural checks and two confirmation steps because they do not contain an integrity checksum.
- Latest commit `a625ef7fcea2bd0e693caca199b4e9598274b89d` passed GitHub Actions: dependency install, TypeScript check, privacy + backup regression tests and production build.
- Backup integrity is not encryption. Current browser storage remains plaintext and the backup JSON contains the full app state; users should keep exported files in a private location. Cloud persistence is not connected and no live migration has run.

## Progress log — 18 November 2026 (backup UX accuracy and auth perimeter review)

- Reviewed the server route perimeter: the Gemini chat, day-planning, goal-breakdown and idea-analysis endpoints are all mounted behind `requireAppAuth`. The integrations status endpoint is also protected. This is a source review; it does not replace live penetration testing.
- Updated Settings copy to stop claiming browser storage is "secure". It now accurately says that app data is stored in this browser, is not encrypted yet, and cloud storage is not connected.
- Renamed backup actions to describe their actual integrity-checking behavior ("Export verified backup" and "Verify & restore backup").
- Latest commit `fa78d539a8ee1d8118444ae7658186a8f40d8413` passed GitHub Actions: dependency install, TypeScript check, privacy/backup regression tests and production build.
- No live Supabase project is connected. No database migration or live browser restore test has been run. Browser localStorage remains plaintext, and SHA-256 checksums detect accidental/unauthorized file changes only when the checksum itself is not also recomputed; they are not encryption or a digital signature.

### Follow-up — backup metadata validation

- Extended backup verification to reject invalid app schema versions and malformed export timestamps before a restore can proceed.
- Added regression tests for both invalid metadata cases.
- CI for commit `8af1894f952546148eb1bd68269040730a3af0a6` completed successfully: dependency install, TypeScript, privacy/backup tests and production build.

## Progress log — 18 November 2026 (rollback protection for destructive data actions)

- Restore now offers an automatic checksummed download of the current app state before replacing it with an imported backup.
- Full reset now also downloads a checksummed rollback backup before resetting. If the backup cannot be created, the reset is cancelled instead of proceeding without a recovery copy.
- Updated confirmation text to explain the automatic rollback download. This reduces reliance on the user remembering to export first.
- GitHub Actions for commit `50cdb44f394605a684ab5b4175031ffaa09f097b` passed dependency installation, TypeScript, privacy/backup regression tests and production build.
- Limitation: the rollback file download is initiated by the browser; this code cannot verify that the user retained the file. A later persistent server-side snapshot/restore mechanism is still required before cloud migration.

## Progress log — 18 November 2026 (deployment readiness transparency)

- Added `GET /api/ready` as a separate deployment-readiness endpoint. It currently returns HTTP 503 with explicit blockers instead of allowing infrastructure monitors to mistake a running Node process for a production-ready Alchemy deployment.
- The blockers name the actual outstanding work: durable Supabase identity/session storage, durable credential and integration persistence, and encrypted app-state storage. This endpoint is intentionally not a liveness check; `/api/health` remains the process health endpoint.
- Latest source commit: `ae27c70662c7ad5a959de73a0438d534eb241459`. CI validation has been triggered and is pending at the time of this note.

## Progress log — 18 November 2026 (migration safety gate)

- Consolidated the Supabase migration directory to one initial identity/persistence migration. Removed a duplicate schema migration to avoid conflicting definitions.
- Added `scripts/check-supabase-migrations.ts` and `bun run check:supabase` to validate canonical 14-digit migration timestamps, unique migration versions, required owner/persistence/security tables, RLS on every required table, server-only privilege revocation and owner-scoped policies.
- The first CI run correctly caught that the migration filename used a 12-digit timestamp. Renamed it to the canonical 14-digit Supabase timestamp and reran the full workflow.
- Commit `3482929e595665f32d35129a9ef9b741900d6232` passed dependency installation, TypeScript, Supabase migration safety checks, privacy/backup tests and production build.
- These are static migration checks only. SQL has not been applied to a live Supabase project; database behavior, RLS execution and restore drills remain unverified.

## Progress log — 18 November 2026 (preview and environment safety)

- Replaced fake example values in `.env.example` with blank placeholders so copying the sample cannot accidentally make a fake API key or URL look valid.
- Added `docs/ALCHEMY-1.0-DEPLOYMENT-PREVIEW.md` documenting the current Express/Vite production shape, the distinction between liveness and readiness, required server-only secrets, and the explicit acceptance gates before a public preview.
- Reviewed the live security implementation: sessions, passkeys, TOTP, recovery codes, rate-limit state and permissions remain process-memory state. The browser session cookie is HttpOnly/SameSite=Lax, but the underlying session is not durable. No Supabase Auth/JWT verification or owner bootstrap is wired yet.
- Public `/api/ready` response has been reduced to a generic not-ready status; it no longer enumerates internal security blockers to unauthenticated callers.
- CI for commit `12111c212d492df31adc52fa6a1f39cafca1cdaa` passed dependency installation, TypeScript, Supabase migration checks, privacy/backup tests and production build.
- No public preview was deployed: current persistence/auth limitations make that unsafe for real personal or business data.

## Progress log — 18 November 2026 (server-mediated snapshot hardening)

- Added a follow-up migration that removes direct `anon` and `authenticated` table privileges on `app_state_snapshots`. Snapshot reads/writes are intended to go through the server API using the server-only Supabase service role.
- Added the `save_app_state_snapshot` RPC with per-owner transaction-scoped advisory locking, validated inputs, an empty `search_path`, and execution granted only to `service_role`. The RPC allocates revisions and inserts a snapshot in one database transaction.
- Updated the server persistence adapter to use the atomic RPC instead of a read-then-insert revision sequence. It verifies the Supabase Auth identity, bounds snapshots to 1.5 MB, checks returned owner identity and validates stored schema/revision metadata and canonical SHA-256 integrity.
- Added regression coverage for malformed owner UUIDs, oversized tokens/payloads, cross-owner snapshot responses, atomic RPC arguments and existing integrity cases. Added static migration checks for direct table grants and RPC security configuration.
- CI on commit `afff35882aabd2f4e4b64d8eabe6809f2d6eb54f` passed TypeScript, migration safety, privacy tests and production build. Further changes after that commit are being validated separately; do not carry forward the earlier green status as proof for later commits.
- This is still a server-side persistence foundation, not a live client cutover. The React app continues to use localStorage; Supabase credentials/project are not configured in the repository. No SQL was applied to a live database and no user data was migrated.
- Next: complete the persistence adapter's route-level tests and identity/session strategy before any client cutover. Preserve localStorage as the rollback source until a staging Supabase project and restore drill are verified.

## Progress log — 18 November 2026 (snapshot API validation hardening)

- Added fail-closed handling for malformed Supabase server configuration on both snapshot read and write routes. Invalid configuration now returns a generic 503 response instead of escaping the route handler.
- Added structural validation for persisted Alchemy state: required module arrays, Foundation data and integration state must be present. The same validation is applied before writes and after reads, so a syntactically valid but incomplete JSON object cannot silently become the latest snapshot.
- Added route-level regression tests for malformed environment configuration and incomplete payloads; added persistence validation fixtures and tests.
- The earlier commit `0ba74472a730f8de93f9f0ddc46e17d61fba3671` passed the complete CI workflow, including the new API route tests. Commits after it are still awaiting their own final CI result; no green status is inferred from earlier commits.
- This hardening remains limited to the server-side snapshot foundation. The browser app still uses localStorage, Supabase is not configured or migrated, and the existing in-memory custom security vault is not yet durable.

## Progress log — 18 November 2026 (strict snapshot contract and checksum semantics)

- Tightened the snapshot payload contract to require all core Alchemy collections, core state objects, chat history, sample-data flag, valid setup status, Foundation identity data and the expected calendar/Gmail integration state. This rejects incomplete JSON before it can become the latest durable snapshot.
- Snapshot reads and writes both validate the same contract. Saved RPC responses are now checked for owner, revision, schema version, source, payload structure and checksum before being accepted.
- Corrected canonical SHA-256 serialization to follow JSON transport semantics: undefined object properties are omitted and undefined array values serialize as null. This matters because the browser-to-server JSON request and PostgreSQL JSONB do not retain JavaScript undefined properties.
- Added tests for the full state contract, incomplete state, tampered write responses, incomplete stored snapshots and JSONB key-order/checksum behavior.
- CI passed on commit `e5cbde6ef8dc4e55f4df03486012837ab3f0ff4c` (TypeScript, migration checks, privacy tests and production build). Later commits containing additional checksum assertions and this log entry are being validated independently.
- No Supabase database has been provisioned or migrated; no client cutover has been made. The localStorage state remains the active app source of truth and must be preserved until staging restore tests pass.

## Progress log — 18 November 2026 (explicit browser persistence adapter)

- Added a typed client adapter for reading and writing owner snapshots through `/api/persistence/snapshot`. It requires an explicit Supabase user access token, never sends a service-role credential, validates server responses and treats a missing remote snapshot as a normal first-run state.
- Added client adapter tests for missing tokens, bearer-only authorization headers, first-run empty state, malformed server data and server-side configuration errors. Added the new test file to the CI test command.
- The adapter is intentionally not connected to React startup or autosave. No credentials or live Supabase project are available, and activating remote persistence before Auth and restore testing would risk user data. localStorage remains the source of truth and rollback copy.

## Progress log — 18 November 2026 (snapshot boundary hardening)

- Browser snapshot responses are now checked against the full Alchemy state contract, owner UUID, revision/schema metadata, source, timestamp and mandatory SHA-256 checksum. A remote record without a checksum is not considered restorable.
- The browser refuses to send an incomplete local state and rejects malformed access tokens before making a network request. The API applies the same bearer-token size/whitespace checks.
- Server snapshot reads now require a complete UUID-backed record and a valid mandatory checksum before returning it. Owner mismatch, incomplete metadata and integrity failure are separate rejection paths.
- Added regression coverage for malformed bearer tokens, incomplete local state, source mismatch, missing checksums and structurally valid-but-tampered snapshot records.
- The persistence adapter remains deliberately disconnected from app startup/autosave. No remote read can overwrite the local state until a staging restore flow is proven safe.

## Progress log — 18 November 2026 (non-destructive migration planning)

- Added a read-only migration planner for the four meaningful first-run states: clean start, local-only data, remote-only data and data on both sides.
- Uploading local state and restoring cloud state both require explicit confirmation. If both local and remote records exist, the planner explicitly refuses to choose a winner or merge/overwrite automatically.
- The plan reports record counts and the remote revision/timestamp so a future migration screen can present a clear choice before any write.
- Added tests for all four states and registered them in CI. The planner is intentionally separate from app startup and has no write capability.

- Refined migration detection to ignore prefilled Foundation defaults while still detecting completed/changed identity profiles, cycle tracking, styling/nutrition records, connected integrations and nested Mariluna finance/metrics data. This avoids both false positives on a clean first start and false negatives for business-only records.

- Migration data detection explicitly ignores the preconfigured Foundation template shipped with Alchemy (including its seeded profile and completed-template flag). Only fields changed from the template, actual user records, configured cycle data, or connected integrations count as local user data. This prevents a brand-new install from being misclassified as an existing local database.
- Added regression tests for a clean seeded install, profile-only customisation and Mariluna-only finance records. The current CI run is validating these cases together with the stricter snapshot boundary.

## Progress log — 18 November 2026 (application session perimeter)

- The app-lock session identifier is now accepted only from its HttpOnly cookie; the legacy caller-controlled `x-session-id` header is no longer an authentication path.
- Session cookie values must match the exact 256-bit random hexadecimal format before the in-memory registry is consulted. Malformed values receive a fresh locked session rather than being treated as credentials.
- Regression tests cover a valid cookie, an unauthenticated request, a forged session header and a malformed cookie. This tightens the current single-process session boundary; it does not yet make sessions durable across server restarts.

## Progress log — 18 November 2026 (WebAuthn ceremony hardening)

- Pending registration and authentication challenges now expire after five minutes and are stored in a bounded in-memory registry; expired entries are pruned and the registry has a hard capacity limit.
- Registration and authentication verification now atomically consume the challenge before cryptographic verification. A failed attempt therefore cannot reuse the same nonce, and concurrent/replayed submissions cannot both verify against one challenge.
- Added regression tests for one-time consumption and expiry. These controls remain process-local; durable credential/challenge storage is still part of the future Supabase-backed identity work.


## Progress log — 18 November 2026 (WebAuthn origin and verification policy)

- Replaced request-derived WebAuthn trust with an explicit relying-party resolver. Production now fails closed unless `WEBAUTHN_RP_ID` and `WEBAUTHN_ALLOWED_ORIGINS` are configured.
- The resolver validates exact HTTP(S) origins, rejects path/query/fragment and credential-bearing origin values, binds the browser origin to the request host, and verifies the RP ID is the host itself or a valid parent domain.
- Development fallback is restricted to loopback hosts; arbitrary preview or public hosts require an explicit allowlist.
- Passkey registration and authentication options now request required user verification. Passkey verification attempts are rate-limited with the same session-scoped key used by the other authentication routes.
- Added dedicated allowlist, RP-ID, host-binding and fail-closed tests; registered them in the CI test command.
- Deployment configuration must set the actual production RP ID and exact allowed origins before passkeys can be enrolled or used. This is intentionally not guessed or deployed automatically.


## Progress log — 18 November 2026 (server-side AI privacy enforcement)

- The Jarvis brief and query endpoints now apply the existing realm/privacy sanitizer on the server before using context in either Gemini prompts or local fallback logic. Client-provided filtering metadata is no longer trusted as the security boundary.
- The selected workspace controls the context allowlist (`personal` or `mariluna`); unknown workspace values fail to the private/personal path rather than an unrestricted combined context.
- Gemini use now also respects the saved AI provider choice and the separate personal/Mariluna AI-consent switches. With consent disabled or the local-rules provider selected, the server uses its deterministic local response path instead of sending the request/context to Gemini.
- Task splitting follows the same workspace consent and provider checks. Image-based personal styling analysis requires personal AI consent and sanitizes its profile context before sending it to Gemini.
- These checks run at the server boundary; client UI filtering alone is not treated as authorization. The settings and security vault remain in-memory pending durable identity/settings storage, so consent configuration is not yet persistent across restarts.


## Progress log — 18 November 2026 (session credential exposure and response caching)

- The security status response and device inventory no longer expose the raw HttpOnly session credential. Device management now uses a separate random public identifier, and revocation resolves that public identifier server-side.
- Authentication responses no longer return the internal session object. This closes an unnecessary credential disclosure path that would have undermined the HttpOnly cookie boundary if a script could read API responses.
- Security/authentication routes now set `Cache-Control: no-store, private`, `Pragma: no-cache` and `Vary: Cookie` so recovery codes, device inventory and authentication status are not retained by browser or intermediary caches.
- Regression coverage verifies the device inventory identifier is not the cookie credential and can still revoke the intended session.


## Progress log — 18 November 2026 (complete Jarvis AI consent perimeter)

- Extended server-side AI provider/consent enforcement to the legacy `/api/ai/*` routes as well as the newer `/api/brain/*` routes. Chat, day planning, goal breakdown and idea analysis now respect the selected workspace's AI consent and provider mode before contacting Gemini.
- The day-planning prompt now uses the sanitized task, event, working-hours and preference values; it no longer serializes the raw client payload after sanitization.
- Chat history is tagged and displayed per workspace in the client. Only messages from the active workspace are sent as Gemini conversation history; switching between Privé, Mariluna and combined view does not carry the previous realm's chat into the next request.
- Balanced workspace AI requires consent for personal, Mariluna and wellbeing data. Every mixed-realm collection (calendar events, projects, ideas, intentions, tasks and goals) is filtered against server-owned realm consent; untagged records are excluded.
- Financial data now has its own independent consent boundary. Prices, invoices, expenses, tax/admin records and revenue/profit metrics are withheld unless financial AI consent is enabled, even when general Mariluna AI context is allowed.
- Goal and idea prompts use bounded input values. Chat payloads are capped to the latest 20 messages and 8,000 characters per message.
- Added regression tests for mixed-workspace filtering and financial-data quarantine. These privacy settings still live in the in-memory security vault until durable owner identity/settings storage is connected.


## Progress log — 18 November 2026 (session lifecycle and authentication abuse controls)

- Application sessions now have a 30-day absolute lifetime aligned with the HttpOnly cookie lifetime. Expired sessions are rejected and pruned from the active-device inventory.
- The in-memory session registry has a hard capacity of 10,000 entries and evicts the least-recently-active entry only when the registry reaches that cap.
- Failed-authentication counters now expire after 30 minutes and are bounded to 10,000 keys, preventing unbounded growth from unauthenticated traffic. The five-failure / 15-minute lockout behavior remains covered by regression tests.
- WebAuthn endpoints return generic client-facing errors rather than forwarding internal verification exception messages. Detailed diagnostics remain server-side only.
- These lifecycle and rate-limit controls are still process-local. A restart clears sessions, credentials, counters and permissions until the durable Supabase identity layer is provisioned and connected.


## Progress log — 18 November 2026 (authenticator enrollment hardening)

- Passkey enrollment options and verification now both require a recent step-up authorization. Registration attempts use the same bounded lockout mechanism as passkey sign-in.
- TOTP enrollment verification now checks the authentication lockout, records failed codes and clears the counter only after successful verification.
- Balanced workspace filtering now explicitly recognizes the `balanced` scope as well as `all`; realm-tagged intentions retain their realm metadata so the privacy filter can make the correct decision.


## Progress log — 18 November 2026 (workspace-aware AI actions and consent UI)

- Jarvis task splitting now receives the originating task realm from Today, so a Mariluna task cannot accidentally use the personal AI-consent switch (or vice versa). Day-planning requests also carry an explicit realm.
- Added a separate Financial Data consent toggle in Security & Privacy. Enabling or disabling sensitive workspace/data-sharing permissions requires step-up authorization; the UI now defaults to the same deny-by-default values as the server while status is loading.
- General Mariluna consent now excludes Mariluna clients, offerings, metrics, admin and integration records when disabled. Financial consent remains a separate gate for prices and financial metrics.


## Progress log — 18 November 2026 (AI provider control)

- Added a Security & Privacy control to choose between local deterministic Jarvis processing and Gemini server processing. Changing the provider requires step-up authorization.
- Selecting Gemini does not override any data-consent switch: the selected workspace and the relevant personal, Mariluna, wellbeing and financial permissions continue to be enforced independently at the server boundary.
- The UI's initial consent display now matches the server's deny-by-default state rather than visually suggesting permission before status has loaded.


## Progress log — 18 November 2026 (Jarvis memory retrieval)

- Connected structured memories to Jarvis context instead of sending the legacy unscoped `memoriesSample` strings.
- Only active, explicit or user-confirmed memories are eligible. Pending learned suggestions, archived items, expired memories and unscoped records are excluded; the result is capped at 20 memories and 600 characters each.
- Memory retrieval is realm-aware and separately checks personal, Mariluna, wellbeing, cycle and financial permissions. Sensitive memories require their corresponding additional consent even when general workspace access is enabled.
- Jarvis receives confirmed memories as context, with explicit prompt guidance that memory text is data rather than instructions and never overrides the current user request.
- Added regression tests for realm/sensitivity consent and memory status filtering. The memory list remains local-first until durable storage is connected.

- The local Jarvis fallback can now answer direct memory-recall questions from the same filtered confirmed-memory list, so basic recall still works when Gemini is disabled or unavailable.


## Progress log — 18 November 2026 (Jarvis request protection)

- Added a bounded sliding-window quota to the server security layer: each authenticated session can make up to 20 Jarvis AI requests per minute across the Brain and legacy AI endpoints.
- Excess requests receive HTTP 429 with a retry interval; the limiter is isolated per session and prunes expired windows while bounding its own memory use.
- Added regression tests for the limit, reset behavior and session isolation.
- This is an in-process abuse-control layer, not a substitute for a shared distributed rate limiter when the app runs across multiple server instances. The broader security vault and session store also remain process-local pending durable identity storage.


## Progress log — 19 November 2026 (Phase 2 navigation and daily workflow)

- Separated the Start launcher from the Today destination. Start remains the neutral world selector; Today now has its own daily dashboard.
- Added a focused daily dashboard that surfaces due and overdue tasks, sorts by priority and due date, shows today's calendar events chronologically, and provides direct routes to Tasks, Calendar and Jarvis.
- Kept the global Quick Capture available from Today as well as the working areas. Quick Capture continues to create realm-tagged tasks, reminders, ideas, notes and calendar events.
- Updated Quick Capture realm selection to use the Mariluna berry/plum and Private botanical-green palette tokens.
- Harmonized navigation shell colors with The Enchanted Atelier palette and kept the five-item mobile navigation: Start, Today, Mariluna, Private and Tasks.
- CI passed TypeScript, Supabase migration safety, privacy regression tests and production build on the phase-2 branch before the final navigation palette-only follow-up. The follow-up has a new CI run queued/in progress and must pass before this phase is considered verified.
- This phase remains on `build/phase-2-planner`; it has not been merged to `main` or pulled into AI Studio.

- Fixed task creation/edit defaults to use the user's local calendar date rather than UTC date slicing, preventing date drift around midnight and timezone boundaries. Verified by TypeScript, Supabase migration safety, privacy regression tests and production build (CI run 44521709662, success).


## Progress log — 19 November 2026 (integration scope refinement)

- Removed the Mariluna Gmail integration card from the Integrations hub at the user's request. Email synchronization is explicitly out of scope; Calendar, Android Health Connect and Renpho remain planned integrations.
- No Gmail data model or historical data is deleted by hiding/removing this integration UI. Existing stored state is preserved for non-destructive compatibility.
- Next integration work remains provider verification and native Android Health Connect feasibility, followed by Renpho import-path validation and calendar sync reliability.


## Product scope reset — 19 November 2026 (user-confirmed Alchemy 1.0 MVP)

The earlier broad business-suite scope is superseded for Version 1.0 by this lean, personal-first brief. The goal is a reliable second brain that reduces mental clutter, helps the user organize ideas and life, and supports sustainable wellbeing. Prioritize working end-to-end flows over breadth. Defer non-essential modules until the core app is stable and genuinely useful.

### Product promise
Alchemy is one personal operating system with two clearly separated spaces:
- **Mariluna:** a low-pressure idea studio and organizer, not a full business-management suite.
- **Privé:** a practical personal-life and wellbeing companion.
- **Jarvis:** the central thinking partner that helps structure information, find connections, suggest next steps and support follow-through, while respecting the two spaces' privacy boundaries.

### Mariluna — MVP scope
1. **Brain Dump / Idea Studio (highest priority)**
   - Fast capture of a raw idea with optional theme/category and free-form context.
   - Open a conversational Jarvis sparring session around that idea; preserve the original idea and the discussion/decisions.
   - Allow the user to explicitly classify/convert an idea into Content or Project with a clear action; Jarvis may suggest a destination, but must ask before moving/creating anything automatically.
   - Content destination is intentionally lightweight: an idea/post entry, its source idea, notes and optional next step. No elaborate publishing calendar or social analytics.
   - Project destination supports practical initiatives such as a ritual or women's circle, with a simple description, checklist/tasks and optional date.
   - Jarvis should surface possible links to older ideas, duplicates, themes and combinations; suggestions must be explainable and dismissible, not silently merge records.
   - Gentle resurfacing: ask whether the user wants to revisit an older idea, with snooze/dismiss/convert options and configurable frequency. Avoid nagging.
2. **Services catalogue (simple personal reference)**
   - User manually creates, edits, reorders and deletes service entries.
   - Keep it as a flexible working list for experimenting with wording, structure, inclusions and prices/notes if desired.
   - No CRM, client pipeline, bookings or invoicing in MVP.
3. **Mariluna values & pillars**
   - Provide a user-editable place to define values, boundaries, principles and content/brand pillars when ready.
   - Jarvis should use only the values/pillars the user has actually entered and confirmed when reviewing ideas, service concepts or content. Until configured, it must say the framework is not yet defined rather than inventing values.
4. **Social media support**
   - No large social-media management suite. Offer optional hands-on assistance when the user chooses to make content: develop a raw idea into a post, suggest a format/caption and a manageable next action. Publishing/scheduling integrations are deferred.
5. **Remove from MVP:** business metrics/financial dashboard, client management, elaborate content calendar and advanced marketing analytics.

### Privé — MVP scope
1. **Cycle, moon & natural rhythm (high priority)**
   - Cycle tracking and phase overview remain central.
   - Offer optional planning/reflection prompts that combine cycle phase, lunar cycle and seasonal/nature context in a practical, non-prescriptive way that can fit modern work and life.
   - Distinguish astronomical/calendar facts from symbolic or traditional interpretations. Never present moon phases or cycle-based assumptions as medical facts or deterministic rules.
   - User remains in control; no pressure to organize every day around a cycle phase.
2. **Health, measurements & movement**
   - Prioritize importing/recording measurements and a reliable Health Connect pathway over a large health dashboard.
   - Show source, unit, timestamp and last successful sync. Do not fabricate connection/sync state.
   - Support realistic movement goals and gentle encouragement, focusing on mobility, strength, consistency and healthy ageing as well as weight-related goals.
   - Movement suggestions should be adaptable to available time, energy and user-selected goals; avoid shame, streak pressure or overclaiming health outcomes.
3. **Meals & recipes — simple chooser workflow**
   - One simple entry point: user can enter ingredients currently available, or a craving/category (e.g. pasta).
   - Suggest a small set of recipes to choose from, respecting the user's configurable dislikes/preferences.
   - After selection, ask how many people will eat; then show the scaled recipe and a shopping list for missing ingredients.
   - Let the user edit/tweak recipes and save preferred versions. A user-editable "I don't like / avoid" list lives in settings.
   - No complex calorie/macronutrient tracker required for MVP.
4. **Goals & progress**
   - Keep personal goals with clear progress bars/percentages, milestones and regular check-ins/reminders.
   - Follow-through and visible progress are more important than adding more goal frameworks.
5. **Remove from MVP:** Personal Styling, routines/habit module and other lifestyle modules that do not support the core promise. Revisit later only after the core app is stable.

### Shared core — MVP scope
- Neutral Start screen with two entry points: Mariluna and Privé.
- A simple Today view showing relevant tasks, appointments and gentle priorities.
- Shared planner with clear domain separation, tasks, appointments and recurring task support.
- Global Quick Capture for task, idea, note, appointment and reminder, with explicit domain selection.
- One Jarvis assistant with separate domain memory/context. It helps organize, connect, summarize, suggest and remind; it does not silently reclassify, merge, publish or delete data.
- A small, useful notification/reminder system with user-controlled frequency and snooze.
- Integrations: calendar, Android Health Connect and Renpho only if a supported route is verified. Gmail/email is explicitly excluded.
- Durable data storage, backup/export and recovery are core reliability requirements, not optional polish.

### Security and privacy — revised user experience
- Remove the mandatory app-opening security lock / startup authentication screen from the MVP user experience.
- Keep sound engineering safeguards: server-side secrets, least-privilege provider scopes, secure transport, data isolation between Mariluna and Privé, safe session handling where applicable, backups and user-controlled data export/deletion.
- No prominent security-management product area is needed in the initial navigation. Put essential account/privacy controls in Settings and keep advanced security options deferred.
- Never interpret the user's relaxed preference about a startup lock as permission to weaken server security, expose secrets or allow cross-domain data leakage.

### MVP delivery priorities
1. Make Start, Mariluna Brain Dump, Jarvis sparring, idea-to-content/project conversion, services list and Privé cycle/health/meals/goals work reliably.
2. Make the shared planner and Quick Capture dependable and easy to use on mobile.
3. Connect calendar and health/scale data only through verified, supportable integrations.
4. Implement durable persistence, backup/recovery and privacy boundaries.
5. Test core flows end-to-end on mobile and desktop before expanding scope.

**Explicitly deferred:** full CRM, business financial reporting, advanced social publishing/analytics, personal styling, routines, complex nutrition tracking, elaborate automation, and Google AI Studio portability until the lean MVP is stable.


## Product scope reset — user-confirmed Alchemy 1.0 direction (19 November 2026)

This section supersedes any earlier roadmap ambition that conflicts with it. The immediate goal is a small, reliable, genuinely useful personal operating system — not a comprehensive business platform. Preserve useful existing modules and data, but simplify the product surface and defer nonessential features.

### Product promise
Alchemy is Patricia's second brain: it captures mental clutter, helps her think, organizes information, connects related ideas, follows up on intentions, and supports healthier, more intentional living. Jarvis is the central assistant across both domains, with strict context boundaries.

### Mariluna — deliberately lightweight
Mariluna is currently low-activity and exploratory. Do not build a full business-management suite in v1.

1. **Braindump & Sparring (primary module)**
   - Fast, low-friction capture of raw thoughts, ideas, themes, questions and possibilities.
   - Conversational AI sparring: clarify, explore, challenge constructively and help develop ideas.
   - Keep the original brain-dump intact; preserve conversation and provenance.
   - Jarvis organizes ideas with useful metadata and can surface old ideas, reminders to revisit, similarities, duplicates/near-duplicates and possible combinations.
   - Support explicit user actions to turn an idea into a content idea, project (e.g. ritual or women's circle), task, or keep it as a brainstorm.
   - Jarvis may recommend a destination, but moving/creating structured records should be transparent and confirmed by the user. Maintain links to the source idea.
   - Proactive resurfacing should be gentle, relevant, snoozable and controllable; no noisy notifications.

2. **Services & Offerings (private reference catalogue)**
   - Simple editable list for Patricia's own reference, not a sales or client system.
   - Add, edit, tweak, archive and delete entries; user controls all content and pricing.
   - No customer management, revenue dashboards, sales pipeline or booking functionality in v1.

3. **Lightweight content assistance**
   - No elaborate editorial calendar or social-media management suite.
   - When requested, help turn a brain-dump/idea into a post, caption or content outline, and provide practical support because the user finds social media difficult and does not particularly enjoy it.
   - Content may be linked back to its originating idea.

4. **Values and pillars**
   - Create an extensible place to define Mariluna's values, boundaries, principles and pillars later; they are not yet written.
   - Once provided, Jarvis should use them as a review lens when discussing or developing Mariluna ideas. Do not invent the user's values.

Remove/defer for v1: business metrics, client CRM, extensive strategy dashboards, complex content planning, sales/admin modules.

### Privé — practical personal life support
1. **Cycle, nature and rhythms (important)**
   - Cycle tracking and phase-aware planning are core, not optional extras.
   - Help the user live more in tune with her cycle and, where useful, lunar and seasonal/natural rhythms, in a realistic way compatible with work and modern life.
   - Distinguish evidence-based cycle information from traditional, symbolic or reflective practices. Do not present lunar phase effects on physiology as established science.
   - User remains in control of cycle dates, interpretations, reminders and recommendations.

2. **Health, measurements and movement**
   - Prioritize importing/synchronizing measurements and health/activity data through supported integrations, especially Android Health Connect.
   - Renpho data route must be verified; do not promise a direct API. Offer supported export/import if needed.
   - Focus on trends and meaningful measurements, not an overbuilt medical record.
   - Help build sustainable movement and mobility habits for long-term health, healthy ageing, strength and weight management.
   - Motivation should be empathetic and practical, not guilt-based. Adapt suggestions to real schedule, energy and preferences.
   - Health data stays private and is never included in Mariluna context by default.

3. **Meals & recipes (simple cooking helper)**
   - One simple input: ingredients on hand (e.g. "I have X and Y") or a craving/category (e.g. pasta).
   - Return a small set of recipe choices.
   - After the user chooses, ask how many people; then provide adjusted quantities, method and a shopping list for missing ingredients.
   - Allow recipes to be edited/tweaked and saved.
   - Add a user-editable "foods I dislike / avoid" list in settings and use it in suggestions.
   - No calorie tracker, complex nutrition database or mandatory meal logging in v1.

4. **Goals and progress**
   - Keep goals with clear milestones and simple progress bars/percentages.
   - Make follow-up and progress visibility motivating and easy to maintain.
   - Avoid turning goals into a burdensome project-management system.

Remove/defer for v1: personal styling, wardrobe/body-shape tools, routines module, elaborate habit systems and unrelated lifestyle modules.

### Global planner and capture
- Keep a simple shared planner for appointments and tasks, with clear Private/Mariluna ownership.
- Quick Capture should be easy to reach and default to the active domain.
- Prioritize low-friction capture and reliable reminders over complex planning features.
- Shared records remain deferred until explicit privacy and ownership semantics are safely designed.

### Jarvis — central second brain
- Available from both domains and aware of the active context.
- Assemble context server-side and enforce domain boundaries before any AI-provider call.
- Help capture, clarify, organize, compare, connect, retrieve and resurface ideas and commitments.
- Offer suggested actions with previews; user confirmation before creating, moving, deleting or materially changing records.
- Do not claim proactive monitoring or memory behavior unless implemented and tested.
- Keep user control over what is saved, surfaced, and used as context.

### Security and access
- No mandatory login/security interstitial at app launch for the current personal-use v1. Do not add a startup PIN/password screen.
- This does not mean weakening data security: use secure server-side authorization, protected secrets, least-privilege database access, safe session handling where applicable, encrypted transport and reliable backups.
- Keep sensitive health/cycle data isolated from Mariluna and from AI contexts unless explicitly permitted.
- Explain any remaining local-device exposure and backup limitations honestly.

### Delivery priorities
P0: working app shell, no startup security gate, dependable data persistence/recovery, safe domain boundaries, quick capture, core planner, Braindump & Sparring, editable service catalogue, basic goals/progress, cycle tracking, simple recipe flow.
P1: Jarvis idea linking/resurfacing, content assistance, health/Health Connect sync, movement support, lunar/seasonal reflective layer.
Later: Mariluna values/pillars authoring and review, richer integrations, styling, CRM, metrics, elaborate content calendar and broader automation.

### Definition of a useful v1
A user can reliably open Alchemy without a startup security interstitial; capture and find thoughts; spar with Jarvis; turn selected ideas into linked projects/content/tasks; maintain an editable personal service catalogue; manage basic tasks and appointments; track cycle and goals; request recipes and shopping lists; and retain data safely across sessions/devices to the extent supported by the implemented sync. Core flows must be tested on mobile. Do not call a feature complete unless its behavior is implemented and verified.

## Progress log — 19 November 2026 (Jarvis workspace boundary and persistent Mariluna sparring)

- Jarvis now requires an explicit Privé or Mariluna selection when opened from the neutral Home context. The composer and quick prompts stay unavailable until a workspace is selected; the assistant history and requests are scoped to that selection rather than the neutral `all` context.
- Corrected assistant-message routing so replies are saved to the same selected workspace as the user message. This prevents replies from being filed under the neutral Home context and disappearing from the selected thread.
- Mariluna idea sparring now persists the full conversation (user and assistant messages with timestamps) on the originating idea after each exchange and restores it when the idea is reopened. The original brain-dump remains intact.
- Updated the Mariluna sparring prompts and offline fallback to explore the thought first rather than automatically pushing it toward marketing, content or business strategy. Content remains an option when Patricia chooses it.
- Verified on commit `4bf59ebeaa780efbecc68530e04f430cea736ce7`: TypeScript check, Supabase migration safety checks, privacy regression tests and production build all passed in GitHub Actions.
- This does not yet implement semantic idea matching/resurfacing or durable cloud persistence. The new conversation is retained in the current app state/local storage; cross-device persistence remains blocked on Supabase Auth configuration, a confirmed restore/migration choice and a real deployment test.

## Progress log — 19 November 2026 (local data transparency)

- Added a visible storage-status panel to Settings → Data & Backups.
- The panel shows the last local save timestamp for the current app session and the last successfully generated JSON backup timestamp, retained locally across reloads.
- The UI explicitly distinguishes local storage/export from cloud persistence and reminds the owner to keep a backup outside the device.
- This is observability only: it does not encrypt localStorage, create scheduled backups, or enable cloud sync. Cloud migration remains gated on a real Supabase project, Auth, and a verified restore drill.
- TypeScript, migration safety, privacy and production-build CI checks are running for this change; do not call it verified until they finish successfully.

## Progress log — 19 November 2026 (MVP usability and data-status polish)

- The storage status now remembers the last successful local-save timestamp across reloads, rather than showing only the current session's timestamp.
- New goals default to the Privé realm, matching the current personal-first use case; the suggested target date is now one month from the day the goal is created instead of a stale hard-coded date.
- Idea capture defaults to Mariluna only when the Mariluna workspace is active; otherwise it defaults to Privé to reduce accidental cross-domain filing.
- The idea revisit card now accurately describes its three-week threshold and only claims to surface ideas when the user returns to the ideas view; no background monitoring is implied.
- Cycle tracking now uses the device's local calendar date rather than UTC, preventing late-evening date shifts in Belgium and other time zones.
- These are usability and correctness improvements; they do not change the deferred cloud persistence, Health Connect native bridge, or production deployment requirements.

### Additional usability checkpoint — 19 November 2026

- Local date handling is now consistent in the initial state, cycle view, private dashboard and Jarvis context assembler. This avoids UTC-midnight shifts in date-based records and daily context.
- Existing food-preference capture and recipe request flow was reviewed; it already sends the user's saved dislikes and dietary notes with a recipe request. No duplicate parallel recipe feature was added.
- The Mariluna offering editor now supports editable deliverables and draft/active/archived status; its list is the default landing section inside Mariluna.
- New goal and idea capture defaults follow the active workspace more safely.
- Latest verified workflow at this checkpoint: TypeScript check, Supabase migration safety checks, privacy regression tests and production build all passed on the preceding source snapshot. Changes after that snapshot still require a fresh run.
- Still intentionally not represented as complete: Supabase project provisioning and live durable sync, production authentication/session persistence, Android Health Connect bridge, verified Renpho import, and full device QA/release.

## Progress log — 19 November 2026 (Privé and Mariluna MVP polish)

- Added editable goal details and status. Goals can now be reopened from their cards, changed and saved without losing their existing milestones; goals without milestones support direct manual progress updates.
- Hardened older goal records that may not contain a milestone array so the planner remains usable after earlier schema versions.
- Meal history now records a cooked recipe only once for the same planned date and recipe, preventing duplicate history entries when a meal status is toggled repeatedly.
- Pantry starter loading now skips ingredients already present (case- and accent-insensitive) and avoids adding the same staple twice. Used-up stock can be added again.
- Added automated tests for meal-history idempotency and pantry deduplication.
- Cycle phase confidence is now labeled honestly: a logged period date anchors an estimate but does not confirm today's phase. Only a manual user-selected phase is shown as user-confirmed.
- Period logging validates start/end dates, rejects future dates and duplicate period start entries, and explains validation errors before saving.
- Added automated tests for cycle phase confidence semantics.
- Verified on commit `330da8f`: TypeScript, Supabase migration safety, privacy regression tests and production build passed in GitHub Actions. The goal progress slider follow-up is committed separately as `cd3f38b` and has its own validation run pending.
- These improvements do not enable live Supabase sync, native Health Connect, Renpho import or production deployment. Those remain gated on real project credentials, platform bridge work and end-to-end testing.

## Progress log — 19 November 2026 (MVP editing and cycle-data correctness)

- Added direct editing for saved ideas: title, original thought, theme/pillar, category and tags can be changed without replacing the idea record or losing its linked Jarvis sparring history.
- Added one shared cycle-anchor validator. Cycle screens and Jarvis now require a real, non-future calendar date before showing or using phase estimates; impossible dates such as 31 February are rejected.
- The cycle view no longer displays a fabricated phase/day or phase-specific weekly guidance before a valid period start date is recorded. The daily energy check-in remains available on its own.
- Saving cycle settings with a valid period start date enables tracking; logging a period also enables tracking automatically.
- Added regression tests for missing, malformed, impossible and future cycle start dates.
- Verified on commit `b5ac52c`: TypeScript check, Supabase migration safety checks, privacy regression tests and production build all passed in GitHub Actions (run 44547946020).
- The idea editor, goal editor/progress, meal history idempotency, pantry deduplication and cycle validation are implemented on the feature branch. No changes have been merged to `main` or deployed to a live app.
- Live cloud sync remains blocked on provisioning and configuring the actual Supabase project, owner Auth and a verified migration/restore test. Health Connect still needs the native Android bridge; Renpho import remains unverified.


## Progress log — 19 November 2026 (goal preservation and backup hardening)

- Goal editing now preserves existing task, project and content links, notes, priority, measurable targets and start/end metadata instead of silently clearing them when the title or other editable fields change.
- Goal view labels and key form copy were localized for Dutch use.
- Period history now remains sorted newest-first. Logging an older period no longer moves the active cycle anchor backwards; the latest valid recorded start remains the anchor.
- Cycle settings now reject invalid cycle lengths, period lengths and future/missing anchor dates before saving.
- Backup verification now rejects files created with a newer app schema, as well as malformed SHA-256 checksum strings, before restore can proceed.
- Added regression tests for newer-schema and malformed-checksum rejection.
- CI TypeScript, migration safety, privacy and production build passed on commit `181b1fa`. A separate duplicate workflow for the same commit was still running at the time of this log.
- No cloud sync, live deployment, Health Connect bridge or Renpho integration is claimed. The current backup remains a user-triggered local JSON export/import with explicit restore confirmation.


## Progress log — 19 November 2026 (cycle date arithmetic)

- Cycle day and predicted next-period calculations now use explicit date-only UTC arithmetic. This keeps calendar-date calculations independent of the device's local timezone and daylight-saving transitions.
- Added regression coverage for spring and autumn daylight-saving boundary dates.
- Validation is running on the latest commits; no phase completion is claimed until the full workflow is green.
- Existing data, privacy boundaries and integration scope remain unchanged.


## Progress log — 19 November 2026 (integration scope cleanup)

- Removed the unused Gmail OAuth/connect/sync/disconnect implementation from the integrations screen code. Gmail remains excluded from the approved Version 1.0 scope.
- Retained the legacy Gmail data shape in stored integration state for backward compatibility; this change does not delete any existing stored data.
- Calendar OAuth helpers remain in place. Health Connect and Renpho are still not represented as connected until their real platform/data pathways are implemented and verified.
- Fresh CI validation is pending for the latest commits.


## Progress log — 19 November 2026 (notification date correctness)

- Smart notifications now derive their daily grouping key from the device's local calendar date instead of UTC date slicing. This avoids notifications being counted against the wrong day around midnight in Belgium and other timezones.
- Existing notification timestamps are parsed as instants and converted to the local date before daily caps and duplicate-digest checks.
- Cycle-phase context is omitted from smart notifications until a valid, non-future cycle anchor exists.
- Added regression tests for local date keys, timestamp conversion and malformed timestamps.
- Gmail OAuth handlers were removed from the integrations screen as the integration is outside the agreed Version 1.0 scope; stored legacy integration data remains untouched.
- Latest changes are on the feature branch; full CI validation is pending.


## Progress log — 19 November 2026 (calendar entry safety)

- Added reusable calendar validation for strict 24-hour time values and same-day appointment ranges. End times must be later than start times.
- Calendar event creation now displays a clear inline validation message instead of silently accepting an invalid time range.
- Exact duplicate appointments are detected only when title, date, time range and realm all match. Intentional overlaps and same-time events in the other workspace remain allowed.
- Added regression tests for valid/invalid time ranges and realm-aware duplicate detection.
- Existing calendar event data is not rewritten, and no external Google Calendar writes are enabled by this change.
- Latest automated validation is pending.


## Progress log — 19 November 2026 (Jarvis sensitive-context default deny)

- Jarvis AI payload construction now omits reproductive/cycle details by default. The drawer accepts an explicit permission prop, but defaults it to false; no UI permission toggle is claimed as complete yet.
- Daily check-in notes and wellbeing fields are now included only when the dedicated wellbeing-to-AI permission is enabled. A general personal-data permission no longer implicitly grants access to wellbeing check-ins.
- The central context assembler now counts only Mariluna projects in Mariluna scope, preventing private project activity from influencing business-context summaries.
- Calendar appointment validation is connected to the create flow, with inline errors for invalid time ranges and exact duplicates scoped to the same realm.
- Existing calendar entries and stored data are unchanged. Google Calendar writes remain disabled; local appointment creation remains local.
- Latest validation is running for the Jarvis privacy changes. Do not update AI Studio until this workflow is green and the current feature branch is reviewed.


## Progress log — 19 November 2026 (server-side wellbeing privacy)

- Extended the server-side wellbeing consent firewall to remove daily check-in payloads, including free-text notes, whenever wellbeing-to-AI consent is disabled.
- Added a server security regression test proving daily check-in notes and wellbeing fields are absent from the sanitized personal AI context without the explicit wellbeing permission.
- This complements the client-side default-deny behavior; the server remains authoritative even if a client sends fields manually.
- The Jarvis privacy changes and calendar validation from the previous build checkpoint passed CI. This newest server-side regression is awaiting its own workflow result.
- AI Studio handoff remains on hold until the current complete feature-branch checkpoint is green and reviewed.


## Progress log — 19 November 2026 (privacy regression follow-up)

- The first CI run for the daily-check-in server firewall exposed a missed insertion: the test correctly showed that the server-side sanitizer still retained the `dailyCheckIns` key.
- Fixed the actual Rule 5 sanitizer to delete `dailyCheckIns` when wellbeing-to-AI consent is off. The earlier edit had not landed in the effective firewall block.
- TypeScript and migration checks had passed on the preceding commit; privacy regression failed as expected and production build was skipped. A fresh full workflow is required after this correction.


## Progress log — 19 November 2026 (Jarvis memory expiry hardening)

- Jarvis now rejects memory records that supply an invalid expiry timestamp instead of treating malformed expiry metadata as if the memory never expires.
- Expired records continue to be excluded; valid future expirations and memories without an expiry remain supported.
- Added regression coverage for permanent, future-expiring, expired, malformed and non-string expiry values.
- This is a server-side context-filtering hardening change; it does not change stored memory records or automatically delete anything.
- CI validation is pending for this change.


## Progress log — 19 November 2026 (Jarvis local memory context)

- The local six-layer Jarvis context now excludes unconfirmed suggestions, archived memories, expired memories, malformed expiry timestamps and records without a valid realm.
- Personal and Mariluna memories are restricted to their own workspace; the explicitly balanced context can include both realms.
- Added regression tests for memory lifecycle filtering and realm isolation, and included the tests in the standard CI test command.
- This changes only what is assembled for Jarvis context; it does not delete or rewrite stored memories.
- Full validation is pending on the latest feature-branch commit.


## Progress log — 19 November 2026 (Jarvis memory controls)

- Added archive and restore actions to the Jarvis Memory Manager. Archived records are hidden from the normal active-memory filters and can be reviewed and restored from a dedicated archive tab.
- Archiving preserves the memory record and its metadata; it does not permanently delete it. Permanent deletion remains a separate explicit action.
- The local context assembler now excludes archived, pending-confirmation, expired, malformed-expiry and unscoped records before they can influence Jarvis.
- Added lifecycle and workspace-isolation regression tests to the normal test command.
- Validation of the latest combined change is still pending. No production or cloud-persistence claim is made.


## Progress log — 19 November 2026 (local storage failure visibility)

- Added a persistent in-app warning when browser localStorage rejects an autosave, including quota and storage-access failures.
- The warning does not claim data was saved; it offers an explicit retry action and clears only after a confirmed successful write.
- The informational last-saved timestamp is updated only after a successful state write.
- No data is automatically deleted, reset, or moved to cloud storage.
- This improves local-use safety but does not replace cloud persistence or a verified backup strategy.
- Full CI validation is pending for this change.


## Progress log — 19 November 2026 (local persistence regression coverage)

- Added automated tests for successful local saves and explicit failure when browser storage rejects a write.
- Added a recovery test proving malformed stored JSON is copied to a timestamped recovery key before defaults are returned.
- Added a backward-compatibility test proving legacy storage remains readable and its original key is not deleted.
- Registered the tests in the standard CI test command.
- These tests cover local browser persistence behavior only; they do not represent cloud backup or multi-device synchronization.
- CI validation is pending for the latest commits.


## Progress log — 20 November 2026 (legacy reset resurrection fix)

- Fixed an edge case in explicit reset: the app now clears both the current storage key and the legacy compatibility key.
- Previously, a reset could remove the current key while leaving the legacy key behind; the next load could then fall back to that legacy payload and resurrect old data.
- Added a regression test that seeds both keys, performs reset, and verifies that neither key remains.
- This affects only the explicit reset action. Normal legacy loading and migration compatibility remain intact.
- CI validation is pending for the latest changes.


## Progress log — 20 November 2026 (planner and Mariluna workflow hardening)

- Task cards now tolerate legacy records without a subtasks array instead of crashing while rendering.
- Individual task subtasks can be checked off and saved without replacing the parent task or its metadata.
- Task duration input is constrained to a sensible positive range before saving.
- Jarvis subtask generation now handles non-success API responses explicitly and avoids creating duplicate fallback subtask IDs.
- Mariluna's due-task overview now checks the canonical task status instead of a non-existent legacy `completed` flag.
- Mariluna due-task filtering uses the browser's local calendar date instead of UTC date serialization, avoiding day-boundary drift.
- Mariluna offering prices now reject negative and non-finite values, with inline validation and cent precision.
- These changes preserve existing stored records; CI validation is pending for the latest combined commit.

- Follow-up: Jarvis subtask generation no longer inserts generic placeholder tasks when the AI endpoint fails or returns empty content; the editor now shows an actionable error instead.

- Recurring task scheduling now uses a validated local-date helper. Invalid legacy due dates no longer generate malformed future tasks; daily, weekly, month-end, leap-year and year-boundary behavior is covered by automated tests.

## Progress log — 20 November 2026 (Jarvis memory lifecycle guard)

- Memory confirmation now promotes only records that are explicitly marked as learned and pending confirmation.
- Dismissal now removes only pending learned suggestions; stale UI actions cannot delete explicit or already-confirmed memories.
- Archived memories cannot be reactivated by a stale confirmation action.
- Added regression tests for both guarded operations.
- The change preserves existing records and metadata; validation is pending on the combined branch checkpoint.
- The Memory Manager now asks for explicit confirmation before permanently deleting a memory; archive remains the reversible first choice.

## Progress log — 20 November 2026 (calendar month navigation)

- Month navigation now clamps dates to the last valid day in the target month rather than overflowing into the following month (for example, January 31 to February 28/29).
- Day/week/year boundary navigation remains based on local calendar dates.
- Invalid date inputs and non-integer shifts are rejected without manufacturing a new date.
- Added regression tests for month ends, leap years, reverse navigation and year boundaries.
- Full CI validation is pending for the latest combined branch state.


## Progress log — 20 November 2026 (Jarvis memory edit safety)

- Memory edits now ignore blank/whitespace-only content, preventing accidental erasure of a useful saved memory.
- Archived memories are immutable through the ordinary edit path; restore remains an explicit separate action.
- Added regression coverage for blank edits, archived records and normal active-memory edits.
- Existing stored memories are not rewritten by this change.


## Progress log — 20 November 2026 (migration data inventory)

- The local/cloud migration planner now counts Jarvis chat history, content-plan posts and pillars, saved quarter/month themes, and active Jarvis suggestions/briefs.
- This closes a data-loss risk where a workspace containing only these records could previously be misclassified as empty and bypass the explicit migration choice.
- Added regression tests for chat-only and content-planning/Jarvis-only local data.
- The planner remains read-only: no upload, restore, merge or overwrite is performed automatically.


## Progress log — 20 November 2026 (migration inventory hardening)

- Extended migration inventory counts to include content-plan platform metadata and Jarvis accepted/dismissed suggestion IDs, in addition to chat history, content posts/pillars/themes, active suggestions, recent task splits and the latest brief.
- Fixed strict TypeScript types in the new migration regression fixtures so the CI type-check can validate the tests.
- The migration planner remains read-only and still requires explicit user choice whenever local or remote data exists.


## Progress log — 20 November 2026 (local persistence write guard)

- Added a runtime schema guard to `saveState`: incomplete or malformed Alchemy payloads are refused before localStorage is touched.
- The guard requires the core collections, module objects, setup flags, foundation identity object and calendar/Gmail integration records needed by the current app contract.
- Added a regression test proving an incomplete write returns false and leaves the last known-good local payload unchanged.
- This is a local write-safety improvement only; it does not activate cloud sync or change the current storage provider.
