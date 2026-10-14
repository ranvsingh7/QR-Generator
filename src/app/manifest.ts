import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

  return {
    id: '/',
    name: 'QR Code Generator',
    short_name: 'QR Generator',
    description: 'Generate customizable QR codes offline. Supports URLs, text, and center logos.',
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    lang: 'en',
    dir: 'ltr',
    categories: ['utilities', 'productivity'],
    prefer_related_applications: false,
    icons: [
      // "any" icons — required by Chrome for the install prompt (192 + 512)
      ...sizes.map((size) => ({
        src: `/icons/icon-${size}x${size}.png`,
        sizes: `${size}x${size}`,
        type: 'image/png',
        purpose: 'any' as const,
      })),
      // Full-bleed icons with a safe zone, for Android adaptive (circle/squircle) icons
      { src: '/icons/maskable-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
