import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-4 left-4 z-50 flex items-center gap-2 rounded-full border border-[#D8C29D] bg-[#FDF9F0] px-3.5 py-1.5 text-xs font-medium text-[#735A33] shadow-md animate-fade-in">
      <WifiOff className="w-3.5 h-3.5 text-[#A67C43]" />
      <span>Offline Mode — Operating seamlessly from local memory</span>
    </div>
  );
};
