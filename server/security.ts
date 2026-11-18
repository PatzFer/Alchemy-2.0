import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  VerifiedRegistrationResponse,
  VerifiedAuthenticationResponse,
} from '@simplewebauthn/server';
import { generateSecret, generateURI, verifySync } from 'otplib';

export interface PasskeyCredential {
  id: string; // Base64URL string
  publicKey: string; // Base64URL string of public key
  counter: number;
  transports?: string[];
  nickname: string;
  createdAt: string;
  lastUsedAt: string;
  aaguid?: string;
  backedUp?: boolean;
}

export interface ActiveSession {
  id: string; // Internal HttpOnly-cookie credential; never expose in API responses.
  publicId: string; // Non-authenticating identifier safe for device-management UI.
  deviceId: string;
  deviceName: string;
  ip: string;
  userAgent: string;
  createdAt: string;
  lastActive: string;
  lastActivityMs: number;
  authenticatedWith: 'passkey' | 'totp' | 'recovery_code' | 'preview_test_mode' | 'unauthenticated';
  isAppAuthenticated: boolean;
  isPreviewMode?: boolean;
  appAuthenticatedAt?: number;
  inactivityTimeoutMinutes: number; // default 15
  stepUpExpiresAt: number; // epoch ms
  sensitiveUnlockedUntil: number; // epoch ms
  isCurrent?: boolean;
}

export interface SecurityPermissions {
  calendarRead: boolean;
  calendarWrite: boolean;
  aiMayCreateTasks: boolean;
  aiRequiresConfirmationForModifications: boolean;
  aiRequiresConfirmationForDestructive: boolean;
  allowCycleDataToAI: boolean; // default FALSE - strictly private
  allowPersonalDataToAI: boolean;
  allowMarilunaDataToAI: boolean;
  allowFinancialDataToAI: boolean;
  allowWellbeingDataToAI: boolean; // default FALSE - strictly quarantined
  activeAiProvider: 'gemini-server' | 'local-rules';
}

export interface RecoveryCodeItem {
  codeHash: string;
  preview: string; // e.g., PMAL-****-3281
  used: boolean;
  usedAt?: string;
}

// In-Memory Master Security Vault for single-user Personal OS
class SecurityVault {
  // Passkeys
  private passkeys: Map<string, PasskeyCredential> = new Map();
  // TOTP
  private totpSecret: string | null = null;
  private tempTotpSecret: string | null = null;
  private totpEnabled: boolean = false;
  // Recovery codes (stored as SHA-256 hashes)
  private recoveryCodes: RecoveryCodeItem[] = [];
  // Active sessions
  private sessions: Map<string, ActiveSession> = new Map();
  // WebAuthn challenges are one-time, short-lived nonces. Keep the registry
  // bounded so abandoned browser ceremonies cannot grow server memory forever.
  private currentChallenges: Map<string, { challenge: string; expiresAt: number }> = new Map();
  private readonly challengeTtlMs = 5 * 60 * 1000;
  private readonly maxPendingChallenges = 5000;
  // Rate limiting / lockouts
  private failedAttempts: Map<string, { count: number; lockedUntil: number }> = new Map();
  // Permissions
  private permissions: SecurityPermissions = {
    calendarRead: true,
    calendarWrite: false, // Separate write permission
    aiMayCreateTasks: true,
    aiRequiresConfirmationForModifications: true, // Non-negotiable
    aiRequiresConfirmationForDestructive: true, // Non-negotiable
    allowCycleDataToAI: false, // Strict default: Cycle stays strictly within Personal domain
    // Explicit opt-in: no personal or business records are sent to Gemini by default.
    allowPersonalDataToAI: false,
    allowMarilunaDataToAI: false,
    allowFinancialDataToAI: false,
    allowWellbeingDataToAI: false, // Default quarantined: user explicitly permits in settings/module
    activeAiProvider: 'gemini-server',
  };

  constructor() {
    // Generate initial recovery codes for initial onboarding
    this.regenerateRecoveryCodesInternal();
  }

  // ----------------------------------------------------
  // Rate Limiting & Lockout
  // ----------------------------------------------------
  public checkRateLimit(key: string): { allowed: boolean; remainingLockoutSeconds?: number } {
    const record = this.failedAttempts.get(key);
    const now = Date.now();
    if (record && record.lockedUntil > now) {
      return {
        allowed: false,
        remainingLockoutSeconds: Math.ceil((record.lockedUntil - now) / 1000),
      };
    }
    return { allowed: true };
  }

