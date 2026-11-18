# Alchemy 2.0 — Current-State Audit

Status: Read-only architecture and product audit
Branch: design/phase-1
Scope: Repository structure and selected application, navigation, storage, AI and integration files. No application code changed in this audit.

## Executive summary

Alchemy already contains substantial product functionality. The strongest direction is to evolve the existing application rather than replace it. The main design gap is that the current shell still presents a combined, light-themed workspace, while the agreed target is a dark-first home screen that asks the user to enter either Mariluna or Private.

The main engineering risks are not visual. They concern persistence, security state, integration truthfulness and the boundary between browser-only features and the Express server. These should be addressed before a major UI migration or a move to another development environment.

## Current application structure

The repository contains 102 tracked files at the audited branch head. Main areas include:
- App shell and navigation: `src/App.tsx`, `src/components/Navigation.tsx`.
- Shared planning: Today, Tasks, Calendar, Goals and Ideas views.
- Private domain: `PriveDomainView`, Cycle, Wellbeing, My Life, nutrition/meal planning and personal styling.
- Mariluna domain: `MarilunaHubView`, content, projects, strategy, metrics, ideas, offerings and clients.
- Jarvis / Alchemy Brain: assistant drawer, brain context, relevance, memory, brief and capacity services.
- Platform foundations: onboarding, settings, security, integrations, PWA and offline indicator.
- Server: Express entry point plus security, integrations and brain routes.

## What is already aligned with the target

1. Private and Mariluna are already represented as separate domains in the product model and views.
2. Tasks, calendar events, projects, goals and ideas carry domain/realm information, allowing filtered workspaces.
3. The Private and Mariluna domain views already have their own internal sub-navigation.
4. Jarvis already receives an active-world value, and the Brain layer includes context and relevance/privacy-scope concepts.
5. The AI layer already has an adapter-style service boundary and deterministic fallbacks.
6. The UI already uses an editorial serif paired with a sans-serif font, which is compatible with the chosen visual identity.
7. The application is a PWA and already includes offline-related UI.

## Gaps between current state and agreed experience

### 1. Entry flow and navigation
Observed:
- `App.tsx` initializes the selected tab as `today` and active world as `all`.
- `Navigation.tsx` exposes Today, Mariluna, Private and Ideas as primary experiences, plus direct secondary links.
- The current shell is a global workspace, not a two-choice launch screen.

Direction:
- Add a neutral Home / launch screen with two prominent entry points: Mariluna and Private.
- Entering a domain should set an explicit active domain context and open that domain's dashboard.
- Keep shared tools accessible without making them compete with the two main choices.
- Preserve existing direct access and deep-link behavior during migration.

### 2. Visual foundation
Observed:
- `src/index.css` currently defines a light warm background and dark text.
- Navigation contains hard-coded light cream and beige colors.
- The existing serif/sans typography pairing is a useful starting point.

Direction:
- Introduce semantic CSS theme tokens rather than replacing individual color literals piecemeal.
- Implement dark-first shared surfaces with domain accent themes:
  - Mariluna: forest green #263D35, moss #A9B88A, antique gold/champagne, warm ivory.
  - Private: espresso #39312B, copper #B49A7A, muted taupe, soft cream.
- Keep the home screen neutral and unified.
- Use accent color as a restrained identity cue, not as a fill color for every component.
- Retain a path to an optional light theme later.

### 3. Persistence and data ownership
Observed:
- `src/lib/storage.ts` defines the complete app state and browser localStorage keys `pm_alchemy_os_data_v1` and legacy `mariluna_os_data_v1`.
- `App.tsx` saves the application state to localStorage when state changes.
- The app state contains both personal and business data, including cycle, wellbeing, nutrition, personal style, client and business information.

Risk:
- Browser-local persistence is useful for offline responsiveness but is not a backup or multi-device synchronization strategy.
- Domain separation in the UI does not by itself provide data isolation at rest or at the API boundary.

Direction:
- Preserve the existing local data and define a deliberate, versioned migration before changing the storage model.
- Specify authentication, encryption, data ownership, conflict resolution, export and deletion before enabling cloud sync.
- Define separate data access scopes for Private and Mariluna, plus an explicit shared category.
- Treat sensitive personal records as a higher privacy tier.

