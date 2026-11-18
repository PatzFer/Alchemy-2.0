# Alchemy 2.0 — Visual Experience & Interaction Design

Status: Phase 3 design proposal — ready for user review
Branch: design/phase-1

## 1. Design intent

Alchemy should feel like a composed personal atelier: atmospheric, intelligent, warm and precise. It should not resemble a generic productivity SaaS dashboard, a game, or a decorative spiritual mood board.

The visual language is dark-first, editorial and botanical/earthbound. Use the existing Cormorant Garamond + Plus Jakarta Sans pairing as the starting point:
- Cormorant Garamond for selected page titles and editorial moments.
- Plus Jakarta Sans for navigation, controls, labels, data and long-form reading.

The current application uses a light warm palette and many hard-coded cream/beige colors. Phase 3 therefore defines a semantic token system before any visual implementation. Do not simply invert the current colors.

## 2. Global visual system

### Shared foundation
- Deep warm charcoal / brown-black background rather than pure black.
- Raised surfaces with subtle tonal separation, not heavy shadows or glass effects everywhere.
- Warm off-white primary text; muted stone secondary text.
- Restrained borders and clear focus states.
- Comfortable spacing, strong typography hierarchy and calm information density.
- Status colors remain consistent across both domains and must not be confused with domain accent colors.

### Domain identities
**Mariluna — Botanical Alchemy**
- Deep forest green: #263D35
- Moss: #A9B88A
- Antique gold / champagne for restrained highlights
- Warm ivory for readable contrast
- Visual character: botanical atelier, alchemical library, crafted and quietly mystical.

**Privé — Earthbound**
- Espresso: #39312B
- Copper: #B49A7A
- Muted taupe and soft cream
- Visual character: grounded, intimate, tactile and restorative.

The two domains share typography, component geometry, accessibility rules and neutral surfaces. The accent changes the active identity through navigation indicators, selected controls, small highlights and occasional illustration—not by filling every card.

### Neutral Home
Home uses the shared warm-charcoal foundation with balanced Mariluna and Privé identity cues. Neither domain should dominate before the user chooses.

## 3. Home / domain launcher

### Purpose
A calm choice point, not a third dashboard. The user should understand immediately that Alchemy contains two distinct spaces.

### Layout
1. Small Alchemy wordmark / monogram and concise greeting.
2. Two large domain cards, Mariluna and Privé, with equal visual weight.
3. Each card has a distinct accent, a short descriptive line and a clear enter affordance.
4. A discreet Quick Capture action.
5. Global utilities (notifications, settings/security) in a restrained top or overflow area.
6. Jarvis remains accessible, but Home must not imply it has access to both domains simultaneously.

### Interaction
- Selecting Mariluna opens Mariluna > Overzicht and sets the Mariluna context.
- Selecting Privé opens Privé > Overzicht and sets the Private context.
- Home is always reachable from either domain.
- Do not show combined personal/business tasks or health details on Home.
- Avoid a crowded feed, KPI tiles, streaks, daily scores or forced check-ins.

## 4. Domain shell and internal navigation

The user's approved choice is **internal navigation inside each domain**.

### Desktop
- A compact domain-specific navigation rail/sidebar.
- Brand/domain identity and Home switcher at the top.
- Current domain modules grouped in a stable order.
- Global utilities (Jarvis, Quick Capture, notifications, settings) visually separated from domain modules.
- Main content area has a consistent page title, optional context line and one clear primary action.

### Mobile
- Keep the active domain identity visible.
- Use a compact bottom navigation for the most-used destinations plus a clearly discoverable More menu for the remaining modules, or a compact collapsible internal menu if usability testing favors it.
- Quick Capture and Jarvis remain reachable with one tap, without taking over the whole bottom bar.
- Avoid horizontally overflowing eight-item menus as the only navigation mechanism.
- Preserve a clear Home/domain switch action.

The exact mobile pattern remains a prototype decision to validate; do not hard-code an assumption before trying the layout on narrow screens.

## 5. Mariluna dashboard

### Information hierarchy
1. **Welkom / vandaag** — date and a subtle Mariluna identity.
2. **Agenda vandaag** — next business appointments and relevant deadlines.
3. **Focus** — up to three current priorities / next actions.
4. **In beweging** — active projects and content that needs attention.
5. **Opvolgen** — client follow-ups or business administration only when there is a real item requiring action.
6. **Jarvis insight** — optional and only shown when there is a useful, grounded observation.

### Display rules
- Empty states should invite the next useful action, not show fake sample data.
- Metrics are shown only when actual user-entered or verified connected data exists.
- Avoid duplicating the full Content, Projects or Clients modules on the dashboard.
- Dashboard sections should be modular and later configurable, but initial release should use a sensible fixed order.
- A business task without a due date should not be presented as overdue.

## 6. Privé dashboard

### Information hierarchy
1. **Welkom / vandaag** — date and calm Private identity.
2. **Agenda vandaag** — personal events and commitments.
3. **Mijn focus** — up to three personal priorities.
4. **Routines** — optional small, practical reminders.
5. **Doelen / leven** — one or two relevant goals or home/life items.
6. **Welzijn** — optional, user-controlled summary widget.
7. **Jarvis reflection** — optional and never repetitive.