  public recordFailedAttempt(key: string): void {
    const record = this.failedAttempts.get(key) || { count: 0, lockedUntil: 0 };
    record.count += 1;
    if (record.count >= 5) {
      // 15-minute lock out
      record.lockedUntil = Date.now() + 15 * 60 * 1000;
      record.count = 0;
    }
    this.failedAttempts.set(key, record);
  }

  public clearFailedAttempts(key: string): void {
    this.failedAttempts.delete(key);
  }

  // ----------------------------------------------------
  // Session Management
  // ----------------------------------------------------
  public createSession(
    req: Request,
    authMethod: ActiveSession['authenticatedWith'] = 'unauthenticated',
    isAppAuthenticated: boolean = false
  ): ActiveSession {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Modern Web Platform';

    // Derive a clean device name from userAgent
    let deviceName = 'Personal Device';
    if (/android/i.test(userAgent)) deviceName = 'Android Mobile';
    else if (/iphone|ipad/i.test(userAgent)) deviceName = 'Apple iOS Device';
    else if (/macintosh/i.test(userAgent)) deviceName = 'macOS Workstation';
    else if (/windows/i.test(userAgent)) deviceName = 'Windows Workstation';
    else if (/linux/i.test(userAgent)) deviceName = 'Linux Client';

    const now = Date.now();
    const session: ActiveSession = {
      id: sessionId,
      publicId: crypto.randomUUID(),
      deviceId: crypto.createHash('sha256').update(ip + userAgent).digest('hex').substring(0, 12),
      deviceName,
      ip,
      userAgent,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      lastActivityMs: now,
      authenticatedWith: authMethod,
      isAppAuthenticated: isAppAuthenticated,
      appAuthenticatedAt: isAppAuthenticated ? now : undefined,
      inactivityTimeoutMinutes: 15,
      stepUpExpiresAt: (authMethod === 'passkey' || authMethod === 'totp' || authMethod === 'recovery_code') && isAppAuthenticated
        ? now + 10 * 60 * 1000 // 10 minutes step-up on fresh strong auth
        : 0,
      sensitiveUnlockedUntil: isAppAuthenticated ? now + 60 * 60 * 1000 : 0,
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  public getSession(sessionId: string): ActiveSession | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      const now = Date.now();
      // Check inactivity timeout if app is authenticated
      if (session.isAppAuthenticated) {
        const timeoutMs = (session.inactivityTimeoutMinutes || 15) * 60 * 1000;
        if (now - (session.lastActivityMs || now) > timeoutMs) {
          session.isAppAuthenticated = false;
          session.stepUpExpiresAt = 0;
          session.sensitiveUnlockedUntil = 0;
        }
      }
      session.lastActive = new Date().toISOString();
    }
    return session;
  }

