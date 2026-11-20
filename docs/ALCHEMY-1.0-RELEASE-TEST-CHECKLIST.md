# Alchemy 1.0 Release Test Checklist

Branch under test: `build/phase-2-planner`

This checklist separates a usable test candidate from a production release. A checkbox may only be marked after the test has actually been executed and its result recorded.

## 1. Automated quality gates

- [x] Locked dependency installation passed in GitHub Actions run 44790369982 on commit `2757f1c5`.
- [x] TypeScript check (`bun run lint`) passed on commit `2757f1c5`.
- [x] Supabase migration safety checks passed on commit `2757f1c5`.
- [x] Privacy, Jarvis and Renpho import regression tests (`bun run test`) passed on commit `2757f1c5`.
- [x] Production client and server build (`bun run build`) passed on commit `2757f1c5`.
- [ ] No unreviewed dependency or lockfile drift.
- [ ] Live Supabase staging migration, read/write and restore tests completed.

## 2. First-launch and navigation

- [ ] Fresh browser profile opens without console errors.
- [ ] PWA manifest name, icon, theme and install prompt are correct.
- [ ] Home presents Mariluna and Privé as distinct entry points.
- [ ] Domain navigation and return-to-home behavior work on mobile and desktop.
- [ ] No view is inaccessible through navigation or browser refresh.

## 3. Core workflows

- [ ] Quick Capture creates task, reminder, idea, note and appointment.
- [ ] Captures inherit the active domain and can be reassigned where supported.
- [ ] Agenda and Tasks filters show the correct domain records.
- [ ] Calendar all-day and timed events display correctly in local time.
- [ ] Existing records survive reload and app restart.
- [x] Checksummed export verification and tamper rejection are covered by automated tests; full browser download/restore and migration recovery drill remain to be manually tested.

## 4. Authentication and privacy

- [ ] First-time security setup can be completed from a clean account.\n- [x] First-Time Foundation wizard is reachable from Settings; manual flow still needs browser acceptance.
- [ ] TOTP setup, verification and recovery are tested.
- [ ] Recovery codes are one-time, hashed at rest and rate limited.
- [ ] Passkey registration and login work on supported HTTPS origins and devices.
- [ ] Invalid credentials, expired sessions and inactivity timeout fail closed.
- [ ] Sensitive-data step-up cannot be bypassed by changing request payloads.
- [ ] Server restart does not silently reset authentication state.
- [ ] Private/cycle/health context is not exposed to Mariluna or general Jarvis contexts.
- [ ] Browser storage and server persistence have an approved encryption and key-management design.

## 5. Integrations

- [ ] Google Calendar OAuth grants only required read permissions.
- [ ] Calendar import handles pagination, all-day events, time zones and duplicates.
- [ ] Disconnect clears local tokens and revokes provider grants where supported.
- [x] Automated tests cover in-memory token expiry, explicit clearing and local disconnect cleanup.
- [x] Gmail/email integration is excluded from Version 1.0 scope.
- [ ] Health Connect is clearly unavailable until a native Android bridge is delivered.
- [ ] Renpho CSV import is available in Wellbeing → Progress; manually verify a real export and duplicate-date merge.
- [ ] Integration errors are visible and do not create fake successful sync timestamps.
- [x] Quiet-hours boundaries and malformed clock settings are covered by automated tests.
- [x] A configured daily notification limit of zero is respected; invalid limits are bounded safely.

- [x] Jarvis action blocks accept only supported action types and malformed/unsupported JSON is not shown to the user.\n- [x] Reschedule actions validate exact task ownership and real calendar dates before applying.\n- [x] Jarvis defaults to local privacy mode; Gemini free-tier data-use warning is visible before opt-in.\n\n## 6. Jarvis

- [ ] Jarvis works with the configured Gemini key and reports unavailable state clearly when missing.
- [ ] Local fallback is clearly distinguished from live AI responses.
- [ ] Domain context selection is correct.
- [ ] Sensitive private context is excluded unless explicitly authorized.
- [ ] AI errors, empty responses and network loss do not lose user-entered content.

## 7. Responsive and device checks

- [x] Daily dashboard task grouping has automated coverage for overdue/today separation, world filtering, priority ordering and invalid dates.
- [x] Jarvis calendar-capacity calculation counts overlapping appointments only once; automated interval tests included.
- [x] Ideas review prompt uses local calendar-day thresholds and rejects invalid date-only values; automated tests included.
- [ ] Android phone portrait layout.
- [ ] Android phone landscape layout.
- [ ] Desktop wide layout.
- [ ] Keyboard navigation and visible focus states.
- [ ] Touch targets, dialogs, scrolling and virtual keyboard behavior.

## Release decision

**Test candidate:** all core workflows work and known limitations are documented; no claim of production safety.

**Production 1.0:** all applicable automated gates pass, critical security/privacy tests pass, persistence and recovery are verified, and unresolved release blockers are closed.

Do not mark a test as passed based only on source inspection or a successful commit.


## 7. Snapshot concurrency and recovery

- [ ] Apply the revision compare-and-swap migration to a disposable Supabase staging project.
- [ ] Verify an expected revision of 0 creates the first snapshot.
- [ ] Verify two writers using the same expected revision cannot both commit.
- [ ] Verify the losing writer receives HTTP 409 and can reload before retrying.
- [ ] Verify a snapshot can be loaded, checksum-validated and restored without changing the existing local copy.
- [ ] Verify owner A cannot read or write owner B's snapshots.
- [ ] Verify service-role credentials and APP_ENCRYPTION_KEY are absent from browser bundles and logs.


## 8. 1.0 testability additions

- [x] Server-gated preview authentication is wired to the client; the server rejects it in production.\n- [x] Active preview sessions display a synthetic-data warning.
- [x] Jarvis response validation and failure messaging are covered by automated tests.
- [x] Renpho CSV parser, regional date handling, composition bounds and non-destructive merge are covered by automated tests.
- [x] Automated recurrence tests cover late completion, skipped missed occurrences, month-end anchoring and invalid dates.
- [x] Browser push delivery is gated by notification settings, integration state and quiet hours; push side effects are outside React state updaters.
- [ ] Verify the First-Time Setup wizard manually on Android and desktop.
- [ ] Import a real Renpho CSV export and compare the imported values against the Renpho app.
