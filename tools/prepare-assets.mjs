// Dependency-free PNG optimiser for Arabian Drops brand assets.
//
// The live logo is 1024x1024 / 1.42 MB and is displayed at 112px on a phone. This
// tool decodes it, finds the real ink bounds (the artwork sits inside a mostly
// empty canvas), splits the lockup into its monogram and wordmark bands, and
// re-encodes each piece at the sizes actually used. No image libraries required.
//
//   node tools/prepare-assets.mjs <input.png> <outDir>
//
// Outputs:
//   logo-mark-*.png    the AD ligature on its own, for the intro overlay
//   logo-lockup-*.png  monogram + wordmark + tagline, for the header
//   report.txt         measured bounds and byte sizes

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { inflateSync, deflateSync, constants } from "node:zlib";
import { join, basename } from "node:path";

/* ---------------------------------------------------------------- CRC32 --- */

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

/* ------------------------------------------------------------ PNG decode --- */

function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("not a PNG");
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  const bitDepth = buf[24];
  const colorType = buf[25];
  const interlace = buf[28];
  if (bitDepth !== 8) throw new Error(`only 8-bit PNGs supported (got ${bitDepth})`);
  if (colorType !== 6) throw new Error(`only RGBA PNGs supported (got colorType ${colorType})`);
  if (interlace !== 0) throw new Error("interlaced PNGs not supported");

  // Gather IDAT payloads and verify CRCs as we go.
  const idat = [];
  let off = 8;
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString("ascii", off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    const expect = buf.readUInt32BE(off + 8 + len);
    const actual = crc32(buf.subarray(off + 4, off + 8 + len));
    if (expect !== actual) throw new Error(`CRC mismatch in ${type} chunk`);
    if (type === "IDAT") idat.push(data);
    off += 12 + len;
    if (type === "IEND") break;
  }

  const raw = inflateSync(Buffer.concat(idat));
  const bpp = 4;
  const stride = width * bpp;
  const out = Buffer.alloc(height * stride);

  // Undo the per-scanline filters (PNG spec 9.2).
  let rp = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[rp++];
    const line = raw.subarray(rp, rp + stride);
    rp += stride;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;

    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0; // left
      const b = prev ? prev[x] : 0; // up
      const c = prev && x >= bpp ? prev[x - bpp] : 0; // up-left
      const v = line[x];
      switch (filter) {
        case 0: cur[x] = v; break;
        case 1: cur[x] = (v + a) & 0xff; break;
        case 2: cur[x] = (v + b) & 0xff; break;
        case 3: cur[x] = (v + ((a + b) >> 1)) & 0xff; break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
          const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
          cur[x] = (v + pr) & 0xff;
          break;
        }
        default: throw new Error(`unknown filter type ${filter} on row ${y}`);
      }
    }
  }
  return { width, height, data: out };
}

/* ------------------------------------------------------------ PNG encode --- */

function encodePng(width, height, data) {
  const stride = width * 4;
  const raw = Buffer.alloc(height * (stride + 1));
  const bpp = 4;
  let prev = Buffer.alloc(stride);

  // Adaptive filtering: pick whichever of the five PNG row filters produces the
  // smallest sum of absolute signed residuals. Flat filtering wrecks smooth
  // gradients (the logo's gold ramp), so this is a large win here.
  for (let y = 0; y < height; y++) {
    const line = data.subarray(y * stride, (y + 1) * stride);
    let bestFilter = 0;
    let bestScore = Infinity;
    let best = null;

    for (let f = 0; f <= 4; f++) {
      const out = Buffer.alloc(stride);
      let score = 0;
      for (let x = 0; x < stride; x++) {
        const left = x >= bpp ? line[x - bpp] : 0;
        const up = prev[x];
        const upLeft = x >= bpp ? prev[x - bpp] : 0;
        let pr = 0;
        if (f === 1) pr = left;
        else if (f === 2) pr = up;
        else if (f === 3) pr = (left + up) >> 1;
        else if (f === 4) {
          const p = left + up - upLeft;
          const pa = Math.abs(p - left), pb = Math.abs(p - up), pc = Math.abs(p - upLeft);
          pr = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
        }
        const v = (line[x] - pr) & 0xff;
        out[x] = v;
        score += v < 128 ? v : 256 - v;
      }
      if (score < bestScore) {
        bestScore = score;
        bestFilter = f;
        best = out;
      }
    }

    raw[y * (stride + 1)] = bestFilter;
    best.copy(raw, y * (stride + 1) + 1);
    prev = line; // reconstruction of a row always equals the original row
  }

  const idat = deflateSync(raw, { level: constants.Z_BEST_COMPRESSION });

  const chunk = (type, payload) => {
    const head = Buffer.alloc(8);
    head.writeUInt32BE(payload.length, 0);
    head.write(type, 4, "ascii");
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), payload])), 0);
    return Buffer.concat([head, payload, crc]);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ------------------------------------------------------------- transforms --- */

function alphaBounds({ width, height, data }) {
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  return { minX, minY, maxX, maxY };
}

/** Rows that contain ink, and the transparent gaps between groups of ink. */
function rowBands({ width, height, data }, minGap = 12) {
  const inked = [];
  for (let y = 0; y < height; y++) {
    let sum = 0;
    for (let x = 0; x < width; x++) sum += data[(y * width + x) * 4 + 3];
    inked.push(sum > 255 * 2);
  }
  const bands = [];
  let start = -1;
  let gap = 0;
  for (let y = 0; y < height; y++) {
    if (inked[y]) {
      if (start === -1) start = y;
      gap = 0;
    } else if (start !== -1) {
      gap++;
      if (gap >= minGap) {
        bands.push({ top: start, bottom: y - gap });
        start = -1;
      }
    }
  }
  if (start !== -1) bands.push({ top: start, bottom: height - 1 });
  return bands;
}

