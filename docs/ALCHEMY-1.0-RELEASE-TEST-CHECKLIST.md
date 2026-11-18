# Alchemy 1.0 Release Test Checklist

Branch under test: `design/phase-1`

This checklist separates a usable test candidate from a production release. A checkbox may only be marked after the test has actually been executed and its result recorded.

## 1. Automated quality gates

- [ ] GitHub Actions TypeScript check (`npm run lint`) passes.
- [ ] Production client and server build (`npm run build`) passes.
- [ ] No unreviewed dependency or lockfile drift.
- [ ] CI result is visible on the tested commit SHA.

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
- [ ] Export/backup and restore are verified before testing destructive migrations.

## 4. Authentication and privacy

- [ ] First-time security setup can be completed from a clean account.
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
- [ ] Gmail access is separately scoped and independently disconnectable.
- [ ] Health Connect is clearly unavailable until a native Android bridge is delivered.
- [ ] Renpho sync is not advertised as available until its actual supported data path is verified.
- [ ] Integration errors are visible and do not create fake successful sync timestamps.

## 6. Jarvis

- [ ] Jarvis works with the configured Gemini key and reports unavailable state clearly when missing.
- [ ] Local fallback is clearly distinguished from live AI responses.
- [ ] Domain context selection is correct.
- [ ] Sensitive private context is excluded unless explicitly authorized.
- [ ] AI errors, empty responses and network loss do not lose user-entered content.

## 7. Responsive and device checks

- [ ] Android phone portrait layout.
- [ ] Android phone landscape layout.
- [ ] Desktop wide layout.
- [ ] Keyboard navigation and visible focus states.
- [ ] Touch targets, dialogs, scrolling and virtual keyboard behavior.

## Release decision

**Test candidate:** all core workflows work and known limitations are documented; no claim of production safety.

**Production 1.0:** all applicable automated gates pass, critical security/privacy tests pass, persistence and recovery are verified, and unresolved release blockers are closed.

Do not mark a test as passed based only on source inspection or a successful commit.
