import React, { useRef, useEffect } from 'react';
import type { CropRect } from '../../stores/mtoolStore';

interface CroppedPreviewProps {
  src: string;
  crop?: CropRect;
  rotation?: number;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}

/**
 * High-performance Canvas-based cropped image renderer.
 * Accurately extracts the cropped area and applies rotation with ZERO distortion,
 * rendering a crisp 1:1 image inside any container.
 */
export function CroppedPreview({
  src,
  crop = { x: 0, y: 0, width: 1, height: 1 },
  rotation = 0,
  className = '',
  style = {},
}: CroppedPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const baseW = img.naturalWidth || img.width;
      const baseH = img.naturalHeight || img.height;

      const safeCrop = {
        x: Math.max(0, Math.min(0.98, crop.x ?? 0)),
        y: Math.max(0, Math.min(0.98, crop.y ?? 0)),
        width: Math.max(0.02, Math.min(1, crop.width ?? 1)),
        height: Math.max(0.02, Math.min(1, crop.height ?? 1)),
      };

      const sx = Math.max(0, safeCrop.x * baseW);
      const sy = Math.max(0, safeCrop.y * baseH);
      const sw = Math.min(baseW - sx, safeCrop.width * baseW);
      const sh = Math.min(baseH - sy, safeCrop.height * baseH);

      const rad = (rotation * Math.PI) / 180;
      const absCos = Math.abs(Math.cos(rad));
      const absSin = Math.abs(Math.sin(rad));

      // Destination dimensions after rotation
      const destW = Math.round(sw * absCos + sh * absSin);
      const destH = Math.round(sw * absSin + sh * absCos);

      canvas.width = Math.max(1, destW);
      canvas.height = Math.max(1, destH);

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rad);
      ctx.drawImage(img, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);
      ctx.restore();
    };

    img.src = src;
  }, [src, crop.x, crop.y, crop.width, crop.height, rotation]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full object-cover block ${className}`}
      style={style}
    />
  );
}

/**
 * Generate a high-resolution cropped PNG data URL from an image, crop box, and rotation.
 */
export async function getCroppedDataUrl(
  imageUrl: string,
  crop: CropRect = { x: 0, y: 0, width: 1, height: 1 },
  rotation: number = 0
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const baseW = img.naturalWidth || img.width;
        const baseH = img.naturalHeight || img.height;

        const safeCrop = {
          x: Math.max(0, Math.min(0.98, crop.x ?? 0)),
          y: Math.max(0, Math.min(0.98, crop.y ?? 0)),
          width: Math.max(0.02, Math.min(1, crop.width ?? 1)),
          height: Math.max(0.02, Math.min(1, crop.height ?? 1)),
        };

        const sx = Math.max(0, safeCrop.x * baseW);
        const sy = Math.max(0, safeCrop.y * baseH);
        const sw = Math.min(baseW - sx, safeCrop.width * baseW);
        const sh = Math.min(baseH - sy, safeCrop.height * baseH);

        const rad = (rotation * Math.PI) / 180;
        const absCos = Math.abs(Math.cos(rad));
        const absSin = Math.abs(Math.sin(rad));

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(sw * absCos + sh * absSin));
        canvas.height = Math.max(1, Math.round(sw * absSin + sh * absCos));

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageUrl);
          return;
        }

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(rad);
        ctx.drawImage(img, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);

        resolve(canvas.toDataURL('image/png', 0.95));
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => resolve(imageUrl);
    img.src = imageUrl;
  });
}