function crop(src, { minX, minY, maxX, maxY }) {
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    src.data.copy(
      out,
      y * w * 4,
      ((y + minY) * src.width + minX) * 4,
      ((y + minY) * src.width + maxX + 1) * 4
    );
  }
  return { width: w, height: h, data: out };
}

/**
 * Area-average downscale. Averages premultiplied colour so that transparent
 * pixels don't bleed their (undefined) colour into the edges of the mark.
 */
function resize(src, outW, outH) {
  const { width: w, height: h, data } = src;
  const out = Buffer.alloc(outW * outH * 4);
  const xRatio = w / outW;
  const yRatio = h / outH;

  for (let oy = 0; oy < outH; oy++) {
    const y0 = Math.floor(oy * yRatio);
    const y1 = Math.max(y0 + 1, Math.floor((oy + 1) * yRatio));
    for (let ox = 0; ox < outW; ox++) {
      const x0 = Math.floor(ox * xRatio);
      const x1 = Math.max(x0 + 1, Math.floor((ox + 1) * xRatio));
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let y = y0; y < y1 && y < h; y++) {
        for (let x = x0; x < x1 && x < w; x++) {
          const i = (y * w + x) * 4;
          const al = data[i + 3] / 255;
          r += data[i] * al;
          g += data[i + 1] * al;
          b += data[i + 2] * al;
          a += data[i + 3];
          n++;
        }
      }
      const o = (oy * outW + ox) * 4;
      const avgA = n ? a / n : 0;
      if (avgA > 0) {
        const un = avgA / 255;
        out[o] = Math.min(255, Math.round(r / n / un));
        out[o + 1] = Math.min(255, Math.round(g / n / un));
        out[o + 2] = Math.min(255, Math.round(b / n / un));
      }
      out[o + 3] = Math.round(avgA);
    }
  }
  return { width: outW, height: outH, data: out };
}

/** Square pad so a crop can be placed in a fixed box without distortion. */
function padTo(src, size) {
  const out = Buffer.alloc(size * size * 4);
  const offX = Math.floor((size - src.width) / 2);
  const offY = Math.floor((size - src.height) / 2);
  for (let y = 0; y < src.height; y++) {
    const dy = y + offY;
    if (dy < 0 || dy >= size) continue;
    src.data.copy(
      out,
      (dy * size + offX) * 4,
      y * src.width * 4,
      (y + 1) * src.width * 4
    );
  }
  return { width: size, height: size, data: out };
}

/* ------------------------------------------------------------------ main --- */

const [input, outDir] = process.argv.slice(2);
if (!input || !outDir) {
  console.error("usage: node tools/prepare-assets.mjs <input.png> <outDir>");
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
const source = decodePng(readFileSync(input));
const lines = [];

lines.push(`source            ${basename(input)}  ${source.width}x${source.height}`);

// 1. Trim the empty canvas.
const bounds = alphaBounds(source);
const trimmed = crop(source, bounds);
const covered =
  ((trimmed.width * trimmed.height) / (source.width * source.height)) * 100;
lines.push(
  `ink bounds        x ${bounds.minX}..${bounds.maxX}  y ${bounds.minY}..${bounds.maxY}` +
    `  (${trimmed.width}x${trimmed.height}, ${covered.toFixed(0)}% of canvas)`
);

// 2. Split the lockup: the first band is the monogram, the rest is the wordmark.
const bands = rowBands(trimmed, 8);
lines.push(`vertical bands    ${bands.map((b) => `${b.top}..${b.bottom}`).join(", ")}`);

const outputs = [];

if (bands.length >= 2) {
  const markBand = bands[0];
  const monogram = crop(
    trimmed,
    { minX: 0, minY: markBand.top, maxX: trimmed.width - 1, maxY: markBand.bottom }
  );
  const markBounds = alphaBounds(monogram);
  const markTight = crop(monogram, markBounds);
  const markMax = Math.max(markTight.width, markTight.height);
  const markSquare = padTo(markTight, markMax);
  for (const size of [128, 256]) {
    const out = resize(markSquare, size, size);
    const file = join(outDir, `logo-mark-${size}.png`);
    writeFileSync(file, encodePng(size, size, out.data));
    outputs.push([file, size, size]);
  }
  lines.push(
    `monogram          y ${markBand.top}..${markBand.bottom} -> ` +
      `tight ${markTight.width}x${markTight.height}, squared ${markMax}x${markMax}`
  );
}

// 3. The whole lockup, cropped, for the header and footer.
{
  const lockW = 448;
  const lockH = Math.round((trimmed.height / trimmed.width) * lockW);
  const out = resize(trimmed, lockW, lockH);
  const file = join(outDir, "logo-lockup-448.png");
  writeFileSync(file, encodePng(lockW, lockH, out.data));
  outputs.push([file, lockW, lockH]);
}

lines.push("");
lines.push("output                          pixels      bytes");
let before = 0;
for (const [file, w, h] of outputs) {
  const bytes = readFileSync(file).length;
  before += bytes;
  lines.push(
    `${basename(file).padEnd(30)} ${`${w}x${h}`.padEnd(11)} ${String(bytes).padStart(8)}`
  );
}
lines.push("");
lines.push(
  `total written     ${before} bytes  |  original ${readFileSync(input).length} bytes  ` +
    `|  logo slot on mobile was 112x112 at 1.42 MB`
);

writeFileSync(join(outDir, "report.txt"), lines.join("\n") + "\n");
console.log(lines.join("\n"));
