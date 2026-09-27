// Dependency-free Netlify deploy for the Arabian Drops site.
//
// Builds a ZIP in memory (no archiver needed), then creates or reuses a Netlify
// site and uploads it through the public API. No global install, no node_modules.
//
//   node tools/deploy.mjs --dry-run              # build and verify the bundle, no upload
//   NETLIFY_AUTH_TOKEN=xxx node tools/deploy.mjs # create a site and deploy to production
//   NETLIFY_AUTH_TOKEN=xxx NETLIFY_SITE_ID=yyy node tools/deploy.mjs
//
// A personal access token comes from
//   https://app.netlify.com/user/applications#personal-access-tokens

import { readFileSync, writeFileSync, statSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import { join, extname, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const DRY_RUN = process.argv.includes("--dry-run");
const SITE_NAME = process.env.NETLIFY_SITE_NAME || "arabian-drops";

// Dev-only material: never ship the tools, the test harness or the sources.
const EXCLUDE_DIRS = new Set(["tools", "tests", "raw", "node_modules", ".git"]);
const EXCLUDE_FILES = new Set([
  ".gitignore",
  ".preview-server.pid",
  "README.md",
  "package.json",
  "package-lock.json",
  // Asset-tool output, not part of the site.
  "img/report.txt",
  // The full logo lockup. No page uses it — the header sets the monogram plus a
  // typographic wordmark — so shipping it would be 125 KB of dead weight.
  "img/logo-lockup-448.png",
]);

/* ------------------------------------------------------------------ walk --- */

async function walk(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      await walk(full, out);
      continue;
    }
    // Compare against the path relative to the site root, not the basename:
    // "img/report.txt" would never match an entry named "report.txt".
    const rel = relative(ROOT, full).split("\\").join("/");
    // Never pack an archive into itself — the dry-run output lands in this tree.
    if (rel.toLowerCase().endsWith(".zip")) continue;
    if (!EXCLUDE_FILES.has(rel)) out.push(full);
  }
  return out;
}

/* --------------------------------------------------------------- ZIP --- */

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

/** DOS date/time, which is what the ZIP header stores. */
function dosDateTime(date) {
  const time = ((date.getHours() & 31) << 11) | ((date.getMinutes() & 63) << 5) | ((date.getSeconds() / 2) & 31);
  const day = (((date.getFullYear() - 1980) & 127) << 9) | (((date.getMonth() + 1) & 15) << 5) | (date.getDate() & 31);
  return { time, day };
}

