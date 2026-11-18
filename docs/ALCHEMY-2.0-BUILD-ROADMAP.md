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
