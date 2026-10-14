'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { Download, X, Share, SquarePlus, WifiOff, RefreshCw } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  prompt(): Promise<void>;
}

// ---- tiny external stores (no hydration mismatch, no setState-in-effect) ----
const noopSubscribe = () => () => {};

function subscribeStandalone(cb: () => void) {
  const mq = window.matchMedia('(display-mode: standalone)');
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}
function getStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function subscribeOnline(cb: () => void) {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
}

function getIsIOS() {
  const ua = navigator.userAgent;
  const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return /iPad|iPhone|iPod/.test(ua) || iPadOS;
}

export function PWAInstall() {
  const isStandalone = useSyncExternalStore(subscribeStandalone, getStandalone, () => false);
  const isOnline = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
  const isIOS = useSyncExternalStore(noopSubscribe, getIsIOS, () => false);

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const [installed, setInstalled] = useState(false);

  // Install prompt events
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  // Service worker registration
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const sw = navigator.serviceWorker;

    if (process.env.NODE_ENV !== 'production') {
      // Dev: a service worker serves stale code. Remove it (and its caches) and reload once.
      const wasControlled = !!sw.controller;
      Promise.all([
        sw.getRegistrations().then((regs) => Promise.all(regs.map((r) => r.unregister()))),
        'caches' in window ? caches.keys().then((ks) => Promise.all(ks.map((k) => caches.delete(k)))) : null,
      ]).then(() => {
        if (wasControlled && !sessionStorage.getItem('sw-dev-cleaned')) {
          sessionStorage.setItem('sw-dev-cleaned', '1');
          window.location.reload();
        }
      });
      return;
    }

    const hadController = !!sw.controller;
    const onControllerChange = () => {
      // A new version took over — offer a reload (skip on the very first install)
      if (hadController) setUpdateReady(true);
    };
    sw.addEventListener('controllerchange', onControllerChange);

    const register = () => {
      sw.register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .then(async (reg) => {
          await sw.ready;
          // Cache everything the first page load already fetched, so offline works right away
          const urls = [
            window.location.pathname,
            ...performance
              .getEntriesByType('resource')
              .map((entry) => entry.name)
              .filter((u) => u.startsWith(window.location.origin)),
          ];
          (reg.active ?? sw.controller)?.postMessage({ type: 'CACHE_URLS', urls });
          reg.update().catch(() => undefined);
        })
        .catch((err) => console.warn('SW registration failed:', err));
    };

    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });

    // Check for a new version when the app comes back to the foreground
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        sw.getRegistration().then((reg) => reg?.update().catch(() => undefined));
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      sw.removeEventListener('controllerchange', onControllerChange);
      window.removeEventListener('load', register);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') setInstalled(true);
      } catch (err) {
        console.warn('Install prompt failed:', err);
      }
      setDeferredPrompt(null);
      return;
    }
    if (isIOS) setShowIOSGuide(true);
  }, [deferredPrompt, isIOS]);

  const canInstall = !isStandalone && !installed && (!!deferredPrompt || isIOS);

  return (
    <>
      {/* Header controls */}
      <div className="flex shrink-0 items-center gap-2">
        {!isOnline && (
          <span className="inline-flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-amber-100 px-2.5 text-xs font-medium leading-none text-amber-800">
            <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />
            Offline
          </span>
        )}
        {canInstall && (
          <button
            type="button"
            onClick={handleInstall}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-emerald-500 px-3.5 text-sm font-medium leading-none text-white hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Install</span>
          </button>
        )}
      </div>

      {/* iOS: Safari has no install prompt, so show the steps */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={() => setShowIOSGuide(false)}>
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-900">Install on iPhone / iPad</h3>
              <button onClick={() => setShowIOSGuide(false)} className="p-1 rounded-lg text-neutral-400 hover:bg-neutral-100" aria-label="Close">
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <ol className="space-y-3 text-sm text-neutral-700">
              <li className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                  <Share className="w-4 h-4 text-blue-600" aria-hidden="true" />
                </span>
                Tap the <strong>Share</strong> button in Safari&apos;s toolbar
              </li>
              <li className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                  <SquarePlus className="w-4 h-4 text-neutral-700" aria-hidden="true" />
                </span>
                Choose <strong>Add to Home Screen</strong>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-semibold flex items-center justify-center shrink-0">✓</span>
                Tap <strong>Add</strong> — the app appears on your home screen
              </li>
            </ol>
            <p className="mt-4 text-xs text-neutral-500">Use Safari — other iOS browsers may not offer this option.</p>
          </div>
        </div>
      )}

      {/* New version available */}
      {updateReady && (
        <div className="fixed top-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
          <div className="flex items-center gap-3 rounded-xl bg-neutral-900 text-white p-3 pl-4 shadow-xl">
            <p className="text-sm flex-1">A new version is available.</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-medium hover:bg-emerald-600"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              Reload
            </button>
          </div>
        </div>
      )}
    </>
  );
}

PWAInstall.displayName = 'PWAInstall';
