# Alchemy 2.0 — Design Phase 1

Status: Initial design baseline
Branch: design/phase-1
Confirmed decisions: separate Private and Mariluna domains; keep Gemini for now (target AI spend €0); hybrid storage direction; design before implementation.

## Product direction
Alchemy is one personal operating space with two clearly separated worlds:
- Private: personal life, wellbeing, cycle, nutrition, style, routines, goals and private planning.
- Mariluna: business planning, offers, clients, content, projects, deadlines and administration.
- Today: a calm overview of what matters today, without unnecessarily blending private and business details.

The redesign evolves the existing app; it is not a ground-up replacement. Preserve existing features and user data.

## Existing capabilities observed
- Today: daily brief, check-in, intentions, tasks, capacity, weather and suggestions.
- Planning: tasks, calendar, goals, projects and ideas.
- Private: cycle, wellbeing, nutrition, personal style and My Life.
- Mariluna: business hub, content planning, offerings, clients and metrics.
- Assistant: Gemini-backed server endpoints and assistant interface.
- Foundations: onboarding and profile preferences.
- Integrations: Google Calendar and other integration settings.
- Security: security centre and passkey/TOTP-related code.
- Delivery: React, TypeScript, Vite, Express and PWA.

## Proposed information architecture
Primary navigation:
1. Today — daily overview and next actions.
2. Private — personal domain.
3. Mariluna — business domain.
4. Planner — calendar, tasks and goals.
5. Ideas — capture and develop ideas.

Secondary tools: Wellbeing, Cycle, Nutrition, Personal Style, My Life, Business Content, Clients & Offers, Integrations, Settings and Security.

This is a proposal, not an implemented navigation change. Existing feature depth and access must be preserved.

## Experience principles
- Calm first: one clear primary action per screen; reveal detail progressively.
- Mobile first: readable layouts and comfortable one-handed use.
- Dutch first, with English retained as an option.
- Keep Private and Mariluna visibly distinct; explicitly mark shared items.
- Make task, idea, note and event capture quick.
- Let users independently control reminders, AI suggestions, integrations and sensitive modules.
- Clearly distinguish connected, read-only, syncing, failed and locally saved states.

## Today screen proposal
1. Date and editable daily intention.
2. Compact status: appointments, available capacity and important commitments.
3. Short prioritized task list, separated by Private / Mariluna when useful.
4. One or two relevant suggestions, not an endless feed.
5. Optional, skippable wellbeing check-in.
6. Quick capture for task, idea, note and event.

Weather, celestial notes, nutrition and other context should be optional or collapsed unless useful that day.

## AI direction — Gemini, €0 target
Keep the current Gemini integration; do not migrate to OpenAI or enable paid AI automatically.
- Core app functions must work when Gemini is unavailable.
- Distinguish actual Gemini responses from deterministic/offline fallbacks.
- Send only the minimum context needed.
- Keep Private and Mariluna contexts separate unless the user asks to combine them.
- Keep API keys server-side.
- Revisit only if free Gemini access or its terms/limits change.

## Storage and privacy — hybrid direction
- Local/offline layer for responsive access and offline use.
- Authenticated cloud persistence and synchronization for backup and multi-device use.
- Sensitive cycle, wellbeing, nutrition and private notes need explicit access boundaries and export/delete paths.
- OAuth tokens and secrets must not live in ordinary browser localStorage.
- The current app uses browser localStorage for app state. Plan migration deliberately; do not introduce sync until identity, conflict handling, recovery and data ownership are specified.

## Reliability items to resolve
1. Storage resilience: browser-local state alone is not backup or multi-device sync.
2. Security persistence: verify session/security state survives server restarts and is stored safely.
3. Integration truthfulness: a connection indicator must reflect real authorization and API success; a local save is not a cloud sync.
4. Calendar sync: define ownership, pagination, duplicate prevention, update/delete and conflict handling before claiming full two-way sync.
5. AI fallbacks: clearly label real AI output versus deterministic fallback.
6. Date handling: respect local timezone and avoid UTC date shifts.

## Delivery sequence
### Phase 1 — Design
Confirm product structure, navigation, screen hierarchy, visual principles, feature mapping, privacy and integration requirements.
### Phase 2 — Foundation
Define domain boundaries, hybrid persistence, authentication, recovery, integration contracts and migration safeguards.
### Phase 3 — Experience refinement
Refine Today, navigation, Private/Mariluna separation, capture, planning and search while preserving features.
### Phase 4 — Verification
Build and type-check; test offline use, persistence, authentication, integration failures and mobile layouts; review migration and recovery. Release through a pull request, not directly to main.

## Open design decisions
- Planner as one filtered workspace or separate Calendar and Tasks screens.
- Whether Today defaults to both domains or a selected domain.
- Which sensitive data is cloud-synced by default versus local-only.
- Which modules belong in the first redesigned screen set.

## Files reviewed
Initial review included package.json, src/App.tsx, src/lib/storage.ts, src/lib/aiService.ts, src/components/Navigation.tsx, src/components/views/TodayView.tsx and .env.example.

This is a design baseline only. It does not claim that the proposed navigation, storage architecture or integration improvements are already implemented or tested.