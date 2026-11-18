# Alchemy 2.0 — Build Roadmap to Version 1.0

Status: Active delivery plan — user-approved direction
Branch: design/phase-1

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
