// Generates PWA icons (no image libraries) — a flat indigo tile with a white
// barbell drawn from rectangles. Run once; outputs are committed.
//   node scripts/make-icons.mjs

import { deflateSync } from "node:zlib";
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUB = resolve(__dirname, "../public");

const BG = [79, 70, 229]; // indigo-600
const FG = [255, 255, 255];

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function png(size) {
  const px = (x, y) => {
    // barbell geometry, proportional to size
    const s = size;
    const midY = y > s * 0.4 && y < s * 0.6;
    const bar = midY && x > s * 0.2 && x < s * 0.8;
    const plateL = x > s * 0.12 && x < s * 0.24 && y > s * 0.3 && y < s * 0.7;
    const plateR = x > s * 0.76 && x < s * 0.88 && y > s * 0.3 && y < s * 0.7;
    const capL = x > s * 0.06 && x < s * 0.12 && y > s * 0.37 && y < s * 0.63;
    const capR = x > s * 0.88 && x < s * 0.94 && y > s * 0.37 && y < s * 0.63;
    return bar || plateL || plateR || capL || capR ? FG : BG;
  };

  const raw = Buffer.alloc((size * 3 + 1) * size);
  let o = 0;
  for (let y = 0; y < size; y++) {
    raw[o++] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const [r, g, b] = px(x, y);
      raw[o++] = r;
      raw[o++] = g;
      raw[o++] = b;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#4f46e5"/>
  <g fill="#fff">
    <rect x="14" y="28" width="36" height="8" rx="2"/>
    <rect x="9" y="21" width="7" height="22" rx="2"/>
    <rect x="48" y="21" width="7" height="22" rx="2"/>
    <rect x="4" y="25" width="5" height="14" rx="2"/>
    <rect x="55" y="25" width="5" height="14" rx="2"/>
  </g>
</svg>
`;

await mkdir(PUB, { recursive: true });
await writeFile(resolve(PUB, "icon-192.png"), png(192));
await writeFile(resolve(PUB, "icon-512.png"), png(512));
await writeFile(resolve(PUB, "favicon.svg"), favicon);
console.log("Wrote public/icon-192.png, public/icon-512.png, public/favicon.svg");
