// V11 수신자 페이지 확장 (SAEGIM-49): 카드 이미지 → 행동 가능한 초대장.
// - .ics 다운로드 (startAtISO 있을 때만, 만료 시 숨김)
// - Apple 지도 링크 — **이름만** (프라이버시 캐논 02 §5/§8: 좌표는 절대
//   기기 밖으로 나가지 않는다. 서버는 애초에 좌표를 받은 적이 없다.)
// - 설치 CTA (성장 루프 폐곡선 10 §4.1: 수신자 → 설치)
// - 만료 플레이스홀더 (시작 +24h 경과 → "지난 약속" 배너, ics 숨김)
import type { ShareRecord } from "./card.ts";

const APP_URL = process.env.APP_STORE_URL ?? "https://justsend.cloud";
const EXPIRY_MS = 24 * 60 * 60 * 1000;

function startAt(record: ShareRecord): Date | null {
  const iso = record.payload?.startAtISO;
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isExpired(record: ShareRecord, now: Date): boolean {
  const start = startAt(record);
  if (!start) return false;
  return now.getTime() - start.getTime() > EXPIRY_MS;
}

/** RFC 5545 §3.3.11 TEXT escaping: backslash, semicolon, comma, newline. */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function icsUTC(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

/** VCALENDAR for the shared appointment — null without a machine-readable
 * start (formatted display strings are not parseable). Default 1h duration. */
export function buildICS(record: ShareRecord, id: string): string | null {
  const start = startAt(record);
  if (!start) return null;
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Saegim//share//KO",
    "BEGIN:VEVENT",
    `UID:saegim-${id}@justsend.cloud`,
    `DTSTAMP:${icsUTC(new Date())}`,
    `DTSTART:${icsUTC(start)}`,
    `DTEND:${icsUTC(end)}`,
    `SUMMARY:${escapeICS(record.title)}`,
  ];
  if (record.locationName) lines.push(`LOCATION:${escapeICS(record.locationName)}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const buttonCss =
  "display:inline-flex;align-items:center;gap:8px;padding:12px 20px;border-radius:14px;" +
  "font-weight:600;font-size:15px;text-decoration:none";

/** 수신자 웹 페이지: OG 메타(미리보기) + 카드 이미지 + 행동 버튼들. */
export function buildSharePage(
  record: ShareRecord,
  id: string,
  cardUrl: string,
  now: Date
): string {
  const safeTitle = escapeHtml(record.title);
  const safeSubtitle = record.subtitle ? escapeHtml(record.subtitle) : null;
  const expired = isExpired(record, now);
  const hasICS = !expired && startAt(record) !== null;

  const buttons: string[] = [];
  if (hasICS) {
    buttons.push(
      `<a href="/s/${encodeURIComponent(id)}/event.ics" style="${buttonCss};background:#E24E68;color:#fff">📅 내 캘린더에 추가</a>`
    );
  }
  if (record.locationName && !expired) {
    // 이름만 — 좌표는 서버에 존재하지 않는다 (02 §5/§8).
    const q = encodeURIComponent(record.locationName);
    buttons.push(
      `<a href="https://maps.apple.com/?q=${q}" style="${buttonCss};background:#EDEFF3;color:#1C1E26">🧭 지도에서 보기</a>`
    );
  }
  buttons.push(
    `<a href="${APP_URL}" style="${buttonCss};background:#1C1E26;color:#fff">새김에서 나도 기록하기</a>`
  );

  const banner = expired
    ? `<div style="margin-bottom:16px;padding:10px 16px;border-radius:12px;background:#EDEFF3;color:#6B7280;font-size:14px;font-weight:600">지난 약속이에요</div>`
    : "";

  return `<!doctype html><html lang="ko"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta property="og:image" content="${cardUrl}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:title" content="${safeTitle}" />
${safeSubtitle ? `<meta property="og:description" content="${safeSubtitle}" />\n` : ""}<meta name="twitter:card" content="summary_large_image" />
<title>${safeTitle} · Saegim</title>
</head><body style="margin:0;display:flex;flex-direction:column;justify-content:center;align-items:center;min-height:100vh;background:#F6F7F9;font-family:-apple-system,'Pretendard',sans-serif;padding:24px;box-sizing:border-box">
${banner}<img src="${cardUrl}" alt="${safeTitle}" style="max-width:100%;height:auto;border-radius:20px;box-shadow:0 8px 32px rgba(28,30,38,.12)" />
<div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-top:24px">${buttons.join("")}</div>
<p style="margin-top:20px;color:#9AA1AD;font-size:12px">새김 — 나와의 대화가 기록이 되는 곳</p>
</body></html>`;
}
