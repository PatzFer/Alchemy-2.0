import React, { useState } from 'react';
import { Download, Share2, X } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        id="pwa-install-button"
        className="flex items-center gap-2 rounded-full border border-[#D5CCBF] bg-[#F4EFE6] px-3.5 py-1.5 text-xs font-medium text-[#4A433B] shadow-xs hover:bg-[#EAE4D8] hover:border-[#C4B9A7] transition-all cursor-pointer"
        title="Install Mariluna OS as web application"
      >
        <Download className="w-3.5 h-3.5 text-[#8C7654]" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          id="pwa-ios-button"
          className="flex items-center gap-1.5 rounded-full border border-[#D5CCBF] bg-[#F4EFE6] px-3 py-1.5 text-xs font-medium text-[#4A433B] hover:bg-[#EAE4D8] transition-all cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5 text-[#8C7654]" />
          <span>Install PWA</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1816]/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#FBF9F5] border border-[#E3DCD0] p-6 shadow-xl text-[#2C2825]">
              <div className="flex items-center justify-between pb-3 border-b border-[#EBE5DA]">
                <h3 className="font-serif text-lg font-medium text-[#2C2825]">Add to Home Screen</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-full text-[#7E756C] hover:text-[#2C2825] hover:bg-[#ECE6DA]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-4 text-xs text-[#5A524A] leading-relaxed">
                Enjoy Mariluna OS as a full-screen, responsive personal operating system:
              </p>
              <ol className="mt-3 space-y-2 text-xs text-[#3E3832]">
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-[#8C7654]">1.</span>
                  <span>Tap the <strong>Share</strong> button at the bottom of Safari.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-[#8C7654]">2.</span>
                  <span>Scroll down and select <strong>Add to Home Screen</strong>.</span>
                </li>
              </ol>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-[#2C2825] py-2 text-xs font-medium text-[#F9F7F2] hover:bg-[#433D37] transition"
              >
                Understood
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
