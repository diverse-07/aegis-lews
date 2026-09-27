// Minimal static file server for local verification of arabian-drops/.
//
// The thread's single-file HTML preview serves only the HTML document, so
// relative asset paths (img/logo-mark-128.png) 404 there. This serves the whole
// folder the way a real static host does, so the reference implementation can be
// checked with its actual asset paths.
//
//   node tools/serve.mjs [port]
//
// Writes its pid to .preview-server.pid so the preview can be registered.

import { createServer } from "node:http";
import { readFile, writeFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, "..");
const port = Number(process.argv[2] || 8092);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

const server = createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    if (pathname === "/") pathname = "/index.html";

    // Contain every request inside ROOT.
    const target = resolve(join(ROOT, normalize(pathname)));
    if (!target.startsWith(ROOT)) {
      res.writeHead(403).end("Forbidden");
      return;
    }

    const info = await stat(target).catch(() => null);
    if (!info || info.isDirectory()) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("Not found");
      return;
    }

    const body = await readFile(target);
    res.writeHead(200, {
      "content-type": TYPES[extname(target).toLowerCase()] || "application/octet-stream",
      "content-length": body.length,
      "cache-control": "no-store",
    }).end(body);
  } catch (err) {
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" }).end(String(err));
  }
});

server.listen(port, "127.0.0.1", async () => {
  await writeFile(join(ROOT, ".preview-server.pid"), String(process.pid));
  console.log(`arabian-drops served on http://127.0.0.1:${port}/  (pid ${process.pid})`);
});
