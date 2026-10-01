const fs = require('fs');

// We can create a 856x540 PNG with pure node using a basic uncompressed PNG generator or a 24-bit BMP file
// A BMP file has no dependencies and is natively supported by ImageIO, browser, and OS!
function createSampleBMP(filename) {
  const width = 856;
  const height = 540;
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;

  const buf = Buffer.alloc(fileSize);

  // Bitmap File Header
  buf.write('BM', 0);
  buf.writeUInt32LE(fileSize, 2);
  buf.writeUInt32LE(54, 10); // offset to pixel data

  // DIB Header (BITMAPINFOHEADER)
  buf.writeUInt32LE(40, 14); // header size
  buf.writeInt32LE(width, 18);
  buf.writeInt32LE(height, 22); // positive = bottom-up
  buf.writeUInt16LE(1, 26); // color planes
  buf.writeUInt16LE(24, 28); // bits per pixel (RGB)
  buf.writeUInt32LE(0, 30); // no compression
  buf.writeUInt32LE(pixelArraySize, 34);
  buf.writeInt32LE(2835, 38); // horizontal res (72 dpi)
  buf.writeInt32LE(2835, 42); // vertical res (72 dpi)

  // Fill pixels (BGR format, bottom-to-top)
  for (let y = 0; y < height; y++) {
    const rowOffset = 54 + y * rowSize;
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + x * 3;

      // Card border
      if (x < 12 || x > width - 12 || y < 12 || y > height - 12) {
        buf[pxOffset] = 180;     // B
        buf[pxOffset + 1] = 180; // G
        buf[pxOffset + 2] = 180; // R
      }
      // Top header banner (y > height - 100 in bottom-up)
      else if (y > height - 100) {
        buf[pxOffset] = 200;     // Blue tint
        buf[pxOffset + 1] = 80;
        buf[pxOffset + 2] = 30;
      }
      // Photo box (x between 50 and 240, y between 160 and 420 in bottom-up)
      else if (x >= 50 && x <= 250 && y >= 160 && y <= 400) {
        if (x === 50 || x === 250 || y === 160 || y === 400) {
          buf[pxOffset] = 100;
          buf[pxOffset + 1] = 100;
          buf[pxOffset + 2] = 100;
        } else {
          // Photo silhouette
          const cx = 150;
          const cy = 300;
          const dist = Math.hypot(x - cx, y - cy);
          if (dist < 40) {
            buf[pxOffset] = 100; buf[pxOffset + 1] = 120; buf[pxOffset + 2] = 140;
          } else {
            buf[pxOffset] = 230; buf[pxOffset + 1] = 240; buf[pxOffset + 2] = 245;
          }
        }
      }
      // Simulated text lines
      else if (x > 300 && x < 750 && ((y >= 350 && y <= 365) || (y >= 290 && y <= 305) || (y >= 230 && y <= 245))) {
        buf[pxOffset] = 40;
        buf[pxOffset + 1] = 40;
        buf[pxOffset + 2] = 40;
      }
      // Card body background (clean parchment / white)
      else {
        buf[pxOffset] = 248;
        buf[pxOffset + 1] = 250;
        buf[pxOffset + 2] = 252;
      }
    }
  }

  fs.writeFileSync(filename, buf);
  console.log(`Created sample card: ${filename} (${width}x${height}, ${fileSize} bytes)`);
}

createSampleBMP('sample_id_card.bmp');