### Sensitive data display
- Cycle details, medical/health notes, body measurements and intimate wellbeing records are hidden from the dashboard by default.
- The user may opt in to a discreet widget; its detail level must be configurable.
- No compulsory morning/evening check-in. Existing check-in functionality can remain available as an optional tool or reminder.
- Dashboard must not show sensitive data in notification previews by default.

## 7. Shared planner experience

The user approved one underlying planner, with an optional combined agenda.

### Planner structure
- A single Agenda & Taken destination inside each domain.
- Two primary views: Agenda and Taken.
- Agenda supports day, week and month navigation; mobile defaults to a useful agenda/list presentation.
- Taken supports a clear list/board-style presentation, filters and sorting.
- Domain filter defaults to the active domain.
- Optional Gecombineerd view overlays Mariluna, Privé and explicitly shared events. It is an opt-in view, not a default.
- Use clear domain labels/colors for events and tasks; never rely on color alone.

### Data integrity
- The combined view reads the same event records; it does not create copies.
- A shared item is explicitly shared by the user.
- Editing an item updates the one underlying record.
- Avoid accidental cross-domain leakage in titles, previews, search results and Jarvis context.

## 8. Quick Capture

### Entry points
- A consistent global action in both domains.
- Accessible from Home.
- Keyboard shortcut may be considered for desktop later.

### Capture flow
1. Choose type: Task, Idea, Note, Appointment or Reminder.
2. Enter the content with as few required fields as possible.
3. Destination defaults to the active domain.
4. Destination can be deliberately changed to the other domain or Shared.
5. Save and return immediately to the previous screen.

Do not force category, project, due date or tags at capture time. Offer optional details progressively. Preserve original text when later converted by Jarvis into a task, project or content record.

## 9. Jarvis experience

### Placement
- A consistent assistant button in both domains.
- Opens the same drawer/panel, adapted to available screen width.
- Active domain label remains visible in the conversation.
- Context indicator states Mariluna, Privé or Shared.
- Home opens Jarvis in a neutral state with no implicit combined context; the user must choose a domain before domain data is included.

### Conversation experience
- Clear conversation history and a simple message composer.
- Useful suggested prompts may be shown contextually, but should not be generic or repetitive.
- Responses distinguish live Gemini output from local/offline fallback.
- Any proposed action is previewed before writing to the app; destructive actions always require explicit confirmation.
- Jarvis must not imply it has performed an action until the app confirms success.

### Privacy UX
- Explain when another domain's context would help.
- Ask permission before cross-domain retrieval unless a specific permission has already been granted.
- Sensitive private data remains excluded by default.

## 10. Component and interaction principles

- One prominent primary action per screen; secondary actions are visually quieter.
- Cards are for meaningful grouped information, not every data point.
- Use progressive disclosure for advanced fields and settings.
- Empty states explain what belongs there and provide one useful action.
- Loading, offline, local-save, syncing and failure states must be distinct.
- Use motion sparingly: short transitions for domain entry, drawers and navigation; respect reduced-motion settings.
- All controls require keyboard focus, accessible labels and sufficient contrast.
- On mobile, respect safe areas and avoid bottom actions hidden behind system navigation.

## 11. Semantic design token proposal

Create tokens before changing component colors. Proposed token families:

- --app-bg, --surface-1, --surface-2, --surface-raised
- --text-primary, --text-secondary, --text-muted
- --border-subtle, --border-strong, --focus-ring
- --accent-primary, --accent-secondary, --accent-soft
- --status-success, --status-warning, --status-danger, --status-info
- --font-serif, --font-sans
- Spacing, radius, elevation and motion tokens shared across domains

Map semantic tokens to domain themes at the application shell level. Avoid hard-coded domain colors inside individual feature components.

## 12. Existing code observations relevant to redesign

Source review of the current branch found:
- src/index.css currently establishes a light warm background and the existing Cormorant Garamond / Plus Jakarta Sans font pairing.
- TodayView is a large, feature-rich daily experience that currently combines several personal and business concepts; useful daily-brief logic should be preserved but its presentation should be split by domain.
- PriveDomainView already has an internal sub-navigation and useful Private modules, but its current styling is light.
- AIAssistantDrawer already builds a context payload containing tasks, events, projects, ideas, goals, offerings and selected wellbeing data. The new Jarvis UX must be paired with the approved server-side privacy/context filtering; a visual domain label alone is not a security boundary.
- App.tsx currently starts on today with active world all; the intended Home launcher and explicit domain entry flow require a later shell/navigation change.
- The current app can trigger a morning check-in modal. The redesign must not make a daily check-in compulsory.

These are source-level observations, not runtime or security test results.

## 13. Phase 3 review checkpoints

The user should review:
1. The overall visual direction and domain identities.
2. The Home layout and two domain entry cards.
3. The Mariluna and Privé dashboard content hierarchy.
4. Desktop and mobile internal navigation approach.
5. Quick Capture and Jarvis placement and behavior.

No production UI implementation is included in this document. Once approved, the next phase can translate the design into a component-level implementation plan and then implement it on the existing feature base.
