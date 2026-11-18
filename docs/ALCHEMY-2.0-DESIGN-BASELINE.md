# Alchemy 2.0 — Design Phase 1

Status: Design baseline — product structure and visual direction updated
Branch: design/phase-1
Confirmed decisions: separate Private and Mariluna domains; two-entry home screen; dark-first visual system; distinct domain themes; keep Gemini for now (target AI spend €0); hybrid storage direction; design before implementation.

## Product direction

Alchemy is one personal operating space with two clearly separated worlds:
- Private: personal life, wellbeing, cycle, nutrition, style, routines, goals and private planning.
- Mariluna: business planning, offers, clients, content, projects, deadlines and administration.
- Home: a calm launch screen with two clear entry points — Private and Mariluna. The user chooses the active world before entering its dashboard.
- Jarvis: available from both worlds, with the active domain providing the working context. Cross-domain memory and sharing rules remain an explicit privacy decision and must not be assumed.

The redesign evolves the existing app; it is not a ground-up replacement. Preserve existing features and user data.

## Confirmed visual direction

### Overall identity
- Dark-first interface. The primary experience is designed for dark mode, not merely a light theme inverted after the fact.
- Avoid pure black as the only background; use layered, warm charcoal/espresso surfaces for comfortable contrast.
- Elegant, atmospheric, botanical and editorial. References include moody libraries, natural textures, forest imagery, herbarium/journal details and refined dashboards.
- Typography: expressive, elegant serif for selected headings paired with a highly legible modern sans-serif for interface text.
- Use imagery selectively and purposefully. Avoid decorative images in every card or a cluttered collage effect.
- Calm spacing, restrained borders, subtle surface depth and consistent iconography. No visual noise or excessive accent-color blocks.

### Domain themes
The two domains share the same design system, layout rules, typography and dark foundation, but each has its own controlled accent palette.

**Mariluna — Botanical Alchemy**
- Primary identity: deep forest green #263D35.
- Supporting accents: muted moss #A9B88A, antique gold/champagne and warm ivory.
- Mood: botanical, mystical, artistic, refined; an alchemical atelier / botanical library rather than a generic corporate dashboard.

**Private — Earthbound**
- Primary identity: dark espresso / warm brown #39312B.
- Supporting accents: warm copper #B49A7A, muted taupe and soft cream.
- Mood: grounded, warm, natural and restorative; wood, earth, moss and candlelight.

Implementation guidance:
- Treat these as semantic theme tokens (background, surface, text, muted text, border, primary accent, secondary accent, focus and status colors), not hard-coded colors scattered through components.
- Accent colors identify the active domain; they do not color every button, card or data visualization.
- Keep status colors (success, warning, error) semantically consistent across both themes.
- Keep a future light theme possible, but dark mode is the default and first design target.
- The Home screen should feel neutral and unified, with the two domain choices clearly distinguished without turning the launch screen into a third competing palette.

## Proposed information architecture

### Home / launch screen
The first screen presents two prominent, unmistakable choices:
1. Mariluna
2. Private

Keep this screen simple and welcoming. Do not force users through a combined dashboard before they choose a context.

### Domain dashboards
Each entry opens its own dashboard, styled with its domain theme. Both dashboards use a shared component system and familiar information hierarchy.

**Mariluna dashboard**
- Today's business agenda and appointments.
- A small number of current priorities and next actions.
- Active projects, deadlines and relevant progress.
- Client follow-ups and business administration that need attention.
- A concise Jarvis business insight or prompt only when genuinely useful.

**Private dashboard**
- Today's personal agenda and commitments.
- A small number of personal priorities and tasks.
- Wellbeing, routines and habit information in a calm, optional presentation.
- Relevant home/life reminders and personal goals.
- A concise Jarvis personal insight only when genuinely useful.

Dashboards should be configurable over time. Avoid fake scores, forced daily check-ins, noisy feeds and repetitive AI suggestions.

### Shared tools and navigation
- Planner: one underlying planning system with clear domain filters and an optional combined view. Shared items must be explicitly marked.
- Quick Capture: accessible from either domain for task, idea, note, appointment or reminder; capture inherits the active domain but allows the user to change it.
- Ideas / Brain Dump: capture first, categorize later; every item has a clear domain association or an explicit shared status.
- Jarvis: reachable from both domains and aware of the current context. Cross-domain access must obey the privacy rules still to be decided.

Navigation should be contextual: show the modules relevant to the active domain instead of presenting every feature in one crowded global menu. Preserve access to all existing modules during redesign.

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

## Experience principles
- Calm first: one clear primary action per screen; reveal detail progressively.
- Mobile first: readable layouts and comfortable one-handed use.
- Dutch first, with English retained as an option.
- Keep Private and Mariluna visibly distinct; explicitly mark shared items.
- Make task, idea, note and event capture quick.
- Let users independently control reminders, AI suggestions, integrations and sensitive modules.
- Clearly distinguish connected, read-only, syncing, failed and locally saved states.
- Prefer useful information over gamification or decorative metrics.
- Respect reduced visual stimulation and dark-mode comfort.

## AI direction — Gemini, €0 target
Keep the current Gemini integration; do not migrate to OpenAI or enable paid AI automatically.
- Core app functions must work when Gemini is unavailable.
- Distinguish actual Gemini responses from deterministic/offline fallbacks.
- Send only the minimum context needed.
- The active domain determines the default context for Jarvis.
- Do not assume Private and Mariluna memories can freely access each other. The cross-domain memory policy remains open and requires an explicit user decision.
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
Refine Home, the two domain dashboards, contextual navigation, capture, planning and search while preserving features.
### Phase 4 — Verification
Build and type-check; test offline use, persistence, authentication, integration failures and mobile layouts; review migration and recovery. Release through a pull request, not directly to main.

## Open design decisions
- Whether the Planner is one filtered workspace or separate Calendar and Tasks screens.
- Which sensitive data is cloud-synced by default versus local-only.
- The exact cross-domain Jarvis memory and permission model.
- Which modules belong in the first redesigned screen set.
- Whether and when to add an optional light theme.

## Files reviewed
Initial review included package.json, src/App.tsx, src/lib/storage.ts, src/lib/aiService.ts, src/components/Navigation.tsx, src/components/views/TodayView.tsx and .env.example.

This is a design baseline only. It does not claim that the proposed navigation, visual themes, storage architecture or integration improvements are already implemented or tested.
