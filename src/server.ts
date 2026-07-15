import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { cardTemplate, type ShareRecord } from "./card.ts";

const PB_URL = process.env.POCKETBASE_URL ?? "http://pocketbase.saegim.svc.cluster.local:8090";
const PORT = Number(process.env.PORT ?? 8080);

const fontData = await Bun.file(new URL("../assets/Pretendard-Regular.otf", import.meta.url)).arrayBuffer();

function isShareRecord(value: unknown): value is ShareRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    (record.kind === "item" || record.kind === "story") &&
    typeof record.title === "string"
  );
}

async function fetchShare(id: string): Promise<ShareRecord | null> {
  const res = await fetch(`${PB_URL}/api/collections/shares/records/${encodeURIComponent(id)}`);
  if (!res.ok) return null;
  const body: unknown = await res.json();
  return isShareRecord(body) ? body : null;
}

/** Escapes text for safe interpolation into HTML (P1: stored XSS — `title`
 * is attacker-controllable since `shares.createRule` is public). */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** The ingress terminates TLS and forwards plain HTTP internally, so
 * `url.origin` reports http:// even though the public page is https-only
 * (P2: broken/mixed-content og:image). Trust X-Forwarded-Proto/-Host when
 * present, otherwise assume https (this service is never served over plain
 * HTTP in production). */
function publicOrigin(req: Request, url: URL): string {
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? url.host;
  return `${proto}://${host}`;
}

async function renderCardPng(record: ShareRecord): Promise<Buffer> {
  // satori's declared param type is a React.ReactNode; our template is a
  // structurally-identical plain-object tree (no React runtime involved) —
  // the cast is the documented interop point for that library boundary.
  const svg = await satori(cardTemplate(record) as unknown as Parameters<typeof satori>[0], {
    width: 1200,
    height: 630,
    fonts: [{ name: "Pretendard", data: fontData, weight: 400, style: "normal" }],
  });
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } });
  return resvg.render().asPng();
}

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/healthz") {
      return new Response("ok", { status: 200 });
    }

    const cardMatch = url.pathname.match(/^\/s\/([^/]+)\/card\.png$/);
    if (cardMatch) {
      const id = cardMatch[1];
      const record = await fetchShare(id);
      if (!record) return new Response("not found", { status: 404 });
      const png = await renderCardPng(record);
      return new Response(png, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    const pageMatch = url.pathname.match(/^\/s\/([^/]+)$/);
    if (pageMatch) {
      const id = pageMatch[1];
      const record = await fetchShare(id);
      if (!record) return new Response("not found", { status: 404 });
      const cardUrl = `${publicOrigin(req, url)}/s/${id}/card.png`;
      const safeTitle = escapeHtml(record.title);
      const html = `<!doctype html><html><head>
<meta property="og:image" content="${cardUrl}" />
<meta property="og:title" content="${safeTitle}" />
<title>${safeTitle} · Saegim</title>
</head><body><img src="${cardUrl}" alt="${safeTitle}" /></body></html>`;
      return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    return new Response("not found", { status: 404 });
  },
});

console.log(`saegim-share-renderer listening on :${PORT}`);
