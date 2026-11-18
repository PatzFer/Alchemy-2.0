# Alchemy 2.0 — Information Architecture

Status: Phase 2 — approved structure and navigation decisions
Branch: design/phase-1

## Confirmed user decisions

- **Planner:** one underlying planner for both domains.
- **Combined agenda:** available as an optional view, never the default.
- **Navigation:** each domain has its own internal navigation ("inside" the domain), rather than one global module menu or a permanently visible global sidebar.

## 1. Product model

Alchemy is one personal operating environment with two distinct domains:
- **Mariluna** — the business studio.
- **Privé** — personal life and wellbeing.

The user enters through a neutral Home screen and deliberately chooses a domain. The selected domain becomes the active navigation and Jarvis context. The app must not open into a blended dashboard by default.

## 2. Global application shell

### Home / domain launcher
The launch screen contains:
- Alchemy identity and a concise welcome.
- Two equally prominent domain cards: Mariluna and Privé.
- A small, consistent Quick Capture action.
- Access to global settings, notifications and security where appropriate.

The launch screen is neutral: it does not use either domain's accent as its dominant theme. It does not show a third combined dashboard.

### Persistent global utilities
Available from either domain without becoming competing primary destinations:
- **Jarvis** — one assistant entry point; active domain and permission scope are always visible.
- **Quick Capture** — task, idea, note, appointment or reminder. It inherits the active domain, with an explicit option to mark an item as shared or change its destination.
- **Notifications** — relevant reminders and system messages.
- **Settings & Security** — account, appearance, language, privacy, permissions, integrations and lock/security controls.
- **Home switcher** — return to the neutral launcher and change domains.

These are utilities, not extra primary domains. On mobile, Quick Capture and Jarvis should be easy to reach without taking permanent space away from domain navigation.

## 3. Mariluna domain

Theme: Botanical Alchemy — forest green, moss, antique gold/champagne and warm ivory accents on the shared dark foundation.

### Dashboard
A focused business overview, not a second copy of every module:
1. Today's business appointments and deadlines.
2. A short list of current priorities and next actions.
3. Active projects and content needing attention.
4. Relevant client follow-ups.
5. Business administration reminders when due.
6. Optional Jarvis insight, only when it adds useful context.

No fabricated revenue, growth or performance metrics. Metrics appear only when the user has entered or connected the underlying data.

### Internal navigation
The Mariluna domain opens on **Overzicht**. Its own internal menu provides:
1. **Overzicht** — Mariluna dashboard.
2. **Content** — content calendar, drafts, pillars and publishing preparation.
3. **Projecten** — projects, milestones and project-linked tasks.
4. **Strategie** — business goals, planning and strategic notes.
5. **Aanbod** — products, services, pricing and offer details.
6. **Klanten** — client records and follow-ups.
7. **Cijfers** — business metrics and records, with clear source and date context.
8. **Brainstorm** — business ideas, brain dumps and Jarvis sparring.

The menu is contextual to Mariluna. It does not display Private modules. A clear Home/domain-switch action remains available. Business administration can be surfaced as tasks/reminders on the dashboard and in the shared planner; do not create a duplicate administration system unless a real workflow requires it.

## 4. Privé domain

Theme: Earthbound — espresso, copper, muted taupe and soft cream accents on the shared dark foundation.

### Dashboard
A calm personal overview:
1. Today's personal appointments and commitments.
2. A small number of personal priorities.
3. Optional routines and reminders.
4. A discreet wellbeing summary when the user chooses to show it.
5. Personal goals and home/life items needing attention.
6. Optional Jarvis reflection, only when useful.

Sensitive cycle and health details must not be exposed on the dashboard by default. The user chooses which private widgets are visible. No forced mood check-in or daily wellbeing questionnaire.

### Internal navigation
The Privé domain opens on **Overzicht**. Its own internal menu provides:
1. **Overzicht** — personal dashboard.
2. **Agenda & Taken** — personal commitments and tasks, with optional combined agenda access.
3. **Cyclus** — cycle tracking; protected sensitive information.
4. **Welzijn** — wellbeing and health records; protected sensitive information.
5. **Voeding** — nutrition, meals and menu planning.
6. **Personal Styling** — style profile, measurements and wardrobe guidance.
7. **Doelen** — personal goals and progress.
8. **Routines & Leven** — routines, commitments and My Life planning.

The menu is contextual to Privé. It does not display Mariluna modules. The user may hide or reorder selected dashboard widgets later. The core modules remain accessible without crowding the overview.

## 5. Shared planning model

There is one underlying planner rather than separate duplicate calendar and task engines.

### Planner views
- **Agenda** is the calendar view of events and commitments.
- **Taken** is the task view with status, priority, due date and domain.
- **Gecombineerd** is an optional agenda view that overlays Mariluna, Privé and explicitly shared events. It is never the default.
- The combined view is a filter/view over the same records, not a third calendar or a second copy of events.

