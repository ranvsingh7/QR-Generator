'use client';

import { useState, useEffect, useCallback } from 'react';
import { Download, X, Info } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  prompt(): Promise<void>;
}

const isIOSDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !('MSStream' in window);
};

const isStandaloneMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches;
};

const getInitialDismissed = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('pwa-install-dismissed') === 'true';
};

export function PWAInstall() {
  const [showInstall, setShowInstall] = useState(false);
  const [isIOS] = useState(isIOSDevice);
  const [isStandalone] = useState(isStandaloneMode);
  const [dismissed, setDismissed] = useState(getInitialDismissed);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [mounted] = useState(() => typeof window !== 'undefined');

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!isStandalone) setShowInstall(true);
    };

    const handleAppInstalled = () => {
      setShowInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isStandalone]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    if (process.env.NODE_ENV !== 'production') {
      // In development a service worker serves stale JS/CSS, so code changes never show up.
      // Remove any previously registered worker and its caches.
      navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
      if ('caches' in window) {
        caches.keys().then((names) => names.forEach((n) => caches.delete(n)));
      }
      return;
    }

    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then((reg) => reg.update())
      .catch((err) => console.warn('SW registration failed:', err));
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstall(false);
        setDeferredPrompt(null);
      }
    } catch (err) {
      console.warn('Install prompt failed:', err);
    }
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setShowInstall(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  }, []);

  if (!mounted || isStandalone || dismissed || !showInstall) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto md:max-w-md z-50 animate-slide-up">
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <rect x="8" y="8" width="3" height="3" />
                <rect x="13" y="8" width="3" height="3" />
                <rect x="8" y="13" width="3" height="3" />
                <rect x="13" y="13" width="3" height="3" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900">Install QR Generator</h3>
              <p className="text-sm text-neutral-500">Add to home screen for offline access</p>
            </div>
          </div>
          <button onClick={dismiss} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors flex-shrink-0" aria-label="Dismiss">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          {deferredPrompt && (
            <button
              onClick={handleInstall}
              className="flex-1 py-2.5 bg-emerald-500 text-white rounded-lg font-medium text-sm hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              Install
            </button>
          )}

          {isIOS && (
            <button
              onClick={() => setShowInstall(false)}
              className="flex-1 py-2.5 bg-white border border-neutral-200 rounded-lg font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent flex items-center justify-center gap-2"
            >
              <Info className="w-4 h-4" aria-hidden="true" />
              iOS Guide
            </button>
          )}
        </div>

        {isIOS && (
          <div className="mt-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
            <p className="text-sm text-neutral-600">
              Tap the share button <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-neutral-200 text-neutral-700 text-xs font-mono ml-1 mr-1">⎋</span> then <strong>Add to Home Screen</strong>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

PWAInstall.displayName = 'PWAInstall';