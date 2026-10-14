'use client';

import { QRGenerator } from '@/components/qr/QRGenerator';
import { PWAInstall } from '@/components/PWAInstall';

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-neutral-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-neutral-900 tracking-tight">QR Generator</h1>
              <p className="truncate text-xs text-neutral-500">Create custom QR codes offline</p>
            </div>
          </div>
          <PWAInstall />
        </div>
      </header>

      <main className="flex-1">
        <QRGenerator />
      </main>

      <footer className="border-t border-neutral-200 py-6">
        <div className="max-w-2xl mx-auto px-4 text-center text-xs text-neutral-500">
          <p>QR Code Generator — Works offline, no data leaves your device.</p>
          <p className="mt-1">Built with Next.js, TypeScript, and Tailwind CSS.</p>
        </div>
      </footer>
    </>
  );
}