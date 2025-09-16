import { useState, useEffect, useRef } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

interface PWAInstallationState {
  isInstalled: boolean;
  canInstall: boolean;
  isPromptDismissed: boolean;
  showInstallPrompt: () => void;
  dismissPrompt: () => void;
  clearDismissal: () => void;
}

const DISMISS_KEY = 'chopped-pwa-dismiss';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export default function usePWAInstallation(): PWAInstallationState {
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [isPromptDismissed, setIsPromptDismissed] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      const isInstalled = isStandalone || isInWebAppiOS;
      setIsInstalled(isInstalled);
      return isInstalled;
    };

    // Check dismissal status
    const checkDismissalStatus = () => {
      try {
        const dismissedData = localStorage.getItem(DISMISS_KEY);
        if (dismissedData) {
          const { timestamp } = JSON.parse(dismissedData);
          const now = Date.now();
          if (now - timestamp < DISMISS_DURATION) {
            setIsPromptDismissed(true);
            return true;
          } else {
            // Expired, remove from storage
            localStorage.removeItem(DISMISS_KEY);
          }
        }
      } catch (error) {
        console.log('Error checking dismissal status:', error);
        localStorage.removeItem(DISMISS_KEY);
      }
      setIsPromptDismissed(false);
      return false;
    };

    const installed = checkIfInstalled();
    const dismissed = checkDismissalStatus();

    // If already installed or dismissed, don't set up install prompt listener
    if (installed || dismissed) return;

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      deferredPromptRef.current = event;
      setCanInstall(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      deferredPromptRef.current = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const showInstallPrompt = async () => {
    const deferredPrompt = deferredPromptRef.current;
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setCanInstall(false);
      } else {
        // User dismissed, record it
        dismissPrompt();
      }
      
      deferredPromptRef.current = null;
    } catch (error) {
      console.log('Error showing install prompt:', error);
    }
  };

  const dismissPrompt = () => {
    try {
      localStorage.setItem(DISMISS_KEY, JSON.stringify({
        timestamp: Date.now()
      }));
      setIsPromptDismissed(true);
      setCanInstall(false);
    } catch (error) {
      console.log('Error saving dismissal:', error);
    }
  };

  const clearDismissal = () => {
    try {
      localStorage.removeItem(DISMISS_KEY);
      setIsPromptDismissed(false);
    } catch (error) {
      console.log('Error clearing dismissal:', error);
    }
  };

  return {
    isInstalled,
    canInstall: canInstall && !isPromptDismissed,
    isPromptDismissed,
    showInstallPrompt,
    dismissPrompt,
    clearDismissal
  };
}


