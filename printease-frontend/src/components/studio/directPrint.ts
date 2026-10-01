import { getCroppedDataUrl } from './cropUtils';
import type { CardItem, CropRect } from '../../stores/mtoolStore';

interface DirectPrintOptions {
  card: CardItem;
  paperSizeId: string;
  orientation: 'PORTRAIT' | 'LANDSCAPE';
  cardWidthMm: number;
  spacingMm: number;
  marginsMm: number;
}

const PAPER_DIMENSIONS: Record<string, { widthMm: number; heightMm: number; name: string }> = {
  A4: { widthMm: 210, heightMm: 297, name: 'A4' },
  LEGAL: { widthMm: 215.9, heightMm: 355.6, name: 'Legal' },
  A5: { widthMm: 148, heightMm: 210, name: 'A5' },
  LETTER: { widthMm: 215.9, heightMm: 279.4, name: 'Letter' },
};

/**
 * Direct laptop print execution:
 * Generates an isolated, high-resolution A4 print document and triggers
 * the laptop's native print dialog DIRECTLY without showing any intermediate modal.
 */
export async function directPrintSheet({
  card,
  paperSizeId,
  orientation,
  cardWidthMm,
  spacingMm,
  marginsMm,
}: DirectPrintOptions): Promise<void> {
  const paper = PAPER_DIMENSIONS[paperSizeId] || PAPER_DIMENSIONS.A4;
  const isLandscape = orientation === 'LANDSCAPE';
  const paperWidth = isLandscape ? paper.heightMm : paper.widthMm;
  const paperHeight = isLandscape ? paper.widthMm : paper.heightMm;

  // Standard Aadhaar / ID Card: 86 mm x 54 mm (ratio 1.59259)
  const cardHeightMm = Math.round((cardWidthMm * 54) / 86);

  // Default crop fallbacks
  const defaultCrop: CropRect = { x: 0, y: 0, width: 1, height: 1 };

  // Generate cropped, high-resolution image data URLs
  let frontDataUrl = card.frontUrl || '';
  let backDataUrl = card.backUrl || '';

  if (card.frontUrl) {
    try {
      frontDataUrl = await getCroppedDataUrl(
        card.frontUrl,
        card.frontCrop || defaultCrop,
        card.frontRotation || 0
      );
    } catch {
      frontDataUrl = card.frontUrl;
    }
  }

  if (card.backUrl) {
    try {
      backDataUrl = await getCroppedDataUrl(
        card.backUrl,
        card.backCrop || defaultCrop,
        card.backRotation || 0
      );
    } catch {
      backDataUrl = card.backUrl;
    }
  }

  // Create isolated print HTML containing ONLY the A4 paper and cards
  const printHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>M.Tool — Print Sheet</title>
  <style>
    @page {
      size: ${paper.name.toLowerCase()} ${orientation.toLowerCase()};
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: ${paperWidth}mm;
      height: ${paperHeight}mm;
      margin: 0;
      padding: 0;
      background: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet-wrapper {
      width: ${paperWidth}mm;
      height: ${paperHeight}mm;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: ${Math.max(marginsMm, 15)}mm;
      padding-left: ${marginsMm}mm;
      padding-right: ${marginsMm}mm;
      padding-bottom: ${marginsMm}mm;
      position: relative;
    }
    .cards-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: ${spacingMm}mm;
    }
    .card-box {
      width: ${cardWidthMm}mm;
      height: ${cardHeightMm}mm;
      border: 0.5px solid #cbd5e1;
      border-radius: 2mm;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
      page-break-inside: avoid;
    }
    .card-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .cut-guide {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: ${cardHeightMm}mm;
      color: #94a3b8;
      font-size: 11px;
      user-select: none;
    }
    .cut-line {
      flex: 1;
      width: 1px;
      border-left: 1px dashed #94a3b8;
    }
    .cut-scissors {
      margin: 1.5mm 0;
      font-size: 10px;
    }
  </style>
</head>
<body>
  <div class="sheet-wrapper">
    <div class="cards-row">
      ${
        frontDataUrl
          ? `<div class="card-box"><img src="${frontDataUrl}" class="card-img" alt="Front" /></div>`
          : ''
      }
      ${
        frontDataUrl && backDataUrl
          ? `
        <div class="cut-guide">
          <div class="cut-line"></div>
          <span class="cut-scissors">✂</span>
          <div class="cut-line"></div>
        </div>
      `
          : ''
      }
      ${
        backDataUrl
          ? `<div class="card-box"><img src="${backDataUrl}" class="card-img" alt="Back" /></div>`
          : ''
      }
    </div>
  </div>
</body>
</html>
`;

  return new Promise((resolve) => {
    // Create hidden iframe for direct printing
    const iframe = document.createElement('iframe');
    iframe.name = 'mtool_direct_print_frame';
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '1000px';
    iframe.style.height = '1000px';
    iframe.style.border = '0';
    iframe.style.opacity = '0.01';
    iframe.style.pointerEvents = 'none';

    document.body.appendChild(iframe);

    let printed = false;
    const doPrint = () => {
      if (printed) return;
      printed = true;
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('Direct print failed, fallback:', err);
        window.print();
      } finally {
        setTimeout(() => {
          try {
            document.body.removeChild(iframe);
          } catch {
            // ignore
          }
          resolve();
        }, 1500);
      }
    };

    iframe.onload = () => {
      const imgs = Array.from(iframe.contentDocument?.images || []);
      if (imgs.length === 0) {
        setTimeout(doPrint, 80);
      } else {
        Promise.all(
          imgs.map((img) => {
            if (img.complete) return Promise.resolve();
            return new Promise((r) => {
              img.onload = r;
              img.onerror = r;
            });
          })
        ).then(() => {
          setTimeout(doPrint, 120);
        });
      }
    };

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      resolve();
      return;
    }

    doc.open();
    doc.write(printHtml);
    doc.close();

    // Safety timeout in case onload doesn't fire
    setTimeout(doPrint, 1000);
  });
}

/**
 * High-resolution 300 DPI PNG generator for direct PDF/Image download
 */
export async function downloadSheet300Dpi({
  card,
  paperSizeId,
  orientation,
  cardWidthMm,
  spacingMm,
}: DirectPrintOptions): Promise<void> {
  const paper = PAPER_DIMENSIONS[paperSizeId] || PAPER_DIMENSIONS.A4;
  const isLandscape = orientation === 'LANDSCAPE';
  const paperWidthMm = isLandscape ? paper.heightMm : paper.widthMm;
  const paperHeightMm = isLandscape ? paper.widthMm : paper.heightMm;

  // 300 DPI calculation: 1 inch = 25.4 mm => pixels = (mm * 300) / 25.4
  const mmToPx = 300 / 25.4;
  const canvasW = Math.round(paperWidthMm * mmToPx);
  const canvasH = Math.round(paperHeightMm * mmToPx);

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Pure white paper
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Standard Aadhaar Card physical dimensions
  const cardHeightMm = Math.round((cardWidthMm * 54) / 86);
  const cardW = Math.round(cardWidthMm * mmToPx);
  const cardH = Math.round(cardHeightMm * mmToPx);
  const spacingPx = Math.round(spacingMm * mmToPx);

  const defaultCrop: CropRect = { x: 0, y: 0, width: 1, height: 1 };

  let frontImg: HTMLImageElement | null = null;
  let backImg: HTMLImageElement | null = null;

  if (card.frontUrl) {
    const frontUrl = await getCroppedDataUrl(card.frontUrl, card.frontCrop || defaultCrop, card.frontRotation || 0);
    frontImg = await loadImage(frontUrl);
  }

  if (card.backUrl) {
    const backUrl = await getCroppedDataUrl(card.backUrl, card.backCrop || defaultCrop, card.backRotation || 0);
    backImg = await loadImage(backUrl);
  }

  const hasBoth = frontImg && backImg;
  const totalCardsW = hasBoth ? cardW * 2 + spacingPx : cardW;
  const startX = Math.round((canvasW - totalCardsW) / 2);
  const startY = Math.round((canvasH - cardH) / 2);

  if (frontImg) {
    ctx.drawImage(frontImg, startX, startY, cardW, cardH);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, startY, cardW, cardH);
  }

  if (hasBoth) {
    // Cut guide in the center
    const cutX = startX + cardW + Math.round(spacingPx / 2);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(cutX, startY);
    ctx.lineTo(cutX, startY + cardH);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (backImg) {
    const backX = hasBoth ? startX + cardW + spacingPx : startX;
    ctx.drawImage(backImg, backX, startY, cardW, cardH);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.strokeRect(backX, startY, cardW, cardH);
  }

  const dataUrl = canvas.toDataURL('image/png', 0.95);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `MTool_Aadhaar_Print_${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
