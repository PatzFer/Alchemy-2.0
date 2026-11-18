# Alchemy 2.0 — Jarvis Memory & Privacy Model

Status: Proposed design decision — approved by user
Branch: design/phase-1

## Decision

Jarvis uses one coordinated intelligence layer with separated memory domains and explicit access controls. It is neither one unrestricted shared memory nor two completely disconnected assistants.

## Memory layers

### 1. General memory
Contains only cross-domain information that is useful in both contexts and is not sensitive by default, such as:
- Communication preferences.
- General values and working preferences.
- Preferred language and interaction style.
- Broad planning preferences.

### 2. Mariluna memory
Contains business-specific context:
- Brand identity, positioning and strategy.
- Services, products, offers and pricing.
- Clients, leads and business relationships.
- Content, campaigns, projects and business metrics.
- Business processes and administration.

### 3. Private memory
Contains personal-life context:
- Personal routines and commitments.
- Home and life planning.
- Personal interests and preferences.
- Personal goals and non-sensitive wellbeing context.

### 4. Sensitive private vault
Contains higher-sensitivity personal information, including:
- Cycle and reproductive-health information.
- Health and medical information.
- Detailed wellbeing records.
- Body measurements and other intimate personal records where applicable.

This layer is denied to Jarvis by default unless the user explicitly enables a specific permitted use.

## Access and retrieval rules

1. The active domain sets Jarvis's default context.
2. Mariluna context must not be included in a Private request unless the user explicitly authorizes that specific cross-domain use.
3. Private context must not be included in a Mariluna request unless the user explicitly authorizes that specific cross-domain use.
4. Sensitive private data is separately permissioned and excluded by default, even from general Private requests where it is not needed.
5. General memory may be available in both domains, but only for information deliberately classified as general.
6. Cross-domain access is purpose-limited, transparent and revocable. Ask before using the other domain when permission is not already explicit.
7. A user's explicit instruction in the current conversation takes precedence over inferred relevance.
8. Memory classification must not be inferred solely from the wording of a prompt when doing so could expose sensitive or cross-domain data.

## Jarvis actions

- Reading context and proposing advice is distinct from taking an action.
- Creating or changing tasks, calendar events, client records, content or other app data requires confirmation according to the app's permission settings.
- Destructive actions always require explicit confirmation.
- Jarvis must identify when it is using a local deterministic fallback rather than a live Gemini response.
- The user can inspect, correct, export and delete stored memories and revoke permissions.

## Privacy and technical requirements

- Enforce access control server-side, not only by hiding UI elements.
- Build a central context assembler that receives the active domain, requested purpose and granted permissions, then returns only the minimum permitted context.
- Keep sensitive data logically separated and apply stricter storage and retention controls.
- Do not send sensitive or cross-domain data to Gemini unless the relevant permission is active and the data is necessary for the requested task.
- Keep secrets and provider credentials server-side.
- Log permission changes and security-relevant access without unnecessarily logging private content.
- Provide clear settings for general, Mariluna, Private and sensitive-data permissions.
- Default to least privilege.

## User experience

- Jarvis is available in both domains and visibly indicates the active context.
- When a request needs information from another domain, Jarvis explains what information is needed and asks permission if it has not already been granted.
- The user can deliberately mark selected information as shared/general.
- No silent cross-domain memory blending.

## Implementation status

This is an approved product and privacy design decision. It is not yet implemented or security-tested. The existing repository contains preliminary context scopes and AI permission flags, but those are not sufficient proof that all boundaries are enforced end-to-end. Implementation must include server-side enforcement and tests for allowed and denied access paths.
