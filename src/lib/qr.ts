export type LogoType = 'none' | 'google' | 'instagram' | 'custom';

export interface LogoSelection {
  type: LogoType;
  dataUrl?: string;
  objectUrl?: string;
  fileName?: string;
}

export interface QrConfig {
  foreground: string;
  background: string;
  logoSize: number;
  dotStyle: DotType;
  cornerSquareStyle: CornerSquareType;
  cornerDotStyle: CornerDotType;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  exportSize: ExportSize;
}

export type DotType = 'dots' | 'rounded' | 'classy' | 'classy-rounded' | 'square' | 'extra-rounded';
export type CornerSquareType = 'dot' | 'square' | 'extra-rounded' | DotType;
export type CornerDotType = 'dot' | 'square' | DotType;
export type ExportSize = 256 | 512 | 1024 | 2048;

export const DOT_STYLES: { value: DotType; label: string }[] = [
  { value: 'square', label: 'Square' },
  { value: 'dots', label: 'Dots' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'extra-rounded', label: 'Extra Rounded' },
  { value: 'classy', label: 'Classy' },
  { value: 'classy-rounded', label: 'Classy Rounded' },
];

export const CORNER_SQUARE_STYLES: { value: CornerSquareType; label: string }[] = [
  { value: 'square', label: 'Square' },
  { value: 'dot', label: 'Dot' },
  { value: 'extra-rounded', label: 'Extra Rounded' },
];

export const CORNER_DOT_STYLES: { value: CornerDotType; label: string }[] = [
  { value: 'dot', label: 'Dot' },
  { value: 'square', label: 'Square' },
];

export const EXPORT_SIZES: ExportSize[] = [256, 512, 1024, 2048];

export const DEFAULT_CONFIG: QrConfig = {
  foreground: '#1a1a1a',
  background: '#ffffff',
  logoSize: 0.22,
  dotStyle: 'square',
  cornerSquareStyle: 'square',
  cornerDotStyle: 'dot',
  errorCorrectionLevel: 'H',
  exportSize: 1024,
};

export const LOGO_OPTIONS: { type: LogoType; label: string; icon: string }[] = [
  { type: 'none', label: 'No Logo', icon: '' },
  { type: 'google', label: 'Google', icon: '/logos/google.png' },
  { type: 'instagram', label: 'Instagram', icon: '/logos/instagram.png' },
  { type: 'custom', label: 'Custom Logo', icon: '' },
];

export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif'];
export const ACCEPTED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif'];

export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

export function isValidImageFile(file: File): { valid: boolean; error?: string } {
  const fileName = file.name.toLowerCase();
  const hasAcceptedType = ACCEPTED_IMAGE_TYPES.includes(file.type);
  const hasAcceptedExtension = ACCEPTED_EXTENSIONS.some((extension) => fileName.endsWith(extension));

  if (!hasAcceptedType && !(file.type === '' && hasAcceptedExtension)) {
    return { valid: false, error: 'Only PNG, JPG, WebP, SVG or GIF images are allowed.' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size must be less than 5 MB.' };
  }
  return { valid: true };
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function createObjectUrl(file: File): string {
  return URL.createObjectURL(file);
}

export function revokeObjectUrl(url: string): void {
  URL.revokeObjectURL(url);
}

export function getLogoUrl(logo: LogoSelection): string | undefined {
  if (logo.type === 'google') return '/logos/google.png';
  if (logo.type === 'instagram') return '/logos/instagram.png';
  // Prefer the data URL: it never gets revoked, so the logo keeps working on re-render and download.
  if (logo.type === 'custom') return logo.dataUrl || logo.objectUrl;
  return undefined;
}

export function getQrOptions(config: QrConfig, content: string, logoUrl?: string) {
  const options: import('qr-code-styling').Options = {
    width: config.exportSize,
    height: config.exportSize,
    margin: 16,
    data: content,
    type: 'canvas',
    shape: 'square',
    qrOptions: {
      errorCorrectionLevel: config.errorCorrectionLevel,
      mode: 'Byte',
    },
    backgroundOptions: {
      color: config.background,
    },
    dotsOptions: {
      type: config.dotStyle,
      color: config.foreground,
      roundSize: false,
    },
    cornersSquareOptions: {
      type: config.cornerSquareStyle,
      color: config.foreground,
    },
    cornersDotOptions: {
      type: config.cornerDotStyle,
      color: config.foreground,
    },
  };

  if (logoUrl) {
    options.image = logoUrl;
    options.imageOptions = {
      hideBackgroundDots: true,
      imageSize: config.logoSize,
      crossOrigin: logoUrl.startsWith('/logos/') ? 'anonymous' : undefined,
      margin: 4,
    };
  }

  return options;
}

export const FILENAME = 'qr-code.png';
