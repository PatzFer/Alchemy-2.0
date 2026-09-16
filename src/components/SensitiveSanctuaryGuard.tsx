import React, { useState } from 'react';
import { Shield, Lock, Fingerprint, KeyRound, Unlock, Clock, AlertCircle } from 'lucide-react';
import { StepUpAuthModal } from './StepUpAuthModal';

interface SensitiveSanctuaryGuardProps {
  isUnlocked: boolean;
  remainingSeconds: number;
  onLock: () => void;
  onUnlockSuccess: () => void;
  children: React.ReactNode;
  domainName?: string;
  domainDescription?: string;
}

export const SensitiveSanctuaryGuard: React.FC<SensitiveSanctuaryGuardProps> = ({
  isUnlocked,
  remainingSeconds,
  onLock,
  onUnlockSuccess,
  children,
  domainName = 'Personal Sanctuary & Cycle Intelligence',
  domainDescription = 'Biological rhythms and intimate personal reflections are classified as Level 2 Sensitive Personal Data. Re-authentication is required to access.',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!isUnlocked) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
        <div className="rounded-3xl border border-[#DDD4C5] bg-[#FFFFFF] p-8 sm:p-12 text-center shadow-xs space-y-6 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-[#F4EFE6] border border-[#E3D8C6] flex items-center justify-center mx-auto text-[#7E694E]">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-widest px-3 py-1 rounded-full bg-[#EFE9DD] text-[#6C5E4B] font-semibold">
              Level 2 Protected Sanctuary
            </span>
            <h2 className="font-serif text-2xl font-medium text-[#2C2825] pt-1">
              {domainName}
            </h2>
            <p className="text-xs text-[#6C6358] font-light leading-relaxed max-w-md mx-auto">
              {domainDescription}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF8F4] border border-[#E8E1D5] text-left text-xs space-y-2">
            <div className="flex items-center gap-2 font-medium text-[#2C2825]">
              <Shield className="w-4 h-4 text-[#7E694E]" />
              <span>Architectural Privacy Guarantee</span>
            </div>
            <p className="text-[11px] text-[#6E655A] font-light leading-relaxed">
              Cycle markers and intimate personal notes stay quarantined within the Personal domain. They are never blended into business outputs or sent to external AI providers without your explicit authorization.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#2C2825] text-[#F9F7F2] text-xs font-medium hover:bg-[#433D37] transition cursor-pointer shadow-xs"
            >
              <Fingerprint className="w-4 h-4 text-[#C5A880]" />
              <span>Unlock Sanctuary with Passkey / TOTP</span>
            </button>
          </div>
        </div>

        <StepUpAuthModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={onUnlockSuccess}
          securityLevel={2}
          actionTitle="Sensitive Personal Sanctuary Access"
          actionDescription="Authenticate with your device biometric passkey, TOTP app, or one-time recovery code to open your sensitive personal sanctuary."
        />
      </div>
    );
  }

  // When unlocked, show banner with unhurried countdown and lock button
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="space-y-4">
      {/* Sanctuary Status Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between px-4 py-2 rounded-2xl bg-[#F4EFE6] border border-[#E2D8C6] text-xs">
          <div className="flex items-center gap-2 text-[#5E5244]">
            <Unlock className="w-3.5 h-3.5 text-[#3A6B35]" />
            <span className="font-medium text-[#2C2825]">Personal Sanctuary Unlocked</span>
            <span className="text-[#7A7167] hidden sm:inline">
              (Auto-locks in {timeFormatted})
            </span>
          </div>

          <button
            onClick={onLock}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FFFFFF] border border-[#DDD4C5] text-[11px] font-medium text-[#2C2825] hover:bg-[#EBE4D7] transition cursor-pointer shadow-2xs"
          >
            <Lock className="w-3 h-3 text-[#7E694E]" />
            <span>Lock Now</span>
          </button>
        </div>
      </div>

      {children}
    </div>
  );
};
