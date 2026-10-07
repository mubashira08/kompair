import React, { useEffect, useState } from 'react';

// Extend the window object to include the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export const InstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // If it's iOS and not already installed (standalone mode), show the banner
    if (isIosDevice && !window.matchMedia('(display-mode: standalone)').matches) {
      setShowBanner(true);
    }

    // Detect Android / Desktop Chrome prompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleClose = () => {
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg z-50 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex-1 text-sm text-gray-700">
        {isIOS ? (
          <p>
            To install StudyMate, tap <span className="font-bold">Share</span>{' '}
            and select <span className="font-bold">Add to Home Screen</span>.
          </p>
        ) : (
          <p>Install StudyMate on your home screen for quick access.</p>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleClose}
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Later
        </button>
        {!isIOS && deferredPrompt && (
          <button
            onClick={handleInstallClick}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Install
          </button>
        )}
      </div>
    </div>
  );
};
