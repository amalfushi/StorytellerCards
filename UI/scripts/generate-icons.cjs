/**
 * Generate simple PWA placeholder icons.
 *
 * Creates solid dark-blue PNG icons with "SC" drawn as simple pixel art.
 * Uses only Node.js built-in modules (no external dependencies).
 *
 * Usage:  node scripts/generate-icons.cjs
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Background colour #1a1a2e
const BG_R = 0x1a;
const BG_G = 0x1a;
const BG_B = 0x2e;

// Foreground (white text)
const FG_R = 0xff;
const FG_G = 0xff;
const FG_B = 0xff;

/** Create a CRC32 lookup table. */
function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
}

const crcTable = makeCrcTable();

/** Compute CRC32 over a buffer. */
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** Build a PNG chunk: [length][type][data][crc]. */
function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBytes, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, typeBytes, data, crcBuf]);
}

/**
 * Draw a filled circle centered on the canvas.
 * Pixels inside the circle get (r,g,b); outside stay transparent (will be filled with bg first).
 */
function fillCircle(pixels, w, h, cx, cy, radius, r, g, b) {
  const r2 = radius * radius;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r2) {
        const idx = (y * w + x) * 3;
        pixels[idx] = r;
        pixels[idx + 1] = g;
        pixels[idx + 2] = b;
      }
    }
  }
}

/**
 * Draw a simple block letter at a given position.
 * Each letter is defined as a 5×7 bitmap.
 */
const FONT = {
  S: [
    '01110',
    '10001',
    '10000',
    '01110',
    '00001',
    '10001',
    '01110',
  ],
  C: [
    '01110',
    '10001',
    '10000',
    '10000',
    '10000',
    '10001',
    '01110',
  ],
};

function drawLetter(pixels, w, letter, startX, startY, scale, r, g, b) {
  const bitmap = FONT[letter];
  if (!bitmap) return;
  for (let row = 0; row < bitmap.length; row++) {
    for (let col = 0; col < bitmap[row].length; col++) {
      if (bitmap[row][col] === '1') {
        // Fill a scale×scale block
        for (let dy = 0; dy < scale; dy++) {
          for (let dx = 0; dx < scale; dx++) {
            const px = startX + col * scale + dx;
            const py = startY + row * scale + dy;
            if (px >= 0 && px < w && py >= 0 && py < w) {
              const idx = (py * w + px) * 3;
              pixels[idx] = r;
              pixels[idx + 1] = g;
              pixels[idx + 2] = b;
            }
          }
        }
      }
    }
  }
}

function createIcon(size) {
  const w = size;
  const h = size;

  // Raw RGB pixel data
  const pixels = Buffer.alloc(w * h * 3, 0);

  // Fill background with dark blue
  for (let i = 0; i < w * h; i++) {
    pixels[i * 3] = BG_R;
    pixels[i * 3 + 1] = BG_G;
    pixels[i * 3 + 2] = BG_B;
  }

  // Draw a circle (slightly lighter than bg for the border)
  const cx = Math.floor(w / 2);
  const cy = Math.floor(h / 2);
  const outerR = Math.floor(w * 0.46);
  const innerR = Math.floor(w * 0.43);
  fillCircle(pixels, w, h, cx, cy, outerR, 0x19, 0x76, 0xd2); // theme-color ring
  fillCircle(pixels, w, h, cx, cy, innerR, BG_R, BG_G, BG_B); // inner fill

  // Draw "SC" letters
  const scale = Math.max(1, Math.floor(size / 32));
  const letterW = 5 * scale;
  const letterH = 7 * scale;
  const gap = Math.floor(scale * 1.5);
  const totalW = letterW * 2 + gap;
  const startX = Math.floor((w - totalW) / 2);
  const startY = Math.floor((h - letterH) / 2);

  drawLetter(pixels, w, 'S', startX, startY, scale, FG_R, FG_G, FG_B);
  drawLetter(pixels, w, 'C', startX + letterW + gap, startY, scale, FG_R, FG_G, FG_B);

  // Build raw scanlines (filter byte 0 + RGB per pixel per row)
  const raw = Buffer.alloc(h * (1 + w * 3));
  for (let y = 0; y < h; y++) {
    const rowOffset = y * (1 + w * 3);
    raw[rowOffset] = 0; // filter: None
    pixels.copy(raw, rowOffset + 1, y * w * 3, (y + 1) * w * 3);
  }

  // Compress with zlib
  const compressed = zlib.deflateSync(raw);

  // PNG signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(w, 0);
  ihdrData.writeUInt32BE(h, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type: RGB
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdrData),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Generate both icons ──
const publicDir = path.join(__dirname, '..', 'public');

const icon192 = createIcon(192);
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), icon192);
console.log('✓ Created public/icon-192.png (%d bytes)', icon192.length);

const icon512 = createIcon(512);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), icon512);
console.log('✓ Created public/icon-512.png (%d bytes)', icon512.length);
