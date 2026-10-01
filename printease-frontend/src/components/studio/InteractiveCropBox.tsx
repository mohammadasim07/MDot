import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { CropRect } from '../../stores/mtoolStore';

interface InteractiveCropBoxProps {
  imageUrl: string;
  rotation: number;
  zoom: number;
  crop: CropRect;
  onChangeCrop: (newCrop: CropRect) => void;
  onAutoCropReady?: (fn: () => void) => void;
  alt?: string;
}

type DragType =
  | 'tl'
  | 'tr'
  | 'bl'
  | 'br'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'move';

export const AADHAAR_ASPECT_RATIO = 86 / 54; // 1.59259 (8.6 cm x 5.4 cm)

export function InteractiveCropBox({
  imageUrl,
  rotation,
  zoom,
  crop,
  onChangeCrop,
  onAutoCropReady,
  alt = 'Card photo',
}: InteractiveCropBoxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [activeDrag, setActiveDrag] = useState<DragType | null>(null);
  const [lockAadhaarAspect, setLockAadhaarAspect] = useState<boolean>(true);

  const dragStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    crop: CropRect;
    containerWidth: number;
    containerHeight: number;
    rotation: number;
    imgAspect: number; // naturalWidth / naturalHeight
  }>({
    pointerX: 0,
    pointerY: 0,
    crop: { ...crop },
    containerWidth: 1,
    containerHeight: 1,
    rotation: 0,
    imgAspect: 1,
  });

  // Smart Auto Crop: scans image pixels to find card boundary and snaps to 8.6 x 5.4 cm ratio
  const handleAutoCrop = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;

    try {
      const canvas = document.createElement('canvas');
      const w = 240;
      const h = Math.round((240 * (img.naturalHeight || img.height)) / (img.naturalWidth || img.width));
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      // Sample border pixels (background)
      let rBg = 0, gBg = 0, bBg = 0, count = 0;
      for (let x = 0; x < w; x += 10) {
        const idxTop = (0 * w + x) * 4;
        const idxBot = ((h - 1) * w + x) * 4;
        rBg += data[idxTop] + data[idxBot];
        gBg += data[idxTop + 1] + data[idxBot + 1];
        bBg += data[idxTop + 2] + data[idxBot + 2];
        count += 2;
      }
      for (let y = 0; y < h; y += 10) {
        const idxLeft = (y * w + 0) * 4;
        const idxRight = (y * w + (w - 1)) * 4;
        rBg += data[idxLeft] + data[idxRight];
        gBg += data[idxLeft + 1] + data[idxRight + 1];
        bBg += data[idxLeft + 2] + data[idxRight + 2];
        count += 2;
      }
      rBg /= count;
      gBg /= count;
      bBg /= count;

      const colorDiff = (r: number, g: number, b: number) =>
        Math.sqrt((r - rBg) ** 2 + (g - gBg) ** 2 + (b - bBg) ** 2);

      const threshold = 26;

      // Scan inwards to detect document edges
      let top = 0;
      for (let y = 0; y < h / 2; y++) {
        let diffCount = 0;
        for (let x = Math.round(w * 0.2); x < w * 0.8; x += 5) {
          const idx = (y * w + x) * 4;
          if (colorDiff(data[idx], data[idx + 1], data[idx + 2]) > threshold) {
            diffCount++;
          }
        }
        if (diffCount > 4) {
          top = y;
          break;
        }
      }

      let bottom = h - 1;
      for (let y = h - 1; y > h / 2; y--) {
        let diffCount = 0;
        for (let x = Math.round(w * 0.2); x < w * 0.8; x += 5) {
          const idx = (y * w + x) * 4;
          if (colorDiff(data[idx], data[idx + 1], data[idx + 2]) > threshold) {
            diffCount++;
          }
        }
        if (diffCount > 4) {
          bottom = y;
          break;
        }
      }

      let left = 0;
      for (let x = 0; x < w / 2; x++) {
        let diffCount = 0;
        for (let y = Math.round(h * 0.2); y < h * 0.8; y += 5) {
          const idx = (y * w + x) * 4;
          if (colorDiff(data[idx], data[idx + 1], data[idx + 2]) > threshold) {
            diffCount++;
          }
        }
        if (diffCount > 4) {
          left = x;
          break;
        }
      }

      let right = w - 1;
      for (let x = w - 1; x > w / 2; x--) {
        let diffCount = 0;
        for (let y = Math.round(h * 0.2); y < h * 0.8; y += 5) {
          const idx = (y * w + x) * 4;
          if (colorDiff(data[idx], data[idx + 1], data[idx + 2]) > threshold) {
            diffCount++;
          }
        }
        if (diffCount > 4) {
          right = x;
          break;
        }
      }

      const detectedW = (right - left) / w;
      const detectedH = (bottom - top) / h;

      if (detectedW > 0.25 && detectedH > 0.25 && detectedW < 0.98 && detectedH < 0.98) {
        const padX = 0.015;
        const padY = 0.015;
        const finalX = Math.max(0, left / w - padX);
        const finalY = Math.max(0, top / h - padY);
        const finalW = Math.min(1 - finalX, detectedW + padX * 2);
        const finalH = Math.min(1 - finalY, detectedH + padY * 2);

        onChangeCrop({ x: finalX, y: finalY, width: finalW, height: finalH });
        return;
      }
    } catch {
      // Fallback
    }

    // Default centered 8.6 x 5.4 cm Aadhaar aspect ratio
    const imgAspect = (img.naturalWidth || img.width) / (img.naturalHeight || img.height);
    // Normalized height corresponding to 86/54 in image coordinate space:
    const normRatio = AADHAAR_ASPECT_RATIO / imgAspect;

    let width = 0.88;
    let height = width / normRatio;

    if (height > 0.92) {
      height = 0.9;
      width = height * normRatio;
    }

    onChangeCrop({
      x: (1 - width) / 2,
      y: (1 - height) / 2,
      width,
      height,
    });
  }, [onChangeCrop]);

  // Expose auto crop to parent
  useEffect(() => {
    if (onAutoCropReady) {
      onAutoCropReady(handleAutoCrop);
    }
  }, [onAutoCropReady, handleAutoCrop]);

  // Pointer drag start handler
  const handlePointerDown = (type: DragType, e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }

    if (!containerRef.current || !imgRef.current) return;
    const el = containerRef.current;
    const img = imgRef.current;

    const containerWidth = el.offsetWidth || el.clientWidth || 200;
    const containerHeight = el.offsetHeight || el.clientHeight || 250;
    const imgAspect = (img.naturalWidth || containerWidth) / (img.naturalHeight || containerHeight);

    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      crop: { ...crop },
      containerWidth,
      containerHeight,
      rotation,
      imgAspect,
    };

    setActiveDrag(type);
  };

  // Window pointer move and up handlers
  useEffect(() => {
    if (!activeDrag) return;

    const onPointerMove = (e: PointerEvent) => {
      const {
        pointerX,
        pointerY,
        crop: startCrop,
        containerWidth,
        containerHeight,
        rotation: rot,
        imgAspect,
      } = dragStartRef.current;

      const screenDx = e.clientX - pointerX;
      const screenDy = e.clientY - pointerY;

      // Transform screen delta into local image coordinate space
      const rad = (-rot * Math.PI) / 180;
      const localDx = screenDx * Math.cos(rad) - screenDy * Math.sin(rad);
      const localDy = screenDx * Math.sin(rad) + screenDy * Math.cos(rad);

      const normDx = localDx / containerWidth;
      const normDy = localDy / containerHeight;

      const MIN_SIZE = 0.05; // 5% minimum crop dimension
      // In normalized coordinates, ratio = (crop.w / crop.h) * imgAspect = targetAspect (1.59259)
      const normRatio = AADHAAR_ASPECT_RATIO / imgAspect;

      let { x, y, width, height } = startCrop;

      switch (activeDrag) {
        case 'tl': {
          let newW = Math.max(MIN_SIZE, startCrop.width - normDx);
          let newH = lockAadhaarAspect ? newW / normRatio : Math.max(MIN_SIZE, startCrop.height - normDy);

          let newX = startCrop.x + (startCrop.width - newW);
          let newY = startCrop.y + (startCrop.height - newH);

          if (newX < 0) {
            newX = 0;
            newW = startCrop.x + startCrop.width;
            if (lockAadhaarAspect) newH = newW / normRatio;
            newY = startCrop.y + startCrop.height - newH;
          }
          if (newY < 0) {
            newY = 0;
            newH = startCrop.y + startCrop.height;
            if (lockAadhaarAspect) newW = newH * normRatio;
            newX = startCrop.x + startCrop.width - newW;
          }

          x = Math.max(0, newX);
          y = Math.max(0, newY);
          width = Math.min(1 - x, newW);
          height = Math.min(1 - y, newH);
          break;
        }
        case 'tr': {
          let newW = Math.max(MIN_SIZE, Math.min(1 - startCrop.x, startCrop.width + normDx));
          let newH = lockAadhaarAspect ? newW / normRatio : Math.max(MIN_SIZE, startCrop.height - normDy);
          let newY = startCrop.y + (startCrop.height - newH);

          if (newY < 0) {
            newY = 0;
            newH = startCrop.y + startCrop.height;
            if (lockAadhaarAspect) newW = Math.min(1 - startCrop.x, newH * normRatio);
          }

          y = Math.max(0, newY);
          width = newW;
          height = Math.min(1 - y, newH);
          break;
        }
        case 'bl': {
          let newW = Math.max(MIN_SIZE, startCrop.width - normDx);
          let newH = lockAadhaarAspect ? newW / normRatio : Math.max(MIN_SIZE, startCrop.height + normDy);
          let newX = startCrop.x + (startCrop.width - newW);

          if (newX < 0) {
            newX = 0;
            newW = startCrop.x + startCrop.width;
            if (lockAadhaarAspect) newH = newW / normRatio;
          }
          if (startCrop.y + newH > 1) {
            newH = 1 - startCrop.y;
            if (lockAadhaarAspect) newW = newH * normRatio;
            newX = startCrop.x + startCrop.width - newW;
          }

          x = Math.max(0, newX);
          width = newW;
          height = Math.min(1 - startCrop.y, newH);
          break;
        }
        case 'br': {
          let newW = Math.max(MIN_SIZE, Math.min(1 - startCrop.x, startCrop.width + normDx));
          let newH = lockAadhaarAspect ? newW / normRatio : Math.max(MIN_SIZE, Math.min(1 - startCrop.y, startCrop.height + normDy));

          if (lockAadhaarAspect && startCrop.y + newH > 1) {
            newH = 1 - startCrop.y;
            newW = newH * normRatio;
          }

          width = Math.min(1 - startCrop.x, newW);
          height = Math.min(1 - startCrop.y, newH);
          break;
        }
        case 'top': {
          const newY = Math.max(0, Math.min(startCrop.y + normDy, startCrop.y + startCrop.height - MIN_SIZE));
          height = startCrop.height - (newY - startCrop.y);
          y = newY;
          if (lockAadhaarAspect) {
            width = Math.min(1 - x, height * normRatio);
          }
          break;
        }
        case 'bottom': {
          height = Math.min(1 - startCrop.y, Math.max(MIN_SIZE, startCrop.height + normDy));
          if (lockAadhaarAspect) {
            width = Math.min(1 - x, height * normRatio);
          }
          break;
        }
        case 'left': {
          const newX = Math.max(0, Math.min(startCrop.x + normDx, startCrop.x + startCrop.width - MIN_SIZE));
          width = startCrop.width - (newX - startCrop.x);
          x = newX;
          if (lockAadhaarAspect) {
            height = Math.min(1 - y, width / normRatio);
          }
          break;
        }
        case 'right': {
          width = Math.min(1 - startCrop.x, Math.max(MIN_SIZE, startCrop.width + normDx));
          if (lockAadhaarAspect) {
            height = Math.min(1 - y, width / normRatio);
          }
          break;
        }
        case 'move': {
          x = Math.max(0, Math.min(1 - startCrop.width, startCrop.x + normDx));
          y = Math.max(0, Math.min(1 - startCrop.height, startCrop.y + normDy));
          break;
        }
      }

      onChangeCrop({
        x: Math.max(0, Math.min(1, x)),
        y: Math.max(0, Math.min(1, y)),
        width: Math.max(MIN_SIZE, Math.min(1 - x, width)),
        height: Math.max(MIN_SIZE, Math.min(1 - y, height)),
      });
    };

    const onPointerUp = () => {
      setActiveDrag(null);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [activeDrag, onChangeCrop, lockAadhaarAspect]);

  return (
    <div className="relative select-none flex flex-col items-center justify-center">
      {/* Top Crop Mode Pill Bar */}
      <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-slate-700/60 shadow-md">
        <button
          type="button"
          onClick={() => setLockAadhaarAspect(true)}
          className={`px-2 py-0.5 text-[10px] font-semibold rounded-full transition-colors ${
            lockAadhaarAspect
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white'
          }`}
          title="Lock to official 8.6 cm x 5.4 cm Aadhaar ID Card ratio"
        >
          8.6 × 5.4 cm (Aadhaar)
        </button>
        <button
          type="button"
          onClick={() => setLockAadhaarAspect(false)}
          className={`px-2 py-0.5 text-[10px] font-semibold rounded-full transition-colors ${
            !lockAadhaarAspect
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white'
          }`}
          title="Free aspect ratio crop"
        >
          Free
        </button>
      </div>

      {/* Image & Crop Box Wrapper with rotation and zoom */}
      <div
        className="relative transition-transform duration-100 ease-out flex items-center justify-center p-6"
        style={{
          transform: `rotate(${rotation}deg) scale(${zoom / 100})`,
        }}
      >
        <div
          ref={containerRef}
          className="relative max-h-[360px] max-w-[440px] overflow-hidden shadow-2xl rounded-sm bg-white/5"
        >
          {/* Source Image */}
          <img
            ref={imgRef}
            src={imageUrl}
            alt={alt}
            crossOrigin="anonymous"
            className="max-h-[360px] max-w-[440px] object-contain block pointer-events-none select-none"
          />

          {/* CROP BOX with dimmed exterior and solid red lines matching M.DoT Pro design */}
          <div
            className="absolute z-10 transition-none"
            style={{
              left: `${crop.x * 100}%`,
              top: `${crop.y * 100}%`,
              width: `${crop.width * 100}%`,
              height: `${crop.height * 100}%`,
              border: '2px solid #dc2626',
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
            }}
          >
            {/* 86.0 × 54.0 mm Badge Pill */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] font-semibold font-mono px-2 py-0.5 rounded-full shadow-md flex items-center space-x-1 z-40 whitespace-nowrap pointer-events-none select-none">
              <span>86.0 × 54.0 mm</span>
            </div>

            {/* Rule of thirds grid lines inside crop box */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-evenly opacity-30">
              <div className="w-full border-t border-dashed border-white/60" />
              <div className="w-full border-t border-dashed border-white/60" />
            </div>
            <div className="absolute inset-0 pointer-events-none flex justify-evenly opacity-30">
              <div className="h-full border-l border-dashed border-white/60" />
              <div className="h-full border-l border-dashed border-white/60" />
            </div>

            {/* Move Handle (center of crop box) */}
            <div
              onPointerDown={(e) => handlePointerDown('move', e)}
              className="absolute inset-2 cursor-move z-10 touch-none"
              title="Drag to reposition crop box"
            />

            {/* Edges for resizing */}
            <div
              onPointerDown={(e) => handlePointerDown('top', e)}
              className="absolute -top-1 left-2 right-2 h-2 cursor-ns-resize z-20 touch-none"
            />
            <div
              onPointerDown={(e) => handlePointerDown('bottom', e)}
              className="absolute -bottom-1 left-2 right-2 h-2 cursor-ns-resize z-20 touch-none"
            />
            <div
              onPointerDown={(e) => handlePointerDown('left', e)}
              className="absolute top-2 bottom-2 -left-1 w-2 cursor-ew-resize z-20 touch-none"
            />
            <div
              onPointerDown={(e) => handlePointerDown('right', e)}
              className="absolute top-2 bottom-2 -right-1 w-2 cursor-ew-resize z-20 touch-none"
            />

            {/* 4 RED & WHITE CORNER HANDLES */}
            <span
              onPointerDown={(e) => handlePointerDown('tl', e)}
              className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-red-600 rounded-sm shadow-md cursor-nwse-resize z-30 transform hover:scale-125 transition-transform touch-none"
              title="Drag to crop"
            />
            <span
              onPointerDown={(e) => handlePointerDown('tr', e)}
              className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-red-600 rounded-sm shadow-md cursor-nesw-resize z-30 transform hover:scale-125 transition-transform touch-none"
              title="Drag to crop"
            />
            <span
              onPointerDown={(e) => handlePointerDown('bl', e)}
              className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-red-600 rounded-sm shadow-md cursor-nesw-resize z-30 transform hover:scale-125 transition-transform touch-none"
              title="Drag to crop"
            />
            <span
              onPointerDown={(e) => handlePointerDown('br', e)}
              className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-red-600 rounded-sm shadow-md cursor-nwse-resize z-30 transform hover:scale-125 transition-transform touch-none"
              title="Drag to crop"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
