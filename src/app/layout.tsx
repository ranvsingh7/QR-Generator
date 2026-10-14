import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'QR Code Generator',
  description: 'Generate customizable QR codes offline. Supports URLs, text, and center logos.',
  applicationName: 'QR Code Generator',
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  keywords: ['QR code', 'generator', 'offline', 'PWA', 'customizable'],
  authors: [{ name: 'QR Generator' }],
  creator: 'QR Generator',
  publisher: 'QR Generator',
  robots: 'index, follow',
  openGraph: {
    title: 'QR Code Generator',
    description: 'Generate customizable QR codes offline. Supports URLs, text, and center logos.',
    type: 'website',
    siteName: 'QR Code Generator',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QR Code Generator',
    description: 'Generate customizable QR codes offline.',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: '/icons/icon-192x192.png',
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'QR Generator',
  },
  other: {
    // Older Android Chrome + iOS still read this tag
    'mobile-web-app-capable': 'yes',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ colorScheme: "light" }} className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-neutral-900">
        {children}
      </body>
    </html>
  );
}