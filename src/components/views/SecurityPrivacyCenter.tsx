import React, { useState, useEffect } from 'react';
import {
  Shield,
  Fingerprint,
  Lock,
  Unlock,
  KeyRound,
  Smartphone,
  Laptop,
  Trash2,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Cpu,
  Calendar,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  Server,
  Database,
  Sliders,
} from 'lucide-react';
import { StepUpAuthModal } from '../StepUpAuthModal';
import {
  registerNewPasskey,
  authenticateWithPasskey,
  checkWebAuthnCapability,
  WebAuthnCapability,
} from '../../lib/webauthnClient';
import { MemoryItem } from '../../types';

interface SecurityPrivacyCenterProps {
  memories: MemoryItem[];
  onDeleteMemory: (id: string) => void;
  onClearAllMemories: () => void;
  onExportCompleteData: () => void;
  onResetCompleteData: () => void;
}

interface SecurityStatusResponse {
  authenticated: boolean;
  sessionId: string;
  deviceId: string;
  deviceName: string;
  currentSecurityLevel: 1 | 2 | 3;
  isStepUpActive: boolean;
  stepUpRemainingSeconds: number;
  isSensitiveUnlocked: boolean;
  sensitiveRemainingSeconds: number;
  hasPasskeys: boolean;
  passkeyCount: number;
  totpEnabled: boolean;
  recoveryCodesRemaining: number;
  recoveryCodesTotal: number;
  permissions: {
    calendarRead: boolean;
    calendarWrite: boolean;
    aiMayCreateTasks: boolean;
    aiRequiresConfirmationForModifications: boolean;
    aiRequiresConfirmationForDestructive: boolean;
    allowCycleDataToAI: boolean;
    allowPersonalDataToAI: boolean;
    allowMarilunaDataToAI: boolean;
    allowFinancialDataToAI: boolean;
    activeAiProvider: 'gemini-server' | 'local-rules';
  };
}

interface ActiveSessionItem {
  id: string;
  deviceId: string;
  deviceName: string;
  ip: string;
  userAgent: string;
  createdAt: string;
  lastActive: string;
  authenticatedWith: string;
  isCurrent?: boolean;
}

interface PasskeyItem {
  id: string;
  nickname: string;
  createdAt: string;
  lastUsedAt: string;
}

