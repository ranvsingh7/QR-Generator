'use client';

import { useState, useRef, useCallback } from 'react';
import { Download, Share2, Copy, Check, AlertCircle, X } from 'lucide-react';
import { QRPreview, type QRPreviewHandle } from './QRPreview';
import { LogoPicker } from './LogoPicker';
import { CustomizationPanel } from './CustomizationPanel';
import { QrConfig, LogoSelection, DEFAULT_CONFIG, getLogoUrl, FILENAME } from '@/lib/qr';

export function QRGenerator() {
  const [content, setContent] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [generationId, setGenerationId] = useState(0);
  const [logo, setLogo] = useState<LogoSelection>({ type: 'none' });
  const [config, setConfig] = useState<QrConfig>(DEFAULT_CONFIG);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const qrPreviewRef = useRef<QRPreviewHandle | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const hasGeneratedContent = generatedContent.trim().length > 0;

  const handleGenerate = useCallback(() => {
    // Read straight from the field so it works even if state lagged behind (autofill, paste, IME)
    const raw = textareaRef.current?.value ?? content;
    if (raw !== content) setContent(raw);
    const nextContent = raw.trim();

    if (!nextContent) {
      setGeneratedContent('');
      setStatus({ type: 'error', message: 'Enter content to generate a QR code' });
      return;
    }

    setStatus(null);
    setGeneratedContent(nextContent);
    setGenerationId((current) => current + 1);
  }, [content]);

  const handleContentChange = useCallback((value: string) => {
    setContent(value);
    setStatus(null);
    if (!value.trim()) {
      setGeneratedContent('');
    }
  }, []);

  const handleClear = useCallback(() => {
    setContent('');
    setGeneratedContent('');
    setStatus(null);
  }, []);

  const handleConfigChange = useCallback((partial: Partial<QrConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleReset = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    setLogo({ type: 'none' });
    setStatus({ type: 'success', message: 'Customization reset to defaults' });
  }, []);

  const handleDownload = useCallback(async () => {
    if (!generatedContent.trim()) {
      setStatus({ type: 'error', message: 'Enter content to generate a QR code' });
      return;
    }
    if (!qrPreviewRef.current) {
      setStatus({ type: 'error', message: 'Generate a QR code before downloading' });
      return;
    }

    setIsDownloading(true);
    setStatus(null);
    try {
      const blob = await qrPreviewRef.current.getPngBlob(config.exportSize);
      if (!blob) throw new Error('Failed to generate image');

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = FILENAME;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus({ type: 'success', message: `Downloaded ${config.exportSize}×${config.exportSize} PNG` });
    } catch (err) {
      console.error('Download failed:', err);
      setStatus({ type: 'error', message: 'Failed to download QR code' });
    } finally {
      setIsDownloading(false);
    }
  }, [config.exportSize, generatedContent]);

  const handleShare = useCallback(async () => {
    if (!generatedContent.trim()) {
      setStatus({ type: 'error', message: 'Enter content to generate a QR code' });
      return;
    }
    if (!qrPreviewRef.current) {
      setStatus({ type: 'error', message: 'Generate a QR code before sharing' });
      return;
    }

    try {
      const blob = await qrPreviewRef.current.getPngBlob(config.exportSize);
      if (!blob) throw new Error('Failed to generate image');

      const file = new File([blob], FILENAME, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'QR Code',
          text: generatedContent,
          files: [file],
        });
        setStatus({ type: 'success', message: 'Shared successfully' });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = FILENAME;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setStatus({ type: 'success', message: 'Downloaded (share not supported)' });
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err);
        setStatus({ type: 'error', message: 'Failed to share QR code' });
      }
    }
  }, [config.exportSize, generatedContent]);

  const handleCopy = useCallback(async () => {
    if (!content.trim()) {
      setStatus({ type: 'error', message: 'Nothing to copy' });
      return;
    }
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setStatus({ type: 'success', message: 'Content copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setStatus({ type: 'error', message: 'Failed to copy content' });
    }
  }, [content]);

  const handleQrError = useCallback(() => {
    setStatus({ type: 'error', message: 'Failed to generate QR code. Try different content or settings.' });
  }, []);

  const logoUrl = getLogoUrl(logo);

  return (
    <div className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 space-y-5">
      <section aria-labelledby="input-heading" className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 id="input-heading" className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Content
          </h2>
          <span className="text-sm text-neutral-500 font-mono shrink-0 pt-1">
            {content.length} characters
          </span>
        </div>

        <div className="relative">
          <textarea
            id="qr-content"
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onInput={(e) => handleContentChange((e.target as HTMLTextAreaElement).value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleGenerate();
              }
            }}
            placeholder="Enter text, URL, or any content..."
            rows={3}
            className="qr-content-input w-full pl-4 pr-11 py-3 border border-neutral-200 rounded-xl text-base text-[#111827] placeholder:text-[#9CA3AF] caret-[#111827] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none font-sans bg-white opacity-100"
            aria-describedby="content-hint"
          />
          {content && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-3 p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label="Clear input"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          )}
        </div>
        <p id="content-hint" className="mt-2 text-xs text-neutral-500">
          URLs, plain text, Google review links, Instagram profiles — anything works.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            className="px-5 py-2.5 bg-emerald-500 text-white rounded-lg font-medium text-sm hover:bg-emerald-600 active:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 cursor-pointer flex items-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polyline points="23 4 23 10 17 10" />
              <path d="M1 20.6V14a2 2 0 0 1 2-2h6" />
              <rect x="8" y="12" width="8" height="8" rx="2" />
            </svg>
            {hasGeneratedContent ? 'Update QR' : 'Generate QR'}
          </button>
          <span className="self-center text-xs text-neutral-400 hidden sm:inline">or press Ctrl/⌘ + Enter</span>
        </div>
      </section>

      <section aria-labelledby="logo-heading" className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm">
        <h2 id="logo-heading" className="text-lg font-semibold text-neutral-900 flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" />
          </svg>
          Center Logo
        </h2>
        <LogoPicker value={logo} onChange={setLogo} />
      </section>

      <CustomizationPanel
        config={config}
        onConfigChange={handleConfigChange}
        onReset={handleReset}
      />

      <section aria-labelledby="preview-heading" className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 id="preview-heading" className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <rect x="8" y="8" width="3" height="3" />
              <rect x="13" y="8" width="3" height="3" />
              <rect x="8" y="13" width="3" height="3" />
              <rect x="13" y="13" width="3" height="3" />
            </svg>
            QR Code Preview
          </h2>
          {hasGeneratedContent && (
            <span className="text-xs text-neutral-500 font-mono">
              {config.exportSize}×{config.exportSize} px
            </span>
          )}
        </div>

        <div className="relative">
          {hasGeneratedContent ? (
            <QRPreview
              key={generationId}
              ref={qrPreviewRef}
              content={generatedContent}
              config={config}
              logoUrl={logoUrl}
              onError={handleQrError}
            />
          ) : (
            <div className="w-full max-w-[360px] aspect-square mx-auto bg-neutral-50 rounded-xl border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center text-center p-6">
              <svg className="w-16 h-16 text-neutral-300 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <rect x="8" y="8" width="3" height="3" />
                <rect x="13" y="8" width="3" height="3" />
                <rect x="8" y="13" width="3" height="3" />
                <rect x="13" y="13" width="3" height="3" />
              </svg>
              <p className="text-neutral-500 text-sm">Your QR code will appear here</p>
              <p className="text-neutral-400 text-xs mt-1">Enter content above to generate</p>
            </div>
          )}
        </div>
      </section>

      {status && (
        <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto md:max-w-md z-50 animate-slide-up ${status.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`} role="alert">
          <div className="flex items-center gap-3 p-4 rounded-xl shadow-lg">
            {status.type === 'success' ? (
              <Check className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            )}
            <p className="text-sm font-medium">{status.message}</p>
            <button onClick={() => setStatus(null)} className="ml-auto p-1 rounded hover:bg-white/20 transition-colors" aria-label="Dismiss">
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={handleDownload}
          disabled={!hasGeneratedContent || isDownloading}
          className="w-full py-4 bg-emerald-500 text-white rounded-xl font-semibold text-lg hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-colors"
        >
          <Download className="w-6 h-6" aria-hidden="true" />
          <span>{isDownloading ? 'Generating...' : 'Download PNG'}</span>
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleShare}
            disabled={!hasGeneratedContent}
            className="py-3 bg-white border border-neutral-200 rounded-xl font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Share2 className="w-5 h-5" aria-hidden="true" />
            Share
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!content.trim()}
            className="py-3 bg-white border border-neutral-200 rounded-xl font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {copied ? <Check className="w-5 h-5 text-emerald-500" aria-hidden="true" /> : <Copy className="w-5 h-5" aria-hidden="true" />}
            {copied ? 'Copied' : 'Copy Text'}
          </button>
        </div>
      </div>
    </div>
  );
}

QRGenerator.displayName = 'QRGenerator';
