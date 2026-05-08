// Run this once: node setup-pwa.js
const fs = require("fs");
const path = require("path");

const publicDir = path.join(__dirname, "public");
fs.mkdirSync(publicDir, { recursive: true });

// ── manifest.json ─────────────────────────────────────────────────────────────
fs.writeFileSync(
  path.join(publicDir, "manifest.json"),
  JSON.stringify(
    {
      name: "Smart Money Screener",
      short_name: "SmartMoney",
      description: "Track institutional smart money signals across NSE stocks, F&O and commodities",
      start_url: "/",
      display: "standalone",
      background_color: "#0f172a",
      theme_color: "#1e40af",
      orientation: "portrait-primary",
      icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
      ],
      categories: ["finance", "utilities"],
      lang: "en",
      scope: "/",
    },
    null,
    2
  )
);
console.log("✅ manifest.json created");

// ── Service Worker ────────────────────────────────────────────────────────────
fs.writeFileSync(
  path.join(publicDir, "sw.js"),
  `// Smart Money Screener — Service Worker
const CACHE_NAME = "smartmoney-v1";
const SHELL_ASSETS = ["/", "/index.html"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
});
`
);
console.log("✅ sw.js created");

// ── Generate simple PNG icons using raw PNG bytes ─────────────────────────────
// This creates minimal valid PNGs with a dark blue background + chart emoji feel
function createSimplePNG(size) {
  // We'll write a valid minimal PNG: header + IHDR + IDAT + IEND
  // Using the 'zlib' module to deflate raw pixel data
  const zlib = require("zlib");
  
  // Fill with dark blue (#1e40af) background
  const r = 0x1e, g = 0x40, b = 0xaf;
  
  // Raw pixel rows: each row has a filter byte (0 = None) + RGBA pixels
  const rowSize = size * 4;
  const raw = Buffer.alloc((1 + rowSize) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (1 + rowSize)] = 0; // filter byte
    for (let x = 0; x < size; x++) {
      const i = y * (1 + rowSize) + 1 + x * 4;
      raw[i] = r; raw[i+1] = g; raw[i+2] = b; raw[i+3] = 255;
    }
  }
  
  const compressed = zlib.deflateSync(raw);
  
  function crc32(buf) {
    let crc = 0xFFFFFFFF;
    const table = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[n] = c;
    }
    for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  
  function chunk(type, data) {
    const typeBuffer = Buffer.from(type, "ascii");
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const crcData = Buffer.concat([typeBuffer, data]);
    const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(crcData));
    return Buffer.concat([len, typeBuffer, data, crcBuf]);
  }
  
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type RGB — wait, we have RGBA so use 6
  ihdrData[9] = 6;  // RGBA
  ihdrData[10] = 0; ihdrData[11] = 0; ihdrData[12] = 0;
  
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdrData),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

fs.writeFileSync(path.join(publicDir, "icon-192.png"), createSimplePNG(192));
console.log("✅ icon-192.png created");

fs.writeFileSync(path.join(publicDir, "icon-512.png"), createSimplePNG(512));
console.log("✅ icon-512.png created");

console.log("\n🎉 PWA assets ready in frontend/public/");
console.log("Now update index.html and main.jsx (see instructions above).");