export const SecurityPrivacyCenter: React.FC<SecurityPrivacyCenterProps> = ({
  memories,
  onDeleteMemory,
  onClearAllMemories,
  onExportCompleteData,
  onResetCompleteData,
}) => {
  const [status, setStatus] = useState<SecurityStatusResponse | null>(null);
  const [sessions, setSessions] = useState<ActiveSessionItem[]>([]);
  const [passkeys, setPasskeys] = useState<PasskeyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Step-up modal state
  const [isStepUpOpen, setIsStepUpOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [stepUpTitle, setStepUpTitle] = useState('Elevated Verification');
  const [stepUpDesc, setStepUpDesc] = useState('Level 3 Step-Up authentication required.');
  const [stepUpLevel, setStepUpLevel] = useState<2 | 3>(3);
  const [webAuthnCap, setWebAuthnCap] = useState<WebAuthnCapability | null>(null);

  // Passkey registration input
  const [newPasskeyName, setNewPasskeyName] = useState('');
  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);

  // TOTP setup state
  const [isSettingUpTotp, setIsSettingUpTotp] = useState(false);
  const [totpSetupData, setTotpSetupData] = useState<{ secret: string; uri: string } | null>(null);
  const [totpVerifyCode, setTotpVerifyCode] = useState('');
  const [isTotpCopied, setIsTotpCopied] = useState(false);

  // Recovery codes display
  const [newRecoveryCodes, setNewRecoveryCodes] = useState<string[] | null>(null);

  // Delete data phrase
  const [deletePhrase, setDeletePhrase] = useState('');
  const [isDeletingData, setIsDeletingData] = useState(false);

  // Load all security info from server
  const fetchSecurityData = async () => {
    try {
      const [statusRes, sessionsRes, passkeysRes] = await Promise.all([
        fetch('/api/security/status'),
        fetch('/api/security/sessions'),
        fetch('/api/security/passkeys'),
      ]);

      if (statusRes.ok) setStatus(await statusRes.json());
      if (sessionsRes.ok) {
        const data = await sessionsRes.json();
        setSessions(data.sessions || []);
      }
      if (passkeysRes.ok) {
        const data = await passkeysRes.json();
        setPasskeys(data.passkeys || []);
      }
    } catch (err) {
      console.error('Failed to load security state:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
    checkWebAuthnCapability().then(setWebAuthnCap);
    const interval = setInterval(fetchSecurityData, 15000);
    return () => clearInterval(interval);
  }, []);

  // Helper for step-up gated actions
  const requireStepUp = (action: () => void, title: string, desc: string, level: 2 | 3 = 3) => {
    if (level === 3 && status?.isStepUpActive) {
      action();
    } else if (level === 2 && status?.isSensitiveUnlocked) {
      action();
    } else {
      setPendingAction(() => action);
      setStepUpTitle(title);
      setStepUpDesc(desc);
      setStepUpLevel(level);
      setIsStepUpOpen(true);
    }
  };

  const handleStepUpSuccess = () => {
    fetchSecurityData();
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  // Lock / Unlock Sensitive Personal Data
  const handleLockSensitive = async () => {
    try {
      await fetch('/api/auth/lock-sensitive', { method: 'POST' });
      fetchSecurityData();
      setNotificationMsg({ type: 'success', text: 'Sensitive Personal Sanctuary locked immediately.' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnlockSensitiveWithPasskey = async () => {
    try {
      const res = await authenticateWithPasskey();
      if (res.success) {
        fetchSecurityData();
        setNotificationMsg({ type: 'success', text: 'Sanctuary unlocked with platform biometric passkey.' });
      } else {
        if (res.isIframeBlocked) {
          // Gracefully open modal so user can unlock with recovery code or TOTP right here
          requireStepUp(
            () => {
              fetchSecurityData();
              setNotificationMsg({ type: 'success', text: 'Sanctuary unlocked.' });
            },
            'Unlock Personal Sanctuary',
            'Browser iframe restrictions require authenticating with a Recovery Code or TOTP in this preview window, or opening in a new tab for native biometrics.',
            2
          );
        } else {
          setNotificationMsg({ type: 'error', text: res.error || 'Biometric verification failed.' });
        }
      }
    } catch (err: any) {
      setNotificationMsg({ type: 'error', text: err.message });
    }
  };

  // Register Passkey
  const handleStartPasskeyRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegisteringPasskey(true);
    setNotificationMsg(null);
    try {
      const res = await registerNewPasskey(newPasskeyName || 'Primary Platform Passkey');
      if (res.success) {
        setNewPasskeyName('');
        fetchSecurityData();
        setNotificationMsg({ type: 'success', text: 'Hardware Passkey successfully registered and bound to this device.' });
      } else {
        setNotificationMsg({ type: 'error', text: res.error || 'Passkey enrollment failed.' });
      }
    } catch (err: any) {
      setNotificationMsg({ type: 'error', text: err.message });
    } finally {
      setIsRegisteringPasskey(false);
    }
  };

  // Delete Passkey
  const handleDeletePasskey = (passkeyId: string) => {
    requireStepUp(
      async () => {
        try {
          const res = await fetch(`/api/security/passkeys/${passkeyId}`, { method: 'DELETE' });
          if (res.ok) {
            fetchSecurityData();
            setNotificationMsg({ type: 'success', text: 'Passkey deleted.' });
          }
        } catch (err) {
          console.error(err);
        }
      },
      'Delete Passkey Credential',
      'Requires Level 3 Step-Up authentication to remove hardware authentication credentials.'
    );
  };

  // TOTP Setup
  const handleInitTotpSetup = async () => {
    try {
      const res = await fetch('/api/auth/totp/setup', { method: 'POST' });
      const data = await res.json();
      setTotpSetupData(data);
      setIsSettingUpTotp(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifyTotpSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/totp/verify-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: totpVerifyCode.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsSettingUpTotp(false);
        setTotpSetupData(null);
        setTotpVerifyCode('');
        fetchSecurityData();
        setNotificationMsg({ type: 'success', text: 'TOTP Authenticator enabled and verified.' });
      } else {
        setNotificationMsg({ type: 'error', text: data.error || 'Invalid TOTP code.' });
      }
    } catch (err: any) {
      setNotificationMsg({ type: 'error', text: err.message });
    }
  };

  const handleDisableTotp = () => {
    requireStepUp(
      async () => {
        try {
          const res = await fetch('/api/auth/totp/disable', { method: 'POST' });
          if (res.ok) {
            fetchSecurityData();
            setNotificationMsg({ type: 'success', text: 'TOTP Authenticator disabled.' });
          }
        } catch (err) {
          console.error(err);
        }
      },
      'Disable TOTP Authenticator',
      'Level 3 Step-Up authorization required to remove secondary authentication.'
    );
  };

  // Regenerate Recovery Codes
  const handleRegenerateRecoveryCodes = () => {
    requireStepUp(
      async () => {
        try {
          const res = await fetch('/api/auth/recovery/regenerate', { method: 'POST' });
          const data = await res.json();
          if (res.ok && data.recoveryCodes) {
            setNewRecoveryCodes(data.recoveryCodes);
            fetchSecurityData();
            setNotificationMsg({ type: 'success', text: '8 fresh single-use recovery codes generated. Store them safely.' });
          }
        } catch (err) {
          console.error(err);
        }
      },
      'Regenerate Recovery Codes',
      'Level 3 Step-Up authorization required to rotate master recovery codes.'
    );
  };

  // Revoke Session
  const handleRevokeSession = (sessionId: string) => {
    requireStepUp(
      async () => {
        try {
          const res = await fetch('/api/security/sessions/revoke', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
          });
          if (res.ok) {
            fetchSecurityData();
            setNotificationMsg({ type: 'success', text: 'Device session revoked.' });
          }
        } catch (err) {
          console.error(err);
        }
      },
      'Revoke Device Session',
      'Level 3 Step-Up authorization required to disconnect an active device.'
    );
  };

  const handleRevokeAllOthers = () => {
    requireStepUp(
      async () => {
        try {
          const res = await fetch('/api/security/sessions/revoke-all-others', { method: 'POST' });
          if (res.ok) {
            fetchSecurityData();
            setNotificationMsg({ type: 'success', text: 'All other active sessions revoked.' });
          }
        } catch (err) {
          console.error(err);
        }
      },
      'Revoke All Other Devices',
      'Level 3 Step-Up authorization required to terminate all concurrent sessions.'
    );
  };

  // Update Permissions
  const handleUpdatePermission = (key: string, value: any) => {
    const isDestructive = key === 'calendarWrite' || key === 'allowCycleDataToAI';
    const execute = async () => {
      try {
        const res = await fetch('/api/security/permissions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [key]: value }),
        });
        if (res.ok) {
          fetchSecurityData();
          setNotificationMsg({ type: 'success', text: 'Privacy & permission rules updated on server.' });
        }
      } catch (err) {
        console.error(err);
      }
    };

    if (isDestructive) {
      requireStepUp(execute, 'Modify Sensitive Privacy Permission', 'Altering write access or cycle data firewall requires Level 3 Step-Up authorization.');
    } else {
      execute();
    }
  };

  // Permanent Data Wipe
  const handlePermanentDelete = () => {
    if (deletePhrase !== 'DELETE ALL MY DATA PERMANENTLY') return;

    requireStepUp(
      async () => {
        setIsDeletingData(true);
        try {
          const res = await fetch('/api/security/delete-all-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ confirmationPhrase: deletePhrase }),
          });
          if (res.ok) {
            onResetCompleteData();
            setNotificationMsg({ type: 'success', text: 'All data permanently destroyed.' });
            setTimeout(() => window.location.reload(), 1500);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsDeletingData(false);
        }
      },
      'Permanent Destruction of All Data',
      'CRITICAL: This permanently erases all local and server data. Level 3 Step-Up authentication is mandatory.'
    );
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E1D4]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-2xl font-medium text-[#2C2825]">
              Security & Privacy Center
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EBE3D3] text-[#5D4E37] text-[10px] font-semibold tracking-wider uppercase border border-[#DDD3C1]">
              Zero-Trust Architecture
            </span>
          </div>
          <p className="text-xs text-[#7A7167] mt-1 font-light max-w-2xl">
            P & M Alchemy protects your personal life, biological rhythms, and Mariluna business with multi-level hardware biometrics, server-side secrets, and strict data firewalls.
          </p>
        </div>

        {/* Global Level Indicator Badge */}
        <div className="flex items-center gap-2">
          <div className="p-3 rounded-2xl bg-[#FFFFFF] border border-[#DDD4C5] shadow-xs flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                status?.currentSecurityLevel === 3
                  ? 'bg-[#3A6B35] animate-pulse'
                  : status?.currentSecurityLevel === 2
                  ? 'bg-[#C5A880]'
                  : 'bg-[#7E694E]'
              }`}
            />
            <div className="text-left">
              <span className="text-[10px] uppercase tracking-wider text-[#8C8377] block font-medium">
                Current State
              </span>
              <span className="text-xs font-semibold text-[#2C2825]">
                {status?.currentSecurityLevel === 3
                  ? 'Level 3: Step-Up Elevated'
                  : status?.currentSecurityLevel === 2
                  ? 'Level 2: Sanctuary Unlocked'
                  : 'Level 1: Normal Passkey Access'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {notificationMsg && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between transition ${
            notificationMsg.type === 'success'
              ? 'bg-[#EFF5EE] border-[#CADDC7] text-[#2F562B]'
              : 'bg-[#FDF2F0] border-[#F3C7C0] text-[#9E362A]'
          }`}
        >
          <div className="flex items-center gap-2">
            {notificationMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{notificationMsg.text}</span>
          </div>
          <button
            onClick={() => setNotificationMsg(null)}
            className="text-[11px] underline opacity-70 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Section 1: Security Hierarchy & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Level 1 Card */}
        <div className="p-5 rounded-2xl border border-[#E3D9C9] bg-[#FFFFFF] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#8C8377] font-semibold">
              Level 1: Standard Access
            </span>
            <ShieldCheck className="w-4 h-4 text-[#7E694E]" />
          </div>
          <h3 className="font-serif text-base font-medium text-[#2C2825]">Passkeys / WebAuthn</h3>
          <p className="text-[11px] text-[#6E655A] font-light leading-relaxed">
            Primary authentication powered by your device platform authenticator. Biometrics remain inside hardware enclave.
          </p>
          <div className="pt-2 flex items-center gap-2 text-xs">
            <span className="font-medium text-[#2C2825]">{status?.passkeyCount || 0} enrolled passkeys</span>
          </div>
        </div>

        {/* Level 2 Card */}
        <div className="p-5 rounded-2xl border border-[#E3D9C9] bg-[#FFFFFF] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#8C8377] font-semibold">
              Level 2: Personal Sanctuary
            </span>
            {status?.isSensitiveUnlocked ? (
              <Unlock className="w-4 h-4 text-[#3A6B35]" />
            ) : (
              <Lock className="w-4 h-4 text-[#8C7654]" />
            )}
          </div>
          <h3 className="font-serif text-base font-medium text-[#2C2825]">Cycle & Sensitive Data</h3>
          <p className="text-[11px] text-[#6E655A] font-light leading-relaxed">
            Biological rhythms and intimate personal entries require re-authentication. Auto-locks after 15 minutes of inactivity.
          </p>
          <div className="pt-2 flex items-center justify-between text-xs">
            {status?.isSensitiveUnlocked ? (
              <button
                onClick={handleLockSensitive}
                className="px-3 py-1.5 rounded-lg bg-[#FAF8F4] border border-[#DDD4C5] text-[11px] font-medium text-[#7A2A2A] hover:bg-[#FDF2F0] transition cursor-pointer"
              >
                Lock Sanctuary Now
              </button>
            ) : (
              <button
                onClick={handleUnlockSensitiveWithPasskey}
                className="px-3 py-1.5 rounded-lg bg-[#2C2825] text-[#F9F7F2] text-[11px] font-medium hover:bg-[#433D37] transition cursor-pointer"
              >
                Unlock with Biometrics
              </button>
            )}
            <span className="text-[10px] text-[#8C8377]">
              {status?.isSensitiveUnlocked ? 'Currently Unlocked' : 'Protected / Locked'}
            </span>
          </div>
        </div>

        {/* Level 3 Card */}
        <div className="p-5 rounded-2xl border border-[#E3D9C9] bg-[#FFFFFF] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#8C8377] font-semibold">
              Level 3: Step-Up Auth
            </span>
            <ShieldAlert className="w-4 h-4 text-[#9E5D2A]" />
          </div>
          <h3 className="font-serif text-base font-medium text-[#2C2825]">Critical Operations</h3>
          <p className="text-[11px] text-[#6E655A] font-light leading-relaxed">
            Data destruction, exporting records, rotating passkeys, or altering AI permissions requires re-verifying biometric or TOTP identity.
          </p>
          <div className="pt-2 flex items-center justify-between text-xs">
            <span className="text-[11px] font-medium text-[#2C2825]">
              {status?.isStepUpActive ? 'Elevated (Active)' : 'Standard Elevation'}
            </span>
            {!status?.isStepUpActive && (
              <button
                onClick={() =>
                  requireStepUp(() => {}, 'Pre-Authorize Elevated Session', 'Enables 10 minutes of uninterrupted administrative configuration.')
                }
                className="px-3 py-1.5 rounded-lg border border-[#DDD4C5] bg-[#FAF8F4] text-[11px] font-medium text-[#2C2825] hover:bg-[#EFE9DD] transition cursor-pointer"
              >
                Elevate Now
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Passkeys & Biometric Hardware Enclave */}
      <div className="p-6 rounded-3xl border border-[#E8E1D4] bg-[#FFFFFF] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F0EAE0]">
          <div>
            <div className="flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-[#7E694E]" />
              <h3 className="font-serif text-lg font-medium text-[#2C2825]">
                Passkeys (FIDO2 / WebAuthn)
              </h3>
            </div>
            <p className="text-xs text-[#7A7167] mt-1 font-light">
              Register hardware-backed platform authenticators (Touch ID, Face ID, Android Biometrics, Windows Hello, or device PIN).
            </p>
          </div>

          <form onSubmit={handleStartPasskeyRegistration} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. My MacBook Pro Touch ID"
              value={newPasskeyName}
              onChange={(e) => setNewPasskeyName(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#DDD5C7] focus:outline-none focus:border-[#7E694E] w-48"
            />
            <button
              type="submit"
              disabled={isRegisteringPasskey}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2C2825] text-[#F9F7F2] text-xs font-medium hover:bg-[#433D37] transition cursor-pointer disabled:opacity-50"
            >
              {isRegisteringPasskey ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Fingerprint className="w-3.5 h-3.5 text-[#C5A880]" />
              )}
              <span>Add Passkey</span>
            </button>
          </form>
        </div>

        {/* Biometrics Zero-Storage Architecture Notice */}
        <div className="p-4 rounded-2xl bg-[#FAF8F4] border border-[#E3D9C9] text-xs flex items-start gap-3">
          <Shield className="w-5 h-5 text-[#7E694E] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-[#2C2825]">Zero Biometric Storage Guarantee</h4>
            <p className="text-[11px] text-[#6A6054] font-light leading-relaxed">
              P & M Alchemy does not, and cannot, store your fingerprints or facial scans. Biometrics are processed solely by your device's hardware Secure Enclave or TPM. Only cryptographic challenge signatures leave the device.
            </p>
          </div>
        </div>

        {/* Embedded Iframe Preview Notice */}
        {(webAuthnCap?.isPolicyBlocked || webAuthnCap?.isInIframe) && (
          <div className="p-4 rounded-2xl bg-[#FAF5ED] border border-[#E8DFD0] text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium text-[#7E694E]">
                <Shield className="w-4 h-4" />
                <span>Embedded Sandbox Environment</span>
              </div>
              <a
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#2C2825] underline hover:text-[#7E694E]"
              >
                <span>Open in New Tab for Hardware Biometrics</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-[11px] text-[#6E6457] font-light leading-relaxed">
              Browser security policies restrict device biometric authentication (Touch ID, Face ID, Windows Hello) inside cross-origin iframe previews. In this preview frame, you can test elevated authentication using the <strong>TOTP Authenticator</strong> or <strong>Single-Use Recovery Codes</strong> (sandbox code: <code className="font-mono bg-[#EAE3D5] px-1 py-0.5 rounded">PMAL-DEMO-2026</code>). Open the app in a new browser tab to experience direct hardware biometric sensor prompts.
            </p>
          </div>
        )}

        {/* Enrolled Passkeys List */}
        <div className="space-y-3">
          <span className="text-[11px] uppercase tracking-wider text-[#8A8175] font-semibold block">
            Registered Platform Passkeys ({passkeys.length})
          </span>

          {passkeys.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed border-[#DDD4C5] text-center text-xs text-[#8C8377] space-y-1">
              <p>No platform passkeys registered yet.</p>
              <p className="text-[11px] text-[#A3998D]">
                Add a passkey above to enable seamless fingerprint or facial unlock on this device.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {passkeys.map((pk) => (
                <div
                  key={pk.id}
                  className="p-4 rounded-2xl border border-[#E8E1D4] bg-[#FAF8F4] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#EDE6D8] flex items-center justify-center text-[#7E694E]">
                      <Fingerprint className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[#2C2825]">{pk.nickname}</h4>
                      <p className="text-[10px] text-[#8C8377]">
                        Added {new Date(pk.createdAt).toLocaleDateString()} • Last active {new Date(pk.lastUsedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeletePasskey(pk.id)}
                    className="p-1.5 rounded-lg text-[#8C8377] hover:text-[#9E362A] hover:bg-[#FDF2F0] transition cursor-pointer"
                    title="Delete Passkey"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Secondary Authenticator (TOTP) & One-Time Recovery Codes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TOTP Authenticator */}
        <div className="p-6 rounded-3xl border border-[#E8E1D4] bg-[#FFFFFF] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE0]">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#7E694E]" />
              <div>
                <h3 className="font-serif text-base font-medium text-[#2C2825]">
                  Authenticator App (TOTP)
                </h3>
                <p className="text-[11px] text-[#7A7167]">RFC 6238 time-based one-time code</p>
              </div>
            </div>

            <span
              className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${
                status?.totpEnabled
                  ? 'bg-[#EFF5EE] text-[#2F562B] border border-[#CADDC7]'
                  : 'bg-[#F2ECE1] text-[#7A7167]'
              }`}
            >
              {status?.totpEnabled ? 'Active / Configured' : 'Not Configured'}
            </span>
          </div>

          <p className="text-xs text-[#6A6054] font-light leading-relaxed">
            Secondary authentication and recovery method using Google Authenticator, 1Password, or Authy. No SMS is ever used.
          </p>

          {!status?.totpEnabled && !isSettingUpTotp && (
            <button
              onClick={handleInitTotpSetup}
              className="w-full py-2.5 rounded-xl bg-[#2C2825] text-[#F9F7F2] text-xs font-medium hover:bg-[#433D37] transition cursor-pointer shadow-xs"
            >
              Configure TOTP Authenticator
            </button>
          )}

          {/* Active TOTP Controls */}
          {status?.totpEnabled && !isSettingUpTotp && (
            <div className="p-4 rounded-2xl bg-[#FAF8F4] border border-[#E8E1D4] flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-[#2F562B]">
                <CheckCircle2 className="w-4 h-4 text-[#3A6B35]" />
                <span>Authenticator paired & ready</span>
              </div>
              <button
                onClick={handleDisableTotp}
                className="text-xs text-[#9E362A] hover:underline cursor-pointer"
              >
                Disable (Requires Step-Up)
              </button>
            </div>
          )}

          {/* TOTP Setup Form */}
          {isSettingUpTotp && totpSetupData && (
            <form onSubmit={handleVerifyTotpSetup} className="p-4 rounded-2xl bg-[#FAF8F4] border border-[#E3D8C6] space-y-3">
              <span className="text-xs font-semibold text-[#2C2825] block">
                1. Add to Authenticator App
              </span>
              <div className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] font-mono text-xs break-all flex items-center justify-between">
                <span>{totpSetupData.secret}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(totpSetupData.secret);
                    setIsTotpCopied(true);
                    setTimeout(() => setIsTotpCopied(false), 2000);
                  }}
                  className="p-1 rounded-md text-[#7E694E] hover:bg-[#F2ECE1] transition cursor-pointer"
                  title="Copy secret key"
                >
                  {isTotpCopied ? <Check className="w-4 h-4 text-[#3A6B35]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <span className="text-xs font-semibold text-[#2C2825] block pt-1">
                2. Enter 6-digit confirmation code
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={totpVerifyCode}
                  onChange={(e) => setTotpVerifyCode(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-[#FFFFFF] border border-[#D5CCBE] text-center font-mono text-base tracking-widest focus:outline-none focus:border-[#7E694E]"
                />
                <button
                  type="submit"
                  disabled={totpVerifyCode.length !== 6}
                  className="px-4 py-1.5 rounded-xl bg-[#2C2825] text-[#F9F7F2] text-xs font-medium hover:bg-[#433D37] transition cursor-pointer disabled:opacity-50"
                >
                  Verify & Save
                </button>
              </div>
            </form>
          )}
        </div>

        {/* One-Time Recovery Codes */}
        <div className="p-6 rounded-3xl border border-[#E8E1D4] bg-[#FFFFFF] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE0]">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#7E694E]" />
              <div>
                <h3 className="font-serif text-base font-medium text-[#2C2825]">
                  One-Time Recovery Codes
                </h3>
                <p className="text-[11px] text-[#7A7167]">Cryptographic emergency access</p>
              </div>
            </div>

            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-[#FAF6EE] border border-[#DDD3C1] text-[#5D4E37]">
              {status?.recoveryCodesRemaining || 0} of {status?.recoveryCodesTotal || 8} Left
            </span>
          </div>

          <p className="text-xs text-[#6A6054] font-light leading-relaxed">
            Emergency backup codes. Each code can be consumed exactly once if your biometric hardware is unavailable.
          </p>

          <button
            onClick={handleRegenerateRecoveryCodes}
            className="w-full py-2.5 rounded-xl border border-[#DDD4C5] bg-[#FAF8F4] text-[#2C2825] text-xs font-medium hover:bg-[#EFE9DD] transition cursor-pointer shadow-xs"
          >
            Regenerate Recovery Codes (Requires Step-Up)
          </button>

          {newRecoveryCodes && (
            <div className="p-4 rounded-2xl bg-[#FAF8F4] border border-[#D5CBB8] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#2C2825]">
                  Your New Master Recovery Codes:
                </span>
                <button
                  onClick={() => {
                    const text = newRecoveryCodes.join('\n');
                    navigator.clipboard.writeText(text);
                    setNotificationMsg({ type: 'success', text: 'Recovery codes copied to clipboard.' });
                  }}
                  className="text-[10px] font-medium text-[#7E694E] underline cursor-pointer"
                >
                  Copy All
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px] text-[#3E3730]">
                {newRecoveryCodes.map((c, i) => (
                  <div key={i} className="p-1 rounded bg-[#FFFFFF] border border-[#E3D8C6] text-center">
                    {c}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 4: Active Devices & Session Management */}
      <div className="p-6 rounded-3xl border border-[#E8E1D4] bg-[#FFFFFF] shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F0EAE0]">
          <div>
            <div className="flex items-center gap-2">
              <Laptop className="w-5 h-5 text-[#7E694E]" />
              <h3 className="font-serif text-lg font-medium text-[#2C2825]">
                Active Sessions & Connected Devices
              </h3>
            </div>
            <p className="text-xs text-[#7A7167] mt-1 font-light">
              Audit current active HTTP-only secure cookie sessions across desktop and mobile browsers.
            </p>
          </div>

          <button
            onClick={handleRevokeAllOthers}
            className="text-xs text-[#9E362A] hover:underline cursor-pointer self-start sm:self-auto"
          >
            Revoke All Other Sessions
          </button>
        </div>

        <div className="space-y-2.5">
          {sessions.map((s) => (
            <div
              key={s.id}
              className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
                s.isCurrent
                  ? 'bg-[#FAF8F4] border-[#D5CBB8]'
                  : 'bg-[#FFFFFF] border-[#E8E1D4]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#EDE6D8] flex items-center justify-center text-[#7E694E]">
                  {/mobile|android|iphone/i.test(s.deviceName) ? (
                    <Smartphone className="w-4 h-4" />
                  ) : (
                    <Laptop className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-[#2C2825]">{s.deviceName}</span>
                    {s.isCurrent && (
                      <span className="px-2 py-0.5 rounded-full bg-[#E7EFE6] text-[#36592F] text-[9px] font-semibold uppercase tracking-wider">
                        Current Session
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#8C8377] mt-0.5">
                    IP: {s.ip} • Last active {new Date(s.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Created {new Date(s.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {!s.isCurrent && (
                <button
                  onClick={() => handleRevokeSession(s.id)}
                  className="px-3 py-1 rounded-lg border border-[#DDD4C5] bg-[#FFFFFF] text-[11px] text-[#9E362A] hover:bg-[#FDF2F0] transition cursor-pointer"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section 5: AI Privacy Firewall & Granular Permissions */}
      <div className="p-6 rounded-3xl border border-[#E8E1D4] bg-[#FFFFFF] shadow-xs space-y-6">
        <div className="pb-3 border-b border-[#F0EAE0]">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#7E694E]" />
            <h3 className="font-serif text-lg font-medium text-[#2C2825]">
              AI Data Firewall & Privacy Controls
            </h3>
          </div>
          <p className="text-xs text-[#7A7167] mt-1 font-light">
            Strict server-side policy enforcement. Control exactly what the AI assistant is permitted to inspect, synthesize, or suggest.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cycle Firewall Toggle */}
          <div className="p-4 rounded-2xl border border-[#E3D9C9] bg-[#FAF8F4] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#2C2825]">
                Cycle Intelligence AI Firewall
              </span>
              <button
                type="button"
                onClick={() =>
                  handleUpdatePermission('allowCycleDataToAI', !status?.permissions.allowCycleDataToAI)
                }
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition cursor-pointer ${
                  status?.permissions.allowCycleDataToAI
                    ? 'bg-[#2C2825] text-[#F9F7F2]'
                    : 'bg-[#EAE4D8] text-[#6A6054]'
                }`}
              >
                {status?.permissions.allowCycleDataToAI ? 'Authorized for AI' : 'Strictly Quarantined (Default)'}
              </button>
            </div>
            <p className="text-[11px] text-[#6E655A] font-light leading-relaxed">
              When Quarantined, cycle markers, follicular/luteal phases, and symptoms are stripped on the server before AI context is formed.
            </p>
          </div>

          {/* AI Task Creation */}
          <div className="p-4 rounded-2xl border border-[#E3D9C9] bg-[#FAF8F4] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#2C2825]">
                AI May Propose Tasks
              </span>
              <button
                type="button"
                onClick={() =>
                  handleUpdatePermission('aiMayCreateTasks', !status?.permissions.aiMayCreateTasks)
                }
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition cursor-pointer ${
                  status?.permissions.aiMayCreateTasks
                    ? 'bg-[#2C2825] text-[#F9F7F2]'
                    : 'bg-[#EAE4D8] text-[#6A6054]'
                }`}
              >
                {status?.permissions.aiMayCreateTasks ? 'Allowed (As Proposals)' : 'Disabled'}
              </button>
            </div>
            <p className="text-[11px] text-[#6E655A] font-light leading-relaxed">
              AI assistant proposes structured tasks during brainstorming. Tasks still require your approval before persisting.
            </p>
          </div>

          {/* Personal vs Business Isolation */}
          <div className="p-4 rounded-2xl border border-[#E3D9C9] bg-[#FAF8F4] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#2C2825]">
                AI Access: Personal Domain
              </span>
              <input
                type="checkbox"
                checked={status?.permissions.allowPersonalDataToAI ?? true}
                onChange={(e) => handleUpdatePermission('allowPersonalDataToAI', e.target.checked)}
                className="accent-[#7E694E] w-4 h-4 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-[#6E655A] font-light leading-relaxed">
              Allow assistant to read personal routines and lifestyle pacing goals.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-[#E3D9C9] bg-[#FAF8F4] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#2C2825]">
                AI Access: Mariluna Business Domain
              </span>
              <input
                type="checkbox"
                checked={status?.permissions.allowMarilunaDataToAI ?? true}
                onChange={(e) => handleUpdatePermission('allowMarilunaDataToAI', e.target.checked)}
                className="accent-[#7E694E] w-4 h-4 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-[#6E655A] font-light leading-relaxed">
              Allow assistant to strategize on Mariluna studio clients, revenue goals, and content plans.
            </p>
          </div>
        </div>

        {/* Non-Negotiable Core Rule */}
        <div className="p-3.5 rounded-2xl bg-[#F4EFE6] border border-[#DDD3C1] text-xs text-[#5D4E37] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#7E694E]" />
            <span>AI Confirmation Before Destructive Actions: <strong>ALWAYS ENFORCED</strong></span>
          </div>
          <span className="text-[10px] uppercase font-semibold text-[#7E694E]">Immutable Policy</span>
        </div>
      </div>

      {/* Section 6: Connected Services & Granular Scopes */}
      <div className="p-6 rounded-3xl border border-[#E8E1D4] bg-[#FFFFFF] shadow-xs space-y-4">
        <div className="pb-3 border-b border-[#F0EAE0]">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#7E694E]" />
            <h3 className="font-serif text-lg font-medium text-[#2C2825]">
              Connected Services & Granular Permissions
            </h3>
          </div>
          <p className="text-xs text-[#7A7167] mt-1 font-light">
            Granular privilege separation. Read permissions are strictly isolated from Write permissions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl border border-[#E3D9C9] bg-[#FAF8F4] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#2C2825]">Google Calendar: Read Access</span>
              <input
                type="checkbox"
                checked={status?.permissions.calendarRead ?? true}
                onChange={(e) => handleUpdatePermission('calendarRead', e.target.checked)}
                className="accent-[#7E694E] w-4 h-4 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-[#6E655A] font-light leading-relaxed">
              Allows the assistant to inspect calendar events to prevent overbooking and protect your 16:30 working limit.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-[#E3D9C9] bg-[#FAF8F4] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#2C2825]">Google Calendar: Write Access</span>
              <input
                type="checkbox"
                checked={status?.permissions.calendarWrite ?? false}
                onChange={(e) => handleUpdatePermission('calendarWrite', e.target.checked)}
                className="accent-[#7E694E] w-4 h-4 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-[#6E655A] font-light leading-relaxed">
              Allows the assistant to directly schedule calendar holds or reschedule events upon user confirmation. Requires Step-Up to enable.
            </p>
          </div>
        </div>
      </div>

      {/* Section 7: Memory Sovereignty & Management */}
      <div className="p-6 rounded-3xl border border-[#E8E1D4] bg-[#FFFFFF] shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F0EAE0]">
          <div>
            <h3 className="font-serif text-lg font-medium text-[#2C2825]">
              AI Memory Sovereignty & Review
            </h3>
            <p className="text-xs text-[#7A7167] mt-1 font-light">
              Transparent review of facts, preferences, and guidelines learned by your assistant.
            </p>
          </div>

          <button
            onClick={() => {
              requireStepUp(
                onClearAllMemories,
                'Purge All AI Memory',
                'Permanently erases all learned context and preferences. Requires Level 3 Step-Up authentication.'
              );
            }}
            className="text-xs text-[#9E362A] hover:underline cursor-pointer self-start sm:self-auto"
          >
            Purge All Memory
          </button>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {memories.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#8C8377]">
              No active memory items recorded.
            </div>
          ) : (
            memories.map((m) => (
              <div
                key={m.id}
                className="p-3 rounded-xl border border-[#EAE4D8] bg-[#FAF8F4] flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-medium text-[#2C2825]">{m.content}</span>
                  <div className="flex items-center gap-2 text-[10px] text-[#8C8377] mt-0.5">
                    <span className="uppercase font-semibold text-[#7E694E]">{m.realm}</span>
                    <span>•</span>
                    <span>{m.category}</span>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteMemory(m.id)}
                  className="p-1 text-[#8C8377] hover:text-[#9E362A] transition cursor-pointer"
                  title="Forget Memory"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Section 8: Data Sovereignty, Complete Export & Wipe */}
      <div className="p-6 rounded-3xl border border-[#E8E1D4] bg-[#FFFFFF] shadow-xs space-y-6">
        <div className="pb-3 border-b border-[#F0EAE0]">
          <h3 className="font-serif text-lg font-medium text-[#2C2825]">
            Data Sovereignty & Permanent Destruction
          </h3>
          <p className="text-xs text-[#7A7167] mt-1 font-light">
            You maintain 100% ownership of your life and business data. Export a complete archive or purge all records permanently.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => {
              requireStepUp(
                onExportCompleteData,
                'Export Complete Sovereign Archive',
                'Generates an authenticated, complete JSON snapshot of all modules, goals, cycle entries, and business records.'
              );
            }}
            className="flex items-center justify-center gap-2 p-4 rounded-2xl border border-[#DDD4C5] bg-[#FAF8F4] hover:bg-[#EFE9DD] transition text-xs font-medium text-[#2C2825] cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4 text-[#7E694E]" />
            <span>Export Complete Archive (JSON)</span>
          </button>

          <div className="p-4 rounded-2xl border border-[#F3C7C0] bg-[#FDF5F4] space-y-3">
            <span className="text-xs font-semibold text-[#9E362A] block">
              Permanent Data Destruction (Level 3 Step-Up)
            </span>
            <p className="text-[11px] text-[#7A4036] font-light leading-relaxed">
              Type <strong className="font-mono text-[#9E362A]">DELETE ALL MY DATA PERMANENTLY</strong> to wipe both local and server data.
            </p>
            <div className="space-y-2">
              <input
                type="text"
                value={deletePhrase}
                onChange={(e) => setDeletePhrase(e.target.value)}
                placeholder="DELETE ALL MY DATA PERMANENTLY"
                className="w-full text-xs font-mono p-2 rounded-xl bg-[#FFFFFF] border border-[#F3C7C0] focus:outline-none focus:border-[#9E362A]"
              />
              <button
                type="button"
                disabled={deletePhrase !== 'DELETE ALL MY DATA PERMANENTLY' || isDeletingData}
                onClick={handlePermanentDelete}
                className="w-full py-2 rounded-xl bg-[#9E362A] text-[#FFFFFF] text-xs font-medium hover:bg-[#85281D] transition cursor-pointer disabled:opacity-40"
              >
                Permanently Destroy All Records
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 9: Architectural Roadmap & Enterprise Requirements */}
      <div className="p-6 rounded-3xl border border-[#DDD4C5] bg-[#FAF8F4] shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-[#7E694E]">
          <Server className="w-5 h-5" />
          <h3 className="font-serif text-base font-medium text-[#2C2825]">
            Architectural Disclosure & Infrastructure Roadmap
          </h3>
        </div>
        <p className="text-xs text-[#5A5044] leading-relaxed font-light">
          Current Architecture: Single-User Personal AI Operating System with FIDO2/WebAuthn platform authenticators, Node/Express server vault, HTTP-only SameSite cookies, in-memory challenge maps, and rate-limiting lockout protection.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-[11px] text-[#655A4E]">
          <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E3D8C6] space-y-1">
            <span className="font-semibold text-[#2C2825] block">Implemented In Current Build:</span>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>WebAuthn/Passkey registration and authentication.</li>
              <li>TOTP RFC 6238 generation and verification.</li>
              <li>SHA-256 hashed one-time recovery codes.</li>
              <li>3-tier security classification (Normal, Sanctuary, Step-Up).</li>
              <li>Server-side AI context filtering and cycle isolation.</li>
            </ul>
          </div>

          <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E3D8C6] space-y-1">
            <span className="font-semibold text-[#2C2825] block">Required For Enterprise / Multi-Region Scale:</span>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Google Cloud KMS (Key Management Service) for envelope encryption of persisted vaults.</li>
              <li>Hardware Security Module (FIPS 140-2 Level 3 HSM).</li>
              <li>Distributed Redis cluster for cross-region session revocations.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Step-Up Authentication Modal */}
      <StepUpAuthModal
        isOpen={isStepUpOpen}
        onClose={() => {
          setIsStepUpOpen(false);
          setPendingAction(null);
        }}
        onSuccess={handleStepUpSuccess}
        actionTitle={stepUpTitle}
        actionDescription={stepUpDesc}
        securityLevel={stepUpLevel}
      />
    </div>
  );
};
