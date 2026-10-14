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
    icon: '/icon.png',
    shortcut: '/icon-192x192.png',
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'QR Generator',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#1a1a1a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ colorScheme: "light" }} className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col bg-white text-neutral-900">
        {children}
      </body>
    </html>
  );
}