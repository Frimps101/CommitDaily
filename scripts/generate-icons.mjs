// Dependency-free PWA icon generator. Produces dark-background icons with a
// stylized green "flame/streak" teardrop. Run with: node scripts/generate-icons.mjs
import zlib from "node:zlib";
import fs from "node:fs";
import path from "node:path";

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // rest 0
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Stylized flame half-width as a function of normalized height t (0 bottom .. 1 top)
function flameHalfWidth(t) {
  // teardrop: rounded bottom, pointy top
  const base = Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.9 + 0.05)), 0.7);
  const taper = 1 - Math.pow(t, 2.2); // pinch toward the top
  return Math.max(0, base * taper) * 0.34;
}

function drawIcon(size, { maskable = false, badge = false } = {}) {
  const rgba = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const r = size * 0.22; // corner radius
  const pad = maskable ? size * 0.14 : size * 0.0; // safe area for maskable

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;

      // Background: dark rounded square (or transparent for badge)
      let rB = 13, gB = 17, bB = 23, aB = 255; // #0d1117
      const inRounded = roundedRectAlpha(x, y, size, r);
      if (badge) {
        aB = 0;
      } else {
        aB = Math.round(255 * inRounded);
      }

      // Flame geometry in a vertical band, respecting maskable padding
      const inner = size - pad * 2;
      const fyBottom = pad + inner * 0.84;
      const fyTop = pad + inner * 0.12;
      const t = (fyBottom - y) / (fyBottom - fyTop); // 0 bottom .. 1 top
      let flameA = 0;
      let fr = 57, fg = 211, fb = 83; // #39d353
      if (t >= 0 && t <= 1) {
        const hw = flameHalfWidth(t) * inner;
        const dx = Math.abs(x - cx);
        const edge = hw - dx;
        flameA = Math.max(0, Math.min(1, edge / 2)); // ~2px AA
        // gradient: warmer near bottom, brighter green near top
        fr = Math.round(lerp(38, 110, t));
        fg = Math.round(lerp(160, 230, t));
        fb = Math.round(lerp(60, 110, t));
      }

      // inner "hot core" lighter teardrop
      const t2 = t;
      if (t2 >= 0.05 && t2 <= 0.8) {
        const hw2 = flameHalfWidth(t2 * 1.15) * inner * 0.5;
        const dx = Math.abs(x - cx);
        const edge = hw2 - dx;
        const coreA = Math.max(0, Math.min(1, edge / 2));
        if (coreA > 0) {
          flameA = Math.max(flameA, coreA);
          fr = 220;
          fg = 255;
          fb = 230;
        }
      }

      if (badge) {
        // Badge: monochrome flame on transparent
        rgba[i] = 255;
        rgba[i + 1] = 255;
        rgba[i + 2] = 255;
        rgba[i + 3] = Math.round(255 * flameA);
        continue;
      }

      // Composite flame over background
      const fa = flameA;
      rgba[i] = Math.round(lerp(rB, fr, fa));
      rgba[i + 1] = Math.round(lerp(gB, fg, fa));
      rgba[i + 2] = Math.round(lerp(bB, fb, fa));
      rgba[i + 3] = aB;
    }
  }
  return encodePNG(size, size, rgba);
}

function roundedRectAlpha(x, y, size, r) {
  const minX = r, minY = r, maxX = size - r, maxY = size - r;
  let dx = 0, dy = 0;
  if (x < minX) dx = minX - x;
  else if (x > maxX) dx = x - maxX;
  if (y < minY) dy = minY - y;
  else if (y > maxY) dy = y - maxY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return Math.max(0, Math.min(1, r - dist + 0.5));
}

const outDir = path.join(process.cwd(), "public", "icons");
fs.mkdirSync(outDir, { recursive: true });

const targets = [
  { name: "icon-192.png", size: 192, opts: {} },
  { name: "icon-512.png", size: 512, opts: {} },
  { name: "icon-maskable-512.png", size: 512, opts: { maskable: true } },
  { name: "badge-72.png", size: 72, opts: { badge: true } },
];

for (const t of targets) {
  const png = drawIcon(t.size, t.opts);
  fs.writeFileSync(path.join(outDir, t.name), png);
  console.log(`wrote public/icons/${t.name} (${png.length} bytes)`);
}