  public touchActivity(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session && session.isAppAuthenticated) {
      session.lastActivityMs = Date.now();
      session.lastActive = new Date().toISOString();
    }
  }

  public authenticateApp(
    sessionId: string,
    method: 'passkey' | 'totp' | 'recovery_code' | 'preview_test_mode'
  ): ActiveSession | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      const now = Date.now();
      session.isAppAuthenticated = true;
      session.authenticatedWith = method;
      session.isPreviewMode = method === 'preview_test_mode';
      session.appAuthenticatedAt = now;
      session.lastActivityMs = now;
      session.lastActive = new Date().toISOString();
      session.stepUpExpiresAt = now + 10 * 60 * 1000; // 10 minutes grace for immediate administrative tasks
      session.sensitiveUnlockedUntil = now + 60 * 60 * 1000;
    }
    return session;
  }

  public lockApp(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isAppAuthenticated = false;
      session.isPreviewMode = false;
      session.stepUpExpiresAt = 0;
      session.sensitiveUnlockedUntil = 0;
      session.lastActive = new Date().toISOString();
    }
  }

  public setSessionTimeout(sessionId: string, minutes: number): void {
    const session = this.sessions.get(sessionId);
    if (session && minutes >= 1 && minutes <= 240) {
      session.inactivityTimeoutMinutes = minutes;
    }
  }

  public getActiveSessions(currentSessionId: string): Array<{
    id: string;
    deviceId: string;
    deviceName: string;
    ip: string;
    userAgent: string;
    createdAt: string;
    lastActive: string;
    authenticatedWith: ActiveSession['authenticatedWith'];
    isAppAuthenticated: boolean;
    isPreviewMode?: boolean;
    appAuthenticatedAt?: number;
    inactivityTimeoutMinutes: number;
    isCurrent: boolean;
  }> {
    return Array.from(this.sessions.values()).map((s) => ({
      id: s.publicId,
      deviceId: s.deviceId,
      deviceName: s.deviceName,
      ip: s.ip,
      userAgent: s.userAgent,
      createdAt: s.createdAt,
      lastActive: s.lastActive,
      authenticatedWith: s.authenticatedWith,
      isAppAuthenticated: s.isAppAuthenticated,
      isPreviewMode: s.isPreviewMode,
      appAuthenticatedAt: s.appAuthenticatedAt,
      inactivityTimeoutMinutes: s.inactivityTimeoutMinutes,
      isCurrent: s.id === currentSessionId,
    }));
  }

  // Device-management endpoints accept only the public identifier, never the
  // HttpOnly cookie credential used internally to authenticate API requests.
  public revokeSession(publicId: string): boolean {
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.publicId === publicId) return this.sessions.delete(sessionId);
    }
    return false;
  }

  public revokeOtherSessions(currentSessionId: string): void {
    for (const id of Array.from(this.sessions.keys())) {
      if (id !== currentSessionId) {
        this.sessions.delete(id);
      }
    }
  }

  public grantStepUp(sessionId: string, durationMinutes: number = 10): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.stepUpExpiresAt = Date.now() + durationMinutes * 60 * 1000;
      session.sensitiveUnlockedUntil = Date.now() + 15 * 60 * 1000;
    }
  }

  public grantSensitiveUnlock(sessionId: string, durationMinutes: number = 15): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.sensitiveUnlockedUntil = Date.now() + durationMinutes * 60 * 1000;
    }
  }

  public lockSensitive(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.sensitiveUnlockedUntil = 0;
      session.stepUpExpiresAt = 0;
    }
  }

  // ----------------------------------------------------
  // Passkey / WebAuthn Operations
  // ----------------------------------------------------
  public setChallenge(key: string, challenge: string, ttlMs: number = this.challengeTtlMs): void {
    const now = Date.now();
    for (const [pendingKey, pending] of this.currentChallenges) {
      if (pending.expiresAt <= now) this.currentChallenges.delete(pendingKey);
    }

    // Bound memory use even if a client repeatedly requests new ceremonies.
    while (this.currentChallenges.size >= this.maxPendingChallenges) {
      const oldestKey = this.currentChallenges.keys().next().value;
      if (oldestKey === undefined) break;
      this.currentChallenges.delete(oldestKey);
    }

    this.currentChallenges.set(key, {
      challenge,
      expiresAt: now + Math.max(1, Math.min(ttlMs, this.challengeTtlMs)),
    });
  }

  public getChallenge(key: string): string | undefined {
    const pending = this.currentChallenges.get(key);
    if (!pending) return undefined;
    if (pending.expiresAt <= Date.now()) {
      this.currentChallenges.delete(key);
      return undefined;
    }
    return pending.challenge;
  }

  // Atomically remove a ceremony nonce before cryptographic verification so
  // concurrent/replayed submissions cannot both consume the same challenge.
  public consumeChallenge(key: string): string | undefined {
    const challenge = this.getChallenge(key);
    this.currentChallenges.delete(key);
    return challenge;
  }

  public deleteChallenge(key: string): void {
    this.currentChallenges.delete(key);
  }

  public getPasskeys(): PasskeyCredential[] {
    return Array.from(this.passkeys.values());
  }

  public getPasskey(id: string): PasskeyCredential | undefined {
    return this.passkeys.get(id);
  }

  public savePasskey(cred: PasskeyCredential): void {
    this.passkeys.set(cred.id, cred);
  }

  public updatePasskeyUsage(id: string, counter: number): void {
    const cred = this.passkeys.get(id);
    if (cred) {
      cred.counter = counter;
      cred.lastUsedAt = new Date().toISOString();
    }
  }

  public deletePasskey(id: string): boolean {
    return this.passkeys.delete(id);
  }

  // ----------------------------------------------------
  // TOTP Authenticator Operations
  // ----------------------------------------------------
  public isTotpEnabled(): boolean {
    return this.totpEnabled;
  }

  public generateTotpSetup(): { secret: string; uri: string } {
    const secret = generateSecret();
    this.tempTotpSecret = secret;
    const uri = generateURI({
      secret,
      label: 'P & M Alchemy (Patricia)',
      issuer: 'P & M Alchemy',
    });
    return { secret, uri };
  }

  public verifyAndEnableTotp(token: string): boolean {
    if (!this.tempTotpSecret) return false;
    const result = verifySync({ secret: this.tempTotpSecret, token });
    if (result.valid) {
      this.totpSecret = this.tempTotpSecret;
      this.tempTotpSecret = null;
      this.totpEnabled = true;
      return true;
    }
    return false;
  }

  public verifyTotp(token: string): boolean {
    if (!this.totpEnabled || !this.totpSecret) return false;
    const result = verifySync({ secret: this.totpSecret, token });
    return result.valid;
  }

  public disableTotp(): void {
    this.totpEnabled = false;
    this.totpSecret = null;
    this.tempTotpSecret = null;
  }

  // ----------------------------------------------------
  // One-Time Recovery Codes
  // ----------------------------------------------------
  public regenerateRecoveryCodesInternal(): string[] {
    const plainCodes: string[] = [];
    const newItems: RecoveryCodeItem[] = [];

    for (let i = 0; i < 8; i++) {
      const seg1 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const seg2 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const plain = `PMAL-${seg1}-${seg2}`;
      plainCodes.push(plain);

      const hash = crypto.createHash('sha256').update(plain).digest('hex');
      newItems.push({
        codeHash: hash,
        preview: `PMAL-****-${seg2}`,
        used: false,
      });
    }

    this.recoveryCodes = newItems;
    return plainCodes;
  }

  public verifyAndConsumeRecoveryCode(plainCode: string): boolean {
    const clean = plainCode.trim().toUpperCase();
    const hash = crypto.createHash('sha256').update(clean).digest('hex');
    const item = this.recoveryCodes.find((r) => r.codeHash === hash && !r.used);
    if (item) {
      item.used = true;
      item.usedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  public getRecoveryCodesStatus(): { total: number; remaining: number; items: { preview: string; used: boolean }[] } {
    return {
      total: this.recoveryCodes.length,
      remaining: this.recoveryCodes.filter((r) => !r.used).length,
      items: this.recoveryCodes.map((r) => ({ preview: r.preview, used: r.used })),
    };
  }

  // ----------------------------------------------------
  // Permissions & AI Privacy Firewall
  // ----------------------------------------------------
  public getPermissions(): SecurityPermissions {
    return { ...this.permissions };
  }

  public updatePermissions(updates: Partial<SecurityPermissions>): SecurityPermissions {
    // Only known, explicitly typed settings may cross this boundary.
    const allowed: Partial<SecurityPermissions> = {};
    const booleanKeys: (keyof SecurityPermissions)[] = [
      'calendarRead',
      'calendarWrite',
      'aiMayCreateTasks',
      'allowCycleDataToAI',
      'allowPersonalDataToAI',
      'allowMarilunaDataToAI',
      'allowFinancialDataToAI',
      'allowWellbeingDataToAI',
    ];
    for (const key of booleanKeys) {
      if (typeof updates[key] === 'boolean') {
        (allowed as any)[key] = updates[key];
      }
    }
    if (updates.activeAiProvider === 'gemini-server' || updates.activeAiProvider === 'local-rules') {
      allowed.activeAiProvider = updates.activeAiProvider;
    }

    // Immutable non-negotiables: AI always requires confirmation before modifications/destructive actions.
    this.permissions = {
      ...this.permissions,
      ...allowed,
      aiRequiresConfirmationForModifications: true,
      aiRequiresConfirmationForDestructive: true,
    };
    return { ...this.permissions };
  }

  // Server-side privacy firewall filter
  public sanitizeContextForAi(rawContext: any, world?: string): any {
    if (!rawContext || typeof rawContext !== 'object') return rawContext;
    const sanitized = JSON.parse(JSON.stringify(rawContext));

    // Filter every mixed-realm collection using server-owned consent settings.
    // Missing realm metadata is ambiguous and therefore excluded from AI context.
    const collectionKeys = ['calendarEvents', 'projects', 'ideas', 'intentions', 'tasks', 'goals'];
    for (const key of collectionKeys) {
      if (!Array.isArray(sanitized[key])) continue;
      sanitized[key] = sanitized[key].filter((item: any) => {
        const realm = item?.realm || item?.world;
        if (realm === 'personal') {
          return this.permissions.allowPersonalDataToAI && (world === 'personal' || world === 'all' || !world);
        }
        if (realm === 'mariluna') {
          return this.permissions.allowMarilunaDataToAI && (world === 'mariluna' || world === 'all');
        }
        return false;
      });
    }

    const isAllowedRealmItem = (item: any): boolean => {
      const realm = item?.realm || item?.world;
      if (realm === 'personal') return this.permissions.allowPersonalDataToAI && (world === 'personal' || world === 'all' || !world);
      if (realm === 'mariluna') return this.permissions.allowMarilunaDataToAI && (world === 'mariluna' || world === 'all');
      return false;
    };
    if (sanitized.todayIntention && !isAllowedRealmItem(sanitized.todayIntention)) delete sanitized.todayIntention;
    if (sanitized.activeContextItem && !isAllowedRealmItem(sanitized.activeContextItem)) delete sanitized.activeContextItem;

    // The legacy chat payload sends memory contents as untagged strings.
    // Without realm metadata they cannot be safely partitioned in either domain.
    delete sanitized.memoriesSample;

    // Domain Separation Principle:
    // Treat each realm as an allowlisted view of mixed client payloads.
    // Arrays are filtered by their explicit realm; ambiguous personal payloads are dropped.
    if (world === 'mariluna') {
      if (Array.isArray(sanitized.calendarEvents)) {
        sanitized.calendarEvents = sanitized.calendarEvents.filter((item: any) => item?.realm === 'mariluna');
      }
      if (Array.isArray(sanitized.projects)) {
        sanitized.projects = sanitized.projects.filter((item: any) => item?.realm === 'mariluna');
      }
      if (Array.isArray(sanitized.ideas)) {
        sanitized.ideas = sanitized.ideas.filter((item: any) => item?.realm === 'mariluna');
      }
      if (Array.isArray(sanitized.intentions)) {
        sanitized.intentions = sanitized.intentions.filter((item: any) => item?.realm === 'mariluna');
      }
      if (sanitized.todayIntention?.realm !== 'mariluna') delete sanitized.todayIntention;
      if (sanitized.activeContextItem && sanitized.activeContextItem.realm !== 'mariluna') delete sanitized.activeContextItem;
      // These fields are private/personal by origin or cannot be safely partitioned.
      delete sanitized.memoriesSample;
      delete sanitized.workingHours;
      delete sanitized.preferences;
      delete sanitized.wellbeing;
      delete sanitized.dailyCheckIns;
      delete sanitized.personalRoutines;
      delete sanitized.lifestyle;
      delete sanitized.lifeProfile;
      delete sanitized.health;
      delete sanitized.nutrition;
      delete sanitized.foodPreferences;
      delete sanitized.dietaryNotes;
      delete sanitized.partnerSharedDinners;
      delete sanitized.personalStyle;
      delete sanitized.stylePreferences;
      delete sanitized.cycleProfile;
      delete sanitized.cyclePhase;
      delete sanitized.menstrual;
      delete sanitized.follicular;
      delete sanitized.luteal;
      delete sanitized.ovulatory;
      delete sanitized.currentPhase;
      delete sanitized.symptoms;
      delete sanitized.cycleDay;
      delete sanitized.progressLogs;
      delete sanitized.bodyMeasurements;
      delete sanitized.measurements;
      delete sanitized.bodyComposition;
      delete sanitized.weightKg;
      delete sanitized.movementHistory;
      delete sanitized.currentWeeklyMovement;
      delete sanitized.weeklyMenu;
      delete sanitized.shoppingList;
      delete sanitized.health;
      delete sanitized.lifeProfile;
      delete sanitized.personalRoutines;
      delete sanitized.lifestyle;
      delete sanitized.dailyCheckIns;
      delete sanitized.wellbeing;
      delete sanitized.progressLogs;
      delete sanitized.bodyMeasurements;
      delete sanitized.measurements;
      delete sanitized.bodyComposition;
      delete sanitized.weightKg;
      delete sanitized.movementHistory;
      delete sanitized.currentWeeklyMovement;
      delete sanitized.weeklyMenu;
      delete sanitized.shoppingList;
      if (Array.isArray(sanitized.tasks)) {
        sanitized.tasks = sanitized.tasks.filter((item: any) => item?.realm === 'mariluna');
      }
      if (Array.isArray(sanitized.goals)) {
        sanitized.goals = sanitized.goals.filter((item: any) => item?.realm === 'mariluna');
      }
    } else if (world === 'personal') {
      if (Array.isArray(sanitized.calendarEvents)) {
        sanitized.calendarEvents = sanitized.calendarEvents.filter((item: any) => item?.realm === 'personal');
      }
      if (Array.isArray(sanitized.projects)) {
        sanitized.projects = sanitized.projects.filter((item: any) => item?.realm === 'personal');
      }
      if (Array.isArray(sanitized.ideas)) {
        sanitized.ideas = sanitized.ideas.filter((item: any) => item?.realm === 'personal');
      }
      if (Array.isArray(sanitized.intentions)) {
        sanitized.intentions = sanitized.intentions.filter((item: any) => item?.realm === 'personal');
      }
      if (sanitized.todayIntention?.realm !== 'personal') delete sanitized.todayIntention;
      if (sanitized.activeContextItem && sanitized.activeContextItem.realm !== 'personal') delete sanitized.activeContextItem;
      if (Array.isArray(sanitized.tasks)) {
        sanitized.tasks = sanitized.tasks.filter((item: any) => item?.realm === 'personal');
      }
      if (Array.isArray(sanitized.goals)) {
        sanitized.goals = sanitized.goals.filter((item: any) => item?.realm === 'personal');
      }
      delete sanitized.offerings;
      delete sanitized.contentPlan;
      delete sanitized.marilunaData;
      delete sanitized.marilunaAdmin;
      delete sanitized.projectsBusiness;
      delete sanitized.instagram;
      delete sanitized.gmail;
      delete sanitized.unreadBusinessInquiriesCount;
    }

    if (world === 'mariluna') {
      delete sanitized.cycleProfile;
      delete sanitized.cyclePhase;
      delete sanitized.menstrual;
      delete sanitized.follicular;
      delete sanitized.luteal;
      delete sanitized.ovulatory;
      delete sanitized.currentPhase;
      delete sanitized.symptoms;
      delete sanitized.cycleDay;
      delete sanitized.personalRoutines;
      delete sanitized.lifestyle;
      delete sanitized.dailyCheckIns;
      delete sanitized.wellbeing;
      delete sanitized.progressLogs;
      delete sanitized.bodyMeasurements;
      delete sanitized.measurements;
      delete sanitized.bodyComposition;
      delete sanitized.weightKg;
      delete sanitized.movementHistory;
      delete sanitized.currentWeeklyMovement;
      delete sanitized.weeklyMenu;
      delete sanitized.shoppingList;
      delete sanitized.personalStyle;
      delete sanitized.nutrition;
      delete sanitized.foodPreferences;
      delete sanitized.dietaryNotes;
      delete sanitized.lifeProfile;
      delete sanitized.health;
      delete sanitized.stylePreferences;
      delete sanitized.partnerSharedDinners;
      if (Array.isArray(sanitized.tasks)) {
        sanitized.tasks = sanitized.tasks.filter((t: any) => t.world !== 'personal' && t.realm !== 'personal');
      }
      if (Array.isArray(sanitized.goals)) {
        sanitized.goals = sanitized.goals.filter((g: any) => g.world !== 'personal' && g.realm !== 'personal');
      }
    }

    // Firewall Rule 1: Cycle data isolation (Never sent to AI unless explicit permission granted)
    if (!this.permissions.allowCycleDataToAI) {
      delete sanitized.cycleProfile;
      delete sanitized.cyclePhase;
      delete sanitized.menstrual;
      delete sanitized.follicular;
      delete sanitized.luteal;
      delete sanitized.ovulatory;
      delete sanitized.currentPhase;
      delete sanitized.symptoms;
      delete sanitized.cycleDay;
    }

    // Firewall Rule 2: Personal data isolation
    if (!this.permissions.allowPersonalDataToAI) {
      delete sanitized.workingHours;
      delete sanitized.preferences;
      delete sanitized.lifeProfile;
      delete sanitized.personalStyle;
      delete sanitized.stylePreferences;
      delete sanitized.health;
      delete sanitized.personalRoutines;
      delete sanitized.lifestyle;
      delete sanitized.dailyCheckIns;
      if (Array.isArray(sanitized.tasks)) {
        sanitized.tasks = sanitized.tasks.filter((t: any) => t.world !== 'personal' && t.realm !== 'personal');
      }
      if (Array.isArray(sanitized.goals)) {
        sanitized.goals = sanitized.goals.filter((g: any) => g.world !== 'personal' && g.realm !== 'personal');
      }
    }

    // Firewall Rule 3: Mariluna business isolation
    if (!this.permissions.allowMarilunaDataToAI) {
      delete sanitized.offerings;
      delete sanitized.contentPlan;
      delete sanitized.marilunaData;
      delete sanitized.marilunaAdmin;
      delete sanitized.projectsBusiness;
      delete sanitized.instagram;
      delete sanitized.gmail;
      delete sanitized.unreadBusinessInquiriesCount;
      if (Array.isArray(sanitized.tasks)) {
        sanitized.tasks = sanitized.tasks.filter((t: any) => t.world !== 'mariluna' && t.realm !== 'mariluna');
      }
      if (Array.isArray(sanitized.goals)) {
        sanitized.goals = sanitized.goals.filter((g: any) => g.world !== 'mariluna' && g.realm !== 'mariluna');
      }
    }

    // Firewall Rule 4: Wellbeing & body progress data quarantine (Never sent to AI unless explicit permission granted)
    if (!this.permissions.allowWellbeingDataToAI) {
      delete sanitized.wellbeing;
      delete sanitized.progressLogs;
      delete sanitized.bodyMeasurements;
      delete sanitized.measurements;
      delete sanitized.bodyComposition;
      delete sanitized.weightKg;
      delete sanitized.movementHistory;
      delete sanitized.currentWeeklyMovement;
      delete sanitized.weeklyMenu;
      delete sanitized.shoppingList;
      // Nutrition and dietary preferences are private health-adjacent data too.
      delete sanitized.nutrition;
      delete sanitized.foodPreferences;
      delete sanitized.dietaryNotes;
      delete sanitized.partnerSharedDinners;
    }

    return sanitized;
  }
}

export const securityVault = new SecurityVault();

// ----------------------------------------------------
// Middleware Helpers
// ----------------------------------------------------
export function getOrCreateSession(req: Request, res: Response): ActiveSession {
  // The opaque session token is accepted only from the HttpOnly cookie.
  // A caller-controlled header must never act as an alternate session credential.
  const sessionId = req.cookies?.pm_alchemy_session;
  // Session IDs are 256-bit random hex values. Reject malformed or oversized
  // cookie values before consulting the in-memory session registry.
  if (typeof sessionId === 'string' && /^[a-f0-9]{64}$/i.test(sessionId)) {
    const existing = securityVault.getSession(sessionId);
    if (existing) {
      return existing;
    }
  }

  const newSession = securityVault.createSession(req, 'unauthenticated', false);
  res.cookie('pm_alchemy_session', newSession.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
  return newSession;
}

/**
 * Protect AI and private-data endpoints at the server boundary.
 * A client-side lock screen is not an authorization mechanism.
 */
export function requireAppAuth(req: Request, res: Response, next: NextFunction) {
  const session = getOrCreateSession(req, res);
  if (!session.isAppAuthenticated) {
    return res.status(401).json({ error: 'Application authentication required.', authenticationRequired: true });
  }

  const timeoutMs = (session.inactivityTimeoutMinutes || 15) * 60 * 1000;
  const lastActivity = session.lastActivityMs || 0;
  if (!lastActivity || Date.now() - lastActivity > timeoutMs) {
    securityVault.lockApp(session.id);
    return res.status(401).json({ error: 'Session expired due to inactivity.', authenticationRequired: true });
  }

  securityVault.touchActivity(session.id);
  return next();
}

export function requireStepUpAuth(req: Request, res: Response, next: NextFunction) {
  const session = getOrCreateSession(req, res);
  const now = Date.now();
  if (session.stepUpExpiresAt > now) {
    return next();
  }
  return res.status(403).json({
    error: 'Step-up authentication required for critical action.',
    stepUpRequired: true,
    securityLevel: 3,
    requires: ['passkey', 'totp', 'recovery_code'],
  });
}
