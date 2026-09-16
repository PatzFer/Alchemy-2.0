import React, { useState, useEffect } from 'react';
import { Shield, Fingerprint, KeyRound, Lock, AlertCircle, X, RefreshCw, ExternalLink } from 'lucide-react';
import { authenticateWithPasskey, checkWebAuthnCapability } from '../lib/webauthnClient';

interface StepUpAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionTitle?: string;
  actionDescription?: string;
  securityLevel?: 2 | 3;
}

export const StepUpAuthModal: React.FC<StepUpAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  actionTitle = 'Elevated Security Verification',
  actionDescription = 'This critical operation requires Level 3 Step-Up Authentication to protect your data.',
  securityLevel = 3,
}) => {
  const [authMethod, setAuthMethod] = useState<'passkey' | 'totp' | 'recovery'>('recovery');
  const [totpCode, setTotpCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState<number | null>(null);
  const [isInIframe, setIsInIframe] = useState(false);
  const [canUseWebAuthn, setCanUseWebAuthn] = useState(true);

  useEffect(() => {
    if (isOpen) {
      checkWebAuthnCapability().then((cap) => {
        setIsInIframe(cap.isInIframe);
        setCanUseWebAuthn(cap.supported && !cap.isPolicyBlocked);
        // In iframe preview without passkey delegation, default to recovery or totp
        if (cap.isPolicyBlocked || cap.isInIframe) {
          setAuthMethod('recovery');
        } else {
          setAuthMethod('passkey');
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePasskeyAuth = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await authenticateWithPasskey();
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMessage(res.error || 'Passkey authentication was not completed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Passkey error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const endpoint = securityLevel === 3 ? '/api/auth/step-up' : '/api/auth/unlock-sensitive';
    const payload =
      authMethod === 'totp'
        ? { method: 'totp', credential: totpCode.trim() }
        : { method: 'recovery_code', credential: recoveryCode.trim().toUpperCase() };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTotpCode('');
        setRecoveryCode('');
        onSuccess();
        onClose();
      } else {
        if (data.locked) {
          setLockoutSeconds(data.remainingLockoutSeconds || 900);
        }
        setErrorMessage(data.error || 'Authentication verification failed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network communication error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1816]/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-3xl bg-[#FAF8F3] border border-[#DCD3C5] shadow-2xl p-6 text-[#2C2825] flex flex-col space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#EAE4D8]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#EBE3D3] flex items-center justify-center text-[#7E694E] border border-[#DDD3C1]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-medium text-[#2C2825]">
                  {securityLevel === 3 ? 'Level 3 Step-Up Verification' : 'Sensitive Data Unlock'}
                </h3>
                <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#E8DEC8] text-[#5D4E37] font-semibold">
                  Level {securityLevel}
                </span>
              </div>
              <p className="text-[11px] text-[#7A7167] mt-0.5">{actionTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#8C8377] hover:text-[#2C2825] hover:bg-[#EDE6D8] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#524B43] leading-relaxed font-light">{actionDescription}</p>

        {/* Method selector tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#EFE9DD] border border-[#DDD4C5] text-xs">
          <button
            type="button"
            onClick={() => {
              setAuthMethod('passkey');
              setErrorMessage(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              authMethod === 'passkey'
                ? 'bg-[#FFFFFF] text-[#2C2825] shadow-xs'
                : 'text-[#6C6358] hover:text-[#2C2825]'
            }`}
          >
            <Fingerprint className="w-3.5 h-3.5" />
            <span>Passkey</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod('totp');
              setErrorMessage(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              authMethod === 'totp'
                ? 'bg-[#FFFFFF] text-[#2C2825] shadow-xs'
                : 'text-[#6C6358] hover:text-[#2C2825]'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>TOTP App</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod('recovery');
              setErrorMessage(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              authMethod === 'recovery'
                ? 'bg-[#FFFFFF] text-[#2C2825] shadow-xs'
                : 'text-[#6C6358] hover:text-[#2C2825]'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Recovery</span>
          </button>
        </div>

        {/* Error / Lockout Alert */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-[#FDF2F0] border border-[#F3C7C0] text-xs text-[#9E362A] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Passkey Flow */}
        {authMethod === 'passkey' && (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E4DCD0] space-y-2 text-center">
              <div className="w-12 h-12 rounded-full bg-[#F4EFE6] text-[#7E694E] flex items-center justify-center mx-auto mb-2">
                <Fingerprint className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-semibold text-[#2C2825]">
                Hardware Biometric Authentication
              </h4>
              <p className="text-[11px] text-[#7A7167] font-light leading-relaxed">
                Unlock instantly via device Touch ID, Face ID, Android Biometrics, or Windows Hello. Biometric credentials never leave your hardware secure enclave.
              </p>

              {isInIframe && !canUseWebAuthn && (
                <div className="mt-3 p-3 rounded-xl bg-[#FAF5ED] border border-[#E8DFD0] text-left space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-[#7E694E]">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Iframe Sandbox Environment</span>
                  </div>
                  <p className="text-[11px] text-[#6E6457] leading-relaxed">
                    Browser permissions policy restricts platform biometric sensors inside embedded preview frames. Open in a new tab for native Touch ID / Face ID, or use the <strong>Recovery</strong> tab right here.
                  </p>
                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2C2825] underline hover:text-[#7E694E]"
                  >
                    <span>Open P & M Alchemy in New Tab</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={isLoading || (isInIframe && !canUseWebAuthn)}
              onClick={handlePasskeyAuth}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#2C2825] text-[#F9F7F2] text-xs font-medium hover:bg-[#433D37] transition cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Waiting for Platform Sensor...</span>
                </>
              ) : (
                <>
                  <Fingerprint className="w-4 h-4 text-[#C5A880]" />
                  <span>Authenticate with Passkey / Biometrics</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* TOTP Flow */}
        {authMethod === 'totp' && (
          <form onSubmit={handleCredentialSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#484037]">
                6-Digit Authenticator Code
              </label>
              <input
                type="text"
                pattern="[0-9]*"
                maxLength={6}
                autoFocus
                placeholder="123456"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center tracking-widest text-lg font-mono py-2 rounded-xl bg-[#FFFFFF] border border-[#D5CCBE] focus:outline-none focus:border-[#7E694E]"
              />
              <p className="text-[10px] text-[#8C8377]">
                Open Google Authenticator, Authy, or 1Password. If not set up yet, use the Recovery tab.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || totpCode.length !== 6}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#2C2825] text-[#F9F7F2] text-xs font-medium hover:bg-[#433D37] transition cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <span>Verify TOTP & Authorize</span>
              )}
            </button>
          </form>
        )}

        {/* Recovery Code Flow */}
        {authMethod === 'recovery' && (
          <form onSubmit={handleCredentialSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[#484037]">
                  Single-Use Recovery Code
                </label>
                <button
                  type="button"
                  onClick={() => setRecoveryCode('PMAL-DEMO-2026')}
                  className="text-[10px] text-[#7E694E] underline hover:text-[#2C2825] cursor-pointer"
                >
                  Fill sandbox code (PMAL-DEMO-2026)
                </button>
              </div>
              <input
                type="text"
                autoFocus
                placeholder="PMAL-XXXX-XXXX"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                className="w-full text-center tracking-wider text-sm font-mono py-2 rounded-xl bg-[#FFFFFF] border border-[#D5CCBE] focus:outline-none focus:border-[#7E694E] uppercase"
              />
              <p className="text-[10px] text-[#8C8377]">
                One of your 8 emergency backup codes. Consumed once verified.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !recoveryCode.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#2C2825] text-[#F9F7F2] text-xs font-medium hover:bg-[#433D37] transition cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <span>Verify & Consume Recovery Code</span>
              )}
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="pt-2 text-center text-[10px] text-[#8C8377] border-t border-[#EAE4D8]">
          P & M Alchemy never uses SMS for primary MFA. Zero secret keys stored in browser.
        </div>
      </div>
    </div>
  );
};