function zip(files) {
  const chunks = [];
  const central = [];
  let offset = 0;
  const { time, day } = dosDateTime(new Date());

  for (const { name, data } of files) {
    const crc = crc32(data);
    const deflated = deflateRawSync(data, { level: 9 });
    // Store when compression doesn't help (jpeg, webp, png are already packed).
    const useDeflate = deflated.length < data.length;
    const body = useDeflate ? deflated : data;
    const method = useDeflate ? 8 : 0;
    const nameBuf = Buffer.from(name, "utf8");

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(day, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    chunks.push(local, nameBuf, body);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0, 8);
    cd.writeUInt16LE(method, 10);
    cd.writeUInt16LE(time, 12);
    cd.writeUInt16LE(day, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(body.length, 20);
    cd.writeUInt32LE(data.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt16LE(0, 30);
    cd.writeUInt16LE(0, 32);
    cd.writeUInt16LE(0, 34);
    cd.writeUInt16LE(0, 36);
    cd.writeUInt32LE(0, 38);
    cd.writeUInt32LE(offset, 42);
    central.push(cd, nameBuf);

    offset += local.length + nameBuf.length + body.length;
  }

  const cdBuf = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(cdBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...chunks, cdBuf, eocd]);
}

/** Read a ZIP back out. Used by --dry-run so a broken writer can't ship. */
function unzip(buf) {
  const out = [];
  let p = 0;
  while (p < buf.length && buf.readUInt32LE(p) === 0x04034b50) {
    const method = buf.readUInt16LE(p + 8);
    const crc = buf.readUInt32LE(p + 14);
    const compSize = buf.readUInt32LE(p + 18);
    const size = buf.readUInt32LE(p + 22);
    const nameLen = buf.readUInt16LE(p + 26);
    const extraLen = buf.readUInt16LE(p + 28);
    const name = buf.toString("utf8", p + 30, p + 30 + nameLen);
    const start = p + 30 + nameLen + extraLen;
    const raw = buf.subarray(start, start + compSize);
    const data = method === 8 ? inflateRawSync(raw) : raw;
    if (crc32(data) !== crc) throw new Error(`CRC mismatch for ${name}`);
    if (data.length !== size) throw new Error(`size mismatch for ${name}`);
    out.push({ name, data });
    p = start + compSize;
  }
  return out;
}

/* ----------------------------------------------------------------- main --- */

const paths = (await walk(ROOT)).sort();
const files = paths.map((p) => ({ name: relative(ROOT, p).split("\\").join("/"), data: readFileSync(p) }));

const total = files.reduce((a, f) => a + f.data.length, 0);
console.log(`bundle     ${files.length} files, ${(total / 1024).toFixed(1)} KB uncompressed`);

const zipBuf = zip(files);
console.log(`zipped     ${(zipBuf.length / 1024).toFixed(1)} KB`);

// Verify the archive round-trips before it can be uploaded.
const back = unzip(zipBuf);
const roundTripped = back.length === files.length &&
  back.every((f, i) => f.name === files[i].name && f.data.equals(files[i].data));
console.log(`verify     ${roundTripped ? "ok" : "FAILED"} — ${back.length} entries read back, CRCs match`);
if (!roundTripped) process.exit(1);

const byType = {};
for (const f of files) {
  const k = extname(f.name) || "other";
  byType[k] = (byType[k] || 0) + 1;
}
console.log(`contents   ${Object.entries(byType).map(([k, n]) => `${n}${k}`).join(" ")}`);

const required = ["index.html", "collection.html", "product.html", "404.html", "_headers", "_redirects", "assets/css/site.css", "assets/js/app.js"];
const missing = required.filter((r) => !files.some((f) => f.name === r));
if (missing.length) {
  console.error(`missing required files: ${missing.join(", ")}`);
  process.exit(1);
}
console.log(`required   all present`);

if (DRY_RUN) {
  const out = join(ROOT, "arabian-drops-deploy.zip");
  writeFileSync(out, zipBuf);
  console.log(`\ndry run — wrote ${out} (${(zipBuf.length / 1024).toFixed(1)} KB)`);
  console.log("drag this onto https://app.netlify.com/drop to publish without a token");
  process.exit(0);
}

const token = process.env.NETLIFY_AUTH_TOKEN;
if (!token) {
  console.error("\nNETLIFY_AUTH_TOKEN is not set.");
  console.error("Create one at https://app.netlify.com/user/applications#personal-access-tokens");
  console.error("then: NETLIFY_AUTH_TOKEN=... node tools/deploy.mjs");
  process.exit(1);
}

const API = "https://api.netlify.com/api/v1";
const auth = { Authorization: `Bearer ${token}` };

async function api(path, init = {}) {
  const res = await fetch(API + path, { ...init, headers: { ...auth, ...(init.headers || {}) } });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch (e) { json = null; }
  if (!res.ok) throw new Error(`${init.method || "GET"} ${path} → ${res.status} ${text.slice(0, 300)}`);
  return json;
}

let siteId = process.env.NETLIFY_SITE_ID;
if (siteId) {
  const site = await api(`/sites/${siteId}`);
  console.log(`site       reusing ${site.name} (${site.ssl_url || site.url})`);
} else {
  console.log(`site       creating "${SITE_NAME}"…`);
  const site = await api("/sites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: SITE_NAME }),
  });
  siteId = site.id;
  console.log(`site       created ${site.name} — ${site.ssl_url || site.url}`);
}

console.log("deploy     uploading…");
const deploy = await api(`/sites/${siteId}/deploys`, {
  method: "POST",
  headers: { "Content-Type": "application/zip" },
  body: zipBuf,
});

let state = deploy.state;
for (let i = 0; i < 60 && state !== "ready" && state !== "error"; i++) {
  await new Promise((r) => setTimeout(r, 2000));
  const d = await api(`/sites/${siteId}/deploys/${deploy.id}`);
  state = d.state;
  process.stdout.write(`\rdeploy     ${state}…   `);
}
console.log();

if (state !== "ready") {
  console.error(`deploy did not reach ready (state=${state})`);
  console.error(`inspect: https://app.netlify.com/sites/${siteId}/deploys`);
  process.exit(1);
}

const finished = await api(`/sites/${siteId}`);
console.log(`\nlive       ${finished.ssl_url || finished.url}`);
console.log(`admin      https://app.netlify.com/sites/${finished.name}`);
