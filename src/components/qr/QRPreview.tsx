'use client';

import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import type QRCodeStylingType from 'qr-code-styling';
import { getQrOptions, QrConfig } from '@/lib/qr';

type QRPreviewHandle = {
  getPngBlob: (size: number) => Promise<Blob | null>;
};

interface QRPreviewProps {
  content: string;
  config: QrConfig;
  logoUrl?: string;
  onError?: () => void;
}

// On-screen preview is rendered at a fixed size; downloads are rendered fresh at the chosen export size.
const PREVIEW_SIZE = 720;

const QRPreview = forwardRef<QRPreviewHandle, QRPreviewProps>(({ content, config, logoUrl, onError }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const qrInstanceRef = useRef<QRCodeStylingType | null>(null);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useImperativeHandle(
    ref,
    () => ({
      getPngBlob: async (size: number) => {
        try {
          const { default: QRCodeStyling } = await import('qr-code-styling');
          const tempQr = new QRCodeStyling({ ...getQrOptions(config, content, logoUrl), width: size, height: size });
          const blob = await tempQr.getRawData('png');
          return (blob as Blob) ?? null;
        } catch (err) {
          console.error('Failed to generate PNG:', err);
          return null;
        }
      },
    }),
    [config, content, logoUrl]
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { default: QRCodeStyling } = await import('qr-code-styling');
        if (cancelled || !containerRef.current) return;

        const options = { ...getQrOptions(config, content, logoUrl), width: PREVIEW_SIZE, height: PREVIEW_SIZE };

        if (!qrInstanceRef.current) {
          const qr = new QRCodeStyling(options);
          containerRef.current.innerHTML = '';
          qr.append(containerRef.current);
          qrInstanceRef.current = qr;
        } else {
          qrInstanceRef.current.update(options);
        }
      } catch (err) {
        console.error('Failed to render QR:', err);
        onErrorRef.current?.();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [config, content, logoUrl]);

  useEffect(() => {
    const container = containerRef.current;
    return () => {
      qrInstanceRef.current = null;
      if (container) container.innerHTML = '';
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="qr-preview w-full max-w-[360px] aspect-square mx-auto bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden flex items-center justify-center"
      role="img"
      aria-label="QR Code Preview"
    />
  );
});

QRPreview.displayName = 'QRPreview';

export { QRPreview, type QRPreviewHandle };
