'use client';

import { useState, useCallback, useRef, type ChangeEvent, type DragEvent } from 'react';
import { Check, Upload, X, ImagePlus } from 'lucide-react';
import { LogoSelection, LogoType, LOGO_OPTIONS, readFileAsDataUrl, isValidImageFile } from '@/lib/qr';

interface LogoPickerProps {
  value: LogoSelection;
  onChange: (logo: LogoSelection) => void;
  disabled?: boolean;
}

export function LogoPicker({ value, onChange, disabled }: LogoPickerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  // Remember the last uploaded logo so the user can switch to Google/None and back without re-uploading.
  const [lastCustom, setLastCustom] = useState<LogoSelection | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const custom = value.type === 'custom' ? value : lastCustom;
  const customPreview = custom?.dataUrl ?? null;

  const openFilePicker = useCallback(() => {
    if (disabled) return;
    setError(null);
    fileInputRef.current?.click();
  }, [disabled]);

  const handleSelect = useCallback(
    (type: LogoType) => {
      if (disabled) return;
      setError(null);

      if (type === 'custom') {
        if (lastCustom?.dataUrl) {
          onChange(lastCustom);
        } else {
          openFilePicker();
        }
        return;
      }

      onChange({ type });
    },
    [disabled, lastCustom, onChange, openFilePicker]
  );

  const processFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;

      const validation = isValidImageFile(file);
      if (!validation.valid) {
        setError(validation.error ?? 'Invalid file');
        return;
      }

      try {
        const dataUrl = await readFileAsDataUrl(file);
        const next: LogoSelection = { type: 'custom', dataUrl, fileName: file.name };
        setLastCustom(next);
        onChange(next);
        setError(null);
      } catch {
        setError('Failed to read file');
      }
    },
    [onChange]
  );

  const handleFileSelect = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      await processFile(file);
    },
    [processFile]
  );

  const handleDrop = useCallback(
    async (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      await processFile(e.dataTransfer.files?.[0]);
    },
    [disabled, processFile]
  );

  const handleRemoveCustom = useCallback(() => {
    if (disabled) return;
    setLastCustom(null);
    onChange({ type: 'none' });
    setError(null);
  }, [disabled, onChange]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" role="radiogroup" aria-label="Logo selection">
        {LOGO_OPTIONS.map((option) => {
          const selected = value.type === option.type;
          return (
            <button
              key={option.type}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => handleSelect(option.type)}
              className={`relative min-h-28 flex flex-col items-center justify-center rounded-xl border-2 px-2 py-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                selected
                  ? 'border-emerald-500 bg-emerald-50 focus:ring-emerald-500'
                  : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50 focus:ring-neutral-400'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {option.type === 'none' ? (
                <div className="w-16 h-16 rounded-lg bg-neutral-100 flex items-center justify-center border border-neutral-200">
                  <X className="w-8 h-8 text-neutral-400" aria-hidden="true" />
                </div>
              ) : option.type === 'custom' ? (
                customPreview ? (
                  <img // eslint-disable-line @next/next/no-img-element
                    src={customPreview}
                    alt="Your logo"
                    className="w-16 h-16 object-contain rounded-lg bg-white p-1 border border-neutral-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-emerald-50 flex items-center justify-center border border-dashed border-emerald-400">
                    <ImagePlus className="w-8 h-8 text-emerald-600" aria-hidden="true" />
                  </div>
                )
              ) : (
                <img // eslint-disable-line @next/next/no-img-element
                  src={option.icon}
                  alt={option.label}
                  className="w-16 h-16 object-contain rounded-lg bg-white p-1"
                  loading="lazy"
                />
              )}
              <span className="mt-2 text-sm font-medium leading-tight text-center text-neutral-700">
                {option.type === 'custom' && !customPreview ? 'Upload Logo' : option.label}
              </span>
              {selected && (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" aria-hidden="true" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Upload area — always visible so adding your own logo is obvious */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`rounded-xl border-2 border-dashed p-4 transition-colors ${
          isDragging ? 'border-emerald-500 bg-emerald-50' : custom ? 'border-emerald-300 bg-emerald-50/50' : 'border-neutral-300 bg-neutral-50'
        }`}
      >
        {customPreview ? (
          <div className="flex items-center gap-3">
            <img // eslint-disable-line @next/next/no-img-element
              src={customPreview}
              alt={custom?.fileName ?? 'Custom logo'}
              className="h-16 w-16 shrink-0 object-contain rounded-lg bg-white p-1 border border-emerald-100"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-neutral-800">{custom?.fileName ?? 'Custom logo'}</p>
              <p className="text-xs text-neutral-500">
                {value.type === 'custom' ? 'Used in the center of your QR code' : 'Tap “Custom Logo” above to use it'}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={openFilePicker}
                  disabled={disabled}
                  className="px-3 py-1.5 rounded-lg border border-emerald-300 bg-white text-sm font-medium text-emerald-700 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" aria-hidden="true" />
                  Replace
                </button>
                <button
                  type="button"
                  onClick={handleRemoveCustom}
                  disabled={disabled}
                  className="px-3 py-1.5 rounded-lg border border-neutral-300 bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-400 disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={openFilePicker}
            disabled={disabled}
            className="w-full flex flex-col items-center justify-center gap-2 py-2 text-center focus:outline-none disabled:opacity-50"
          >
            <span className="w-11 h-11 rounded-full bg-emerald-500 flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold text-neutral-800">Upload your own logo</span>
            <span className="text-xs text-neutral-500">Click or drag & drop · PNG, JPG, WebP, SVG · max 5 MB</span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
        onChange={handleFileSelect}
        className="sr-only"
        id="custom-logo-upload"
        disabled={disabled}
        tabIndex={-1}
      />

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

LogoPicker.displayName = 'LogoPicker';