### 4. Security state
Observed:
- `server/security.ts` describes its security vault as in-memory and stores passkeys, TOTP settings, sessions, challenges, rate-limit records and permissions in Maps/variables.
- The security permission model includes explicit AI permissions for cycle, personal, Mariluna, financial and wellbeing data.

Risk:
- In-memory security state is lost when the server process restarts and is not a durable credential/session store.
- The presence of security screens and passkey/TOTP code should not be interpreted as proof of production-grade persistence or recovery.

Direction:
- Before production use, move credential and session state to a durable, protected store.
- Review cookie/session settings, rate limits, recovery flows, secret management and authorization on every sensitive endpoint.
- Add tests for server restart, expired sessions, recovery and denied cross-domain access.

### 5. Integrations
Observed:
- `server/integrationsRoutes.ts` maintains integration configuration in an in-memory server object and exposes a status endpoint.
- The route code includes state-changing connect handlers; a status value alone does not prove a durable provider connection.
- Google OAuth access tokens are cached in browser module memory in `src/lib/googleAuthService.ts`.
- Calendar UI creates local Alchemy events and filters by domain.

Risk:
- In-memory integration state can reset on server restart.
- Browser-memory OAuth tokens are transient and should not be treated as durable secure token storage.
- UI labels must distinguish a real provider authorization and successful API operation from a local/demo state.

Direction:
- Model each integration lifecycle explicitly: unavailable, disconnected, authorization required, connected, syncing, read-only, error and last successful sync.
- Keep provider secrets and refresh tokens server-side in a secure persistent store.
- Specify calendar sync ownership, pagination, duplicate prevention, update/delete semantics and conflict handling before advertising two-way sync.

### 6. Jarvis and AI provider boundary
Observed:
- `src/lib/aiService.ts` calls server endpoints and returns local fallback text on errors.
- `src/lib/brain/aiProvider.ts` calls Brain endpoints and falls back to deterministic local logic.
- `AIAssistantDrawer` constructs a context payload containing tasks, events, projects, ideas and other app context.
- Security permissions already express data-specific AI consent flags.

Direction:
- Keep Gemini as the current provider and preserve the target of €0 additional AI spend.
- Centralize context filtering so the UI cannot accidentally send data outside the permitted scope.
- Show a clear distinction between a real model response and a local fallback.
- Require user confirmation before any write or destructive action.
- Do not implement cross-domain memory access until the user has explicitly chosen the memory model.

## Recommended implementation order

1. **Baseline and protection:** preserve existing data; add/verify build and type-check workflow; establish a safe branch and rollback point.
2. **Design tokens:** introduce semantic theme variables and dark-first foundation without changing domain behavior.
3. **Home and domain entry:** add the two-choice launch screen and explicit active-domain transitions.
4. **Domain dashboard refinement:** make Mariluna and Private overview screens focused, with contextual navigation.
5. **Shared planning and capture:** make domain filtering and shared-item labeling consistent across tasks, events, goals and ideas.
6. **Jarvis context controls:** centralize domain and sensitivity filtering; keep cross-domain memory unresolved until user approval.
7. **Persistence and integration hardening:** design and test durable storage, authorization and truthful sync states before production claims.

## AI Studio / portability note

The repository is a full-stack project, not only a static React front end:
- Vite + React + TypeScript client.
- Express/Node server.
- Gemini SDK and server-side API endpoints.
- Firebase configuration and browser OAuth flows.
- PWA and service-worker-related behavior.

A later Google AI Studio Build import should therefore be treated as a portability and runtime-compatibility check, not merely a visual copy/paste. Keep GitHub as the canonical source and verify server routes, environment variables/secrets, Firebase configuration, OAuth authorized origins, PWA behavior and persistent storage in the target runtime before switching development workflows. Do not remove or rewrite the Express backend simply to make an import appear successful.

## Audit limitations

This is a source-level review of selected files and repository structure. No build, lint, automated test, live OAuth flow, provider API call, security penetration test or migration test was run. Findings describe code observed in the audited branch, not a guarantee of deployed behavior.