### Domain and filters
- Both Agenda and Taken support filters: Privé, Mariluna and Gedeeld.
- Entering the planner from Mariluna preselects Mariluna.
- Entering the planner from Privé preselects Privé.
- The user can deliberately switch to another domain or the combined view.
- Every item has an explicit owner/domain: personal, mariluna or shared.
- Shared means intentionally visible in both domains; it is not a synonym for unknown or unclassified.
- Projects and goals remain domain-owned and may link to tasks and events.

### Where the planner appears
- The internal navigation in each domain contains **Agenda & Taken** as one destination.
- Inside it, the user switches between Agenda and Taken, with the optional combined agenda view available as a filter.
- A global shortcut may open Quick Capture, but there is no competing third planner entry in the global navigation.

## 6. Quick Capture and Ideas

Quick Capture is a single global action with a short capture flow:
- Task
- Idea
- Note / brain dump
- Appointment
- Reminder

Default destination is the active domain. The user can change it before saving. A shared destination must be chosen explicitly.

Ideas are captured with minimal friction. Classification, linking to a project/task/content item and Jarvis refinement can happen later. Preserve original text when Jarvis transforms an idea into another record.

## 7. Jarvis placement and behavior

- Jarvis is accessible in both domains through the same assistant interface.
- The interface visibly labels the active context: Mariluna, Privé or explicitly Shared.
- Jarvis uses the approved layered memory model in docs/ALCHEMY-2.0-JARVIS-MEMORY-AND-PRIVACY.md.
- Jarvis does not silently blend domain data.
- Actions that create or change app records follow confirmation and permission rules.
- Local fallback responses are clearly distinguished from live Gemini responses.

## 8. Navigation behavior

- The neutral Home screen is the domain launcher.
- Entering Mariluna opens its overview and activates the Mariluna theme/context and internal menu.
- Entering Privé opens its overview and activates the Private theme/context and internal menu.
- The user navigates between modules using the active domain's internal menu; modules from the other domain are not mixed into it.
- Returning Home clears the active domain context; it does not silently open a combined workspace.
- Opening a module from a notification or deep link must establish the correct domain before rendering its data.
- Back navigation returns to the previous module or domain overview as appropriate.
- Settings, security, notifications, Jarvis and Quick Capture remain global utilities and do not become extra domain modules.

## 9. Existing-module preservation map

| Existing capability | Destination in Alchemy 2.0 |
|---|---|
| Today | Split into the two domain dashboards; retain useful daily-brief logic |
| Tasks | Shared planner, filtered by domain |
| Calendar | Shared planner, filtered by domain |
| Goals | Mariluna Strategie or Privé Doelen according to domain |
| Ideas | Mariluna Brainstorm or Quick Capture; shared classification where explicitly selected |
| Mariluna Hub | Mariluna dashboard and internal navigation |
| Content planning | Mariluna Content |
| Projects | Mariluna Projecten |
| Metrics | Mariluna Cijfers |
| Offerings | Mariluna Aanbod |
| Clients | Mariluna Klanten |
| Cycle | Privé Cyclus |
| Wellbeing | Privé Welzijn |
| Nutrition / meal planning | Privé Voeding |
| Personal styling | Privé Personal Styling |
| My Life / routines | Privé Routines & Leven |
| Integrations | Global Settings; provider state visible where relevant |
| Security / privacy | Global Settings & Security |
| Jarvis / Alchemy Brain | Global assistant, scoped to active domain |
| Onboarding / Foundation | First-run setup and editable profile settings |
| Notifications | Global utility, filtered by domain where relevant |

This is a placement map, not permission to remove existing capabilities. Preserve current user data and feature behavior during migration.

## 10. Responsive behavior

- Mobile first: domain entry cards stack vertically; each domain's internal navigation uses a compact bottom navigation, drawer or horizontally scrollable menu as appropriate to screen size.
- Desktop: each domain can use its own compact sidebar or top-level internal rail; the active domain must remain obvious.
- Do not duplicate the entire desktop menu on mobile.
- Keep key actions reachable with one hand.
- Respect reduced motion and accessible contrast.

## 11. Out of scope for this phase

This phase defines the product structure and navigation. It does not implement UI, change application code, alter storage, migrate user data, connect providers or change AI behavior. Those require separate design and verification phases.

## 12. Phase 2 completion criteria

Phase 2 is complete when the following are accepted:
- Neutral two-choice Home / domain launcher.
- Mariluna and Privé have separate internal navigation and contextual dashboards.
- One shared planner supports domain filters and an optional combined agenda view.
- Quick Capture inherits the active domain and supports explicit shared classification.
- Jarvis is globally reachable but always scoped to the active domain and approved memory permissions.
- Existing modules and user data have an explicit preservation destination.

The user has approved the planner model, optional combined agenda and internal domain navigation. The module grouping and dashboard contents in this document remain the proposed information architecture for implementation planning; visual details and exact mobile/desktop menu behavior can be refined during experience design.

No code implementation should begin until the next phase's scope and visual interaction details are agreed.
