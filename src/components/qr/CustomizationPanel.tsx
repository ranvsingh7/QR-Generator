'use client';

import { useState } from 'react';
import { RotateCcw, Square, ChevronDown } from 'lucide-react';
import { QrConfig, DOT_STYLES, CORNER_SQUARE_STYLES, CORNER_DOT_STYLES, EXPORT_SIZES, isValidHexColor } from '@/lib/qr';

interface CustomizationPanelProps {
  config: QrConfig;
  onConfigChange: (config: Partial<QrConfig>) => void;
  onReset: () => void;
}

export function CustomizationPanel({ config, onConfigChange, onReset }: CustomizationPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [colorError, setColorError] = useState<string | null>(null);

  const handleToggle = () => setExpanded((prev) => !prev);

  const handleColorChange = (field: 'foreground' | 'background', value: string) => {
    if (isValidHexColor(value)) {
      setColorError(null);
      onConfigChange({ [field]: value });
    } else if (value.length === 7) {
      setColorError(`${field} must be a valid hex color (e.g., #1a1a1a)`);
    }
  };

  const handleSelectChange = <T extends keyof QrConfig>(field: T, value: QrConfig[T]) => {
    onConfigChange({ [field]: value });
  };

  const handleSliderChange = (value: number) => {
    onConfigChange({ logoSize: Math.round(value * 100) / 100 });
  };

  return (
    <section className="bg-white rounded-2xl border border-neutral-200 shadow-sm">
      <button
        type="button"
        onClick={handleToggle}
        className="flex items-center justify-between w-full p-5 cursor-pointer rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center">
            <Square className="w-5 h-5 text-neutral-600" aria-hidden="true" />
          </div>
          <h3 className="text-base font-semibold text-neutral-900">Customization</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500 hidden sm:inline">{expanded ? 'Hide' : 'Show'}</span>
          <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
        </div>
      </button>

      {/* No fixed max-height / overflow here: the panel grows with its content and the page scrolls normally */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-neutral-100 animate-slide-up">
        <div className="space-y-5 pt-4">

          <div>
            <label htmlFor="foreground" className="block text-sm font-medium text-neutral-700 mb-2">
              Foreground Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                id="foreground"
                value={config.foreground}
                onChange={(e) => handleColorChange('foreground', e.target.value)}
                className="w-12 h-12 rounded-lg border border-neutral-200 cursor-pointer hover:border-neutral-300 transition-colors"
                aria-label="QR foreground color"
              />
              <HexInput
                value={config.foreground}
                onValidChange={(v) => handleColorChange('foreground', v)}
                onInvalid={(msg) => setColorError(msg)}
                placeholder="#1a1a1a"
                label="Foreground hex color"
              />
            </div>
          </div>

          <div>
            <label htmlFor="background" className="block text-sm font-medium text-neutral-700 mb-2">
              Background Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                id="background"
                value={config.background}
                onChange={(e) => handleColorChange('background', e.target.value)}
                className="w-12 h-12 rounded-lg border border-neutral-200 cursor-pointer hover:border-neutral-300 transition-colors"
                aria-label="QR background color"
              />
              <HexInput
                value={config.background}
                onValidChange={(v) => handleColorChange('background', v)}
                onInvalid={(msg) => setColorError(msg)}
                placeholder="#ffffff"
                label="Background hex color"
              />
            </div>
          </div>

          {colorError && (
            <p className="text-sm text-red-600" role="alert">{colorError}</p>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Logo Size: <span className="font-mono text-emerald-600">{Math.round(config.logoSize * 100)}%</span>
            </label>
            <input
              type="range"
              min="0.1"
              max="0.4"
              step="0.01"
              value={config.logoSize}
              onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              aria-label="Logo size percentage"
            />
          </div>

          <div>
            <label htmlFor="dot-style" className="block text-sm font-medium text-neutral-700 mb-2">
              Module Style
            </label>
            <select
              id="dot-style"
              value={config.dotStyle}
              onChange={(e) => handleSelectChange('dotStyle', e.target.value as QrConfig['dotStyle'])}
              className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
            >
              {DOT_STYLES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="corner-square" className="block text-sm font-medium text-neutral-700 mb-2">
                Corner Squares
              </label>
              <select
                id="corner-square"
                value={config.cornerSquareStyle}
                onChange={(e) => handleSelectChange('cornerSquareStyle', e.target.value as QrConfig['cornerSquareStyle'])}
                className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
              >
                {CORNER_SQUARE_STYLES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="corner-dot" className="block text-sm font-medium text-neutral-700 mb-2">
                Corner Dots
              </label>
              <select
                id="corner-dot"
                value={config.cornerDotStyle}
                onChange={(e) => handleSelectChange('cornerDotStyle', e.target.value as QrConfig['cornerDotStyle'])}
                className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
              >
                {CORNER_DOT_STYLES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="export-size" className="block text-sm font-medium text-neutral-700 mb-2">
              Export Resolution
            </label>
            <div className="flex flex-wrap gap-2">
              {EXPORT_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleSelectChange('exportSize', size)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    config.exportSize === size
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-white border border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50'
                  }`}
                  aria-pressed={config.exportSize === size}
                >
                  {size}×{size}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={onReset}
            className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300 transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            Reset to Defaults
          </button>

        </div>
        </div>
      )}
    </section>
  );
}

CustomizationPanel.displayName = 'CustomizationPanel';

interface HexInputProps {
  value: string;
  onValidChange: (value: string) => void;
  onInvalid: (message: string | null) => void;
  placeholder: string;
  label: string;
}

// Keeps a local draft so partial values like "#1a" can be typed; only valid colors are applied.
function HexInput({ value, onValidChange, onInvalid, placeholder, label }: HexInputProps) {
  const [draft, setDraft] = useState(value);
  const [prevValue, setPrevValue] = useState(value);

  if (value !== prevValue) {
    setPrevValue(value);
    setDraft(value);
  }

  const handleChange = (raw: string) => {
    let next = raw.trim();
    if (next && !next.startsWith('#')) next = `#${next}`;
    setDraft(next);
    if (isValidHexColor(next)) {
      onInvalid(null);
      onValidChange(next.toLowerCase());
    } else if (next.length >= 7) {
      onInvalid('Enter a valid hex color, e.g. #1a1a1a');
    } else {
      onInvalid(null);
    }
  };

  return (
    <input
      type="text"
      value={draft}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={() => {
        if (!isValidHexColor(draft)) {
          setDraft(value);
          onInvalid(null);
        }
      }}
      maxLength={7}
      spellCheck={false}
      autoCapitalize="off"
      autoComplete="off"
      className="flex-1 min-w-0 px-3 py-2.5 border border-neutral-200 rounded-lg text-sm font-mono text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
      placeholder={placeholder}
      aria-label={label}
    />
  );
}
