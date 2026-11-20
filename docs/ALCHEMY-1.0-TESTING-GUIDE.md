# Alchemy 1.0 — Private Test Guide

Status: internal test build, not production-ready.
Branch: `build/phase-2-planner`
Last updated: 20 November 2026

## What this build is for

Use this version to test the day-to-day product flow, discover UX gaps and validate local workflows before enabling durable cloud accounts or inviting anyone else to use it.

Use synthetic or non-sensitive test data only. Do not enter real cycle, health, financial, client or other confidential records in a public/shared preview.

## Local preview

1. Check out `build/phase-2-planner`; do not merge it into `main`.
2. Install the locked dependencies with `bun install --frozen-lockfile`.
3. Copy `.env.example` to a local `.env`.
4. For a local-only preview, keep `ENABLE_PREVIEW_AUTH=true`.
5. Add `GEMINI_API_KEY` only to the server-side `.env` or the host's secret manager. Never put it in a `VITE_` variable or commit it.
6. Run `bun run dev` and open the local URL printed by the server.

The preview-unlock endpoint is rejected when `NODE_ENV=production`, even if the flag is set. Do not enable preview authentication on a public production deployment.

For a private AI Studio Build preview, configure `ENABLE_PREVIEW_AUTH=true` as a server-side environment variable for the preview runtime. If the flag is not present, Alchemy intentionally stays on the authentication screen. The server still rejects preview unlock when `NODE_ENV=production`.

To test live Gemini, first review the data-use warning in Settings → Security & Privacy, then explicitly choose Gemini and enable only the synthetic-data workspace scopes you intend to test. Local privacy mode is the default.

## Core workflows to test

- On a fresh local profile, complete the Foundation wizard on first launch; reopen it later from Settings.
- Switch between the Privé and Mariluna workspaces.
- Create, edit, complete, reschedule and delete tasks.
- Create ideas, goals and projects; test the Mariluna offering editor.
- Use Quick Capture from Home and from inside each workspace.
- Use Jarvis in the active workspace; verify that suggestions require explicit confirmation.
- Review calendar events and try the read-only Google Calendar connection if OAuth is configured.
- Enter a manual progress measurement and import a Renpho CSV from Wellbeing → Progress.
- Test water, movement, meals/menu planning, check-ins, cycle and notification settings.
- Export a backup, then verify the backup before attempting a restore.

## Current capability boundaries

- Core app records are saved in browser localStorage on the current browser/device. Cross-device cloud sync is not activated.
- Snapshot APIs and concurrency safeguards exist, but no live Supabase project has been provisioned or migrated for this test build.
- Server-side auth/session/credential vaults remain in-memory. Preview mode is for synthetic data only and can reset on server restart.
- Google Calendar uses a read-only connection. Google OAuth token caching is currently session-memory only, so a reconnect may be requested after reload.
- Health Connect is not yet implemented as a native Android integration. The wellbeing module supports manual entries and Renpho CSV import as an interim path.
- Renpho CSV import maps date, weight, body-fat, skeletal-muscle and body-water columns. It supports kg/lb and comma- or semicolon-delimited exports, and merges by date while retaining existing manual notes and measurements.
- Instagram Graph API refresh and native Android Health Connect remain unavailable; the UI must not be interpreted as a live connection.
- Jarvis defaults to Local privacy mode. Gemini requires server-side configuration plus explicit provider and workspace consent. When unavailable or not consented, it uses the local privacy-mode response instead of sending workspace data to Gemini.\n- Google states that content submitted through the free Gemini API tier may be used to improve Google products; the paid tier states submitted content is not used for product improvement but may incur costs. Keep confidential client, health, cycle and financial data in Local privacy mode unless the applicable data terms and tier have been reviewed.

## Verification commands

- `bun run lint`
- `bun run test`
- `bun run check:supabase`
- `bun run build`

Passing these checks validates the code pipeline. It does not by itself establish production readiness, live cloud persistence, native integrations or security durability.
