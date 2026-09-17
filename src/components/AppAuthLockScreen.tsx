import React, { useState, useEffect } from 'react';
import {
  Shield,
  Fingerprint,
  Lock,
  KeyRound,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { authenticateWithPasskey, checkWebAuthnCapability } from '../lib/webauthnClient';

interface AppAuthLockScreenProps {
  onAuthenticated: () => void;
  inactivityLocked?: boolean;
}

export const AppAuthLockScreen: React.FC<AppAuthLockScreenProps> = ({
  onAuthenticated,
  inactivityLocked = false,
}) => {
  const [authMethod, setAuthMethod] = useState<'passkey' | 'totp' | 'recovery'>('passkey');
  const [totpCode, setTotpCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState<number | null>(null);
  const [webAuthnCap, setWebAuthnCap] = useState<{
    supported: boolean;
    isPolicyBlocked: boolean;
    isInIframe: boolean;
  } | null>(null);
  const [passkeyCount, setPasskeyCount] = useState<number>(0);
  const [totpConfigured, setTotpConfigured] = useState<boolean>(false);

  useEffect(() => {
    checkWebAuthnCapability().then(setWebAuthnCap);

    // Fetch security status to know if passkeys or TOTP are configured
    fetch('/api/auth/status')
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setPasskeyCount(data.passkeyCount || 0);
          setTotpConfigured(!!data.totpEnabled);
          // If no passkeys and in iframe, default to recovery/demo
          if (data.passkeyCount === 0 && window.self !== window.top) {
            setAuthMethod('recovery');
          }
        }
      })
      .catch(() => {});
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (!lockoutSeconds || lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => (prev && prev > 1 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const handlePasskeyAuth = async () => {
    if (lockoutSeconds) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await authenticateWithPasskey();
      if (res.success) {
        onAuthenticated();
      } else {
        setErrorMessage(res.error || 'Biometric authentication was not completed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Passkey authentication error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds) return;
    setIsLoading(true);
    setErrorMessage(null);

    const payload =
      authMethod === 'totp'
        ? { method: 'totp', credential: totpCode.trim() }
        : { method: 'recovery_code', credential: recoveryCode.trim().toUpperCase() };

    try {
      const res = await fetch('/api/auth/unlock-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTotpCode('');
        setRecoveryCode('');
        onAuthenticated();
      } else {
        if (data.locked) {
          setLockoutSeconds(data.remainingLockoutSeconds || 900);
        }
        setErrorMessage(data.error || 'Authentication credential could not be verified.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to communicate with security authority.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoUnlock = () => {
    setRecoveryCode('PMAL-DEMO-2026');
    setAuthMethod('recovery');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] flex flex-col justify-center items-center p-4 sm:p-6 text-[#2C2825] selection:bg-[#EAE3D5]">
      {/* Container */}
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-[#D8CFC1] bg-[#F4EFE6] shadow-xs mb-1">
            <span className="font-serif text-sm font-semibold text-[#7E694E] tracking-tighter">
              P&M
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl tracking-[0.2em] uppercase font-medium text-[#2C2825]">
            ALCHEMY
          </h1>
          <p className="text-xs text-[#7A7167] font-light tracking-wide uppercase">
            Personal Operating System • Sovereign Sanctuary
          </p>
        </div>

        {/* Security Card */}
        <div className="rounded-3xl bg-[#FFFFFF] border border-[#E3D8C6] shadow-sm p-6 sm:p-7 space-y-5">
          {/* Status Badge */}
          <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE0]">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#7E694E]" />
              <span className="text-xs font-semibold text-[#2C2825]">
                {inactivityLocked ? 'Session Inactivity Lock' : 'Perimeter Authentication'}
              </span>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#F3ECE1] text-[#6D5D48] font-medium">
              Hardware Enclave
            </span>
          </div>

          <p className="text-xs text-[#6C6358] font-light leading-relaxed">
            {inactivityLocked
              ? 'Your Alchemy session locked after inactivity. Verify identity to resume free navigation across all modules.'
              : 'Alchemy is protected by perimeter device authentication. Once unlocked, all modules—including Wellbeing, Cycle, and Mariluna—are freely accessible.'}
          </p>

          {/* Lockout Warning */}
          {lockoutSeconds !== null && (
            <div className="p-3.5 rounded-2xl bg-[#FDF2F0] border border-[#F3C7C0] text-xs text-[#9E362A] flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                Rate limit protection active. Please wait <strong>{lockoutSeconds}s</strong> before retry.
              </span>
            </div>
          )}

          {/* Authentication Method Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#F5EFE4] border border-[#E2D8C6] text-xs">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('passkey');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl font-medium transition cursor-pointer ${
                authMethod === 'passkey'
                  ? 'bg-[#FFFFFF] text-[#2C2825] shadow-xs'
                  : 'text-[#756C60] hover:text-[#2C2825]'
              }`}
            >
              <Fingerprint className="w-3.5 h-3.5 text-[#7E694E]" />
              <span>Passkey</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('totp');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl font-medium transition cursor-pointer ${
                authMethod === 'totp'
                  ? 'bg-[#FFFFFF] text-[#2C2825] shadow-xs'
                  : 'text-[#756C60] hover:text-[#2C2825]'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-[#7E694E]" />
              <span>TOTP</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('recovery');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl font-medium transition cursor-pointer ${
                authMethod === 'recovery'
                  ? 'bg-[#FFFFFF] text-[#2C2825] shadow-xs'
                  : 'text-[#756C60] hover:text-[#2C2825]'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-[#7E694E]" />
              <span>Recovery</span>
            </button>
          </div>

          {/* Method 1: Passkey / Biometrics */}
          {authMethod === 'passkey' && (
            <div className="space-y-4 pt-1">
              {webAuthnCap?.isPolicyBlocked || webAuthnCap?.isInIframe ? (
                <div className="p-3.5 rounded-2xl bg-[#FAF5EC] border border-[#E5DBCA] text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#7E694E]">Embedded Sandbox Frame</span>
                    <a
                      href={window.location.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-[#2C2825] underline hover:text-[#7E694E]"
                    >
                      <span>Open in New Tab</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-[11px] text-[#706659] leading-relaxed font-light">
                    Direct hardware biometric sensors (Touch ID / Face ID) require top-level window privileges. In this preview frame, you can instantly unlock with a <strong>Recovery Code</strong> or open in a new tab.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-[#FAF8F4] border border-[#EAE3D4] text-[11px] text-[#6E6458] font-light">
                  Hardware biometric authentication with Touch ID, Face ID, Windows Hello, or Android Biometrics.
                </div>
              )}

              <button
                type="button"
                disabled={isLoading || lockoutSeconds !== null}
                onClick={handlePasskeyAuth}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#2C2825] text-[#F9F7F2] text-xs font-medium hover:bg-[#433D37] transition cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-[#C5A880]" />
                ) : (
                  <Fingerprint className="w-4 h-4 text-[#C5A880]" />
                )}
                <span>Unlock with Biometric Passkey</span>
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleDemoUnlock}
                  className="text-[11px] text-[#7E694E] hover:underline cursor-pointer"
                >
                  Quick unlock using sandbox recovery key →
                </button>
              </div>
            </div>
          )}

          {/* Method 2: TOTP */}
          {authMethod === 'totp' && (
            <form onSubmit={handleCredentialSubmit} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[#686055] block">
                  6-Digit Authenticator Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  placeholder="123456"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#FAF8F4] border border-[#DDD4C5] text-center font-mono text-lg tracking-widest text-[#2C2825] focus:outline-none focus:border-[#7E694E]"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || totpCode.length !== 6 || lockoutSeconds !== null}
                className="w-full py-3 rounded-xl bg-[#2C2825] text-[#F9F7F2] text-xs font-medium hover:bg-[#433D37] transition cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isLoading ? 'Verifying Code...' : 'Verify & Unlock Alchemy'}
              </button>

              {!totpConfigured && (
                <p className="text-[10px] text-[#8C8377] text-center">
                  TOTP not yet configured? Use Passkey or Recovery Code to enter.
                </p>
              )}
            </form>
          )}

          {/* Method 3: Recovery Code */}
          {authMethod === 'recovery' && (
            <form onSubmit={handleCredentialSubmit} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[#686055] block">
                  Emergency Recovery Code
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="PMAL-XXXX-XXXX"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#FAF8F4] border border-[#DDD4C5] font-mono text-xs text-center text-[#2C2825] tracking-wider focus:outline-none focus:border-[#7E694E]"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setRecoveryCode('PMAL-DEMO-2026')}
                  className="text-[11px] text-[#7E694E] hover:underline cursor-pointer font-medium"
                >
                  Fill Sandbox Demo Code
                </button>
                <span className="text-[10px] text-[#8C8377] font-mono">PMAL-DEMO-2026</span>
              </div>

              <button
                type="submit"
                disabled={isLoading || !recoveryCode.trim() || lockoutSeconds !== null}
                className="w-full py-3 rounded-xl bg-[#2C2825] text-[#F9F7F2] text-xs font-medium hover:bg-[#433D37] transition cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isLoading ? 'Verifying...' : 'Unlock Application with Code'}
              </button>
            </form>
          )}

          {/* Error display */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-[#FDF2F0] border border-[#F3C7C0] text-xs text-[#9E362A] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer Guarantee */}
        <div className="text-center space-y-1">
          <p className="text-[11px] text-[#8C8377]">
            Zero-Storage Architecture: Biometric signatures remain strictly in your device hardware enclave.
          </p>
          <div className="flex items-center justify-center gap-4 text-[10px] text-[#9E9589] pt-1">
            <span>Client-Side Local Vault</span>
            <span>•</span>
            <span>FIDO2 / WebAuthn</span>
            <span>•</span>
            <span>Zero Remote Telemetry</span>
          </div>
        </div>
      </div>
    </div>
  );
};
