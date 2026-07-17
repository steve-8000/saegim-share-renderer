import { describe, expect, test } from "bun:test";
import { buildICS, buildSharePage, isExpired } from "../src/page.ts";
import type { ShareRecord } from "../src/card.ts";

const base: ShareRecord = {
  kind: "item",
  title: "민지랑 커피",
  shareAlias: "민지",
  locationName: "성수 카페",
  payload: {
    dateText: "7월 20일 (월)",
    timeText: "오후 3:00",
    startAtISO: "2026-07-20T06:00:00Z",
  },
};

describe("buildICS (s1)", () => {
  test("VCALENDAR with DTSTART/DTEND/SUMMARY, CRLF line endings", () => {
    const ics = buildICS(base, "abc123")!;
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("DTSTART:20260720T060000Z");
    // default duration 1h
    expect(ics).toContain("DTEND:20260720T070000Z");
    expect(ics).toContain("SUMMARY:민지랑 커피");
    expect(ics).toContain("UID:saegim-abc123@saegim.one");
    expect(ics).toContain("END:VCALENDAR");
    // RFC 5545: CRLF
    for (const line of ics.split("\r\n")) {
      expect(line).not.toContain("\n");
    }
    expect(ics.includes("\r\n")).toBe(true);
  });

  test("returns null without startAtISO", () => {
    const noStart: ShareRecord = { ...base, payload: { dateText: "내일" } };
    expect(buildICS(noStart, "x")).toBeNull();
    expect(buildICS({ ...base, payload: null }, "x")).toBeNull();
  });

  test("escapes ICS special characters in SUMMARY/LOCATION", () => {
    const tricky: ShareRecord = {
      ...base,
      title: "a;b,c\nd\\e",
      locationName: "카페; 2호점",
    };
    const ics = buildICS(tricky, "x")!;
    expect(ics).toContain("SUMMARY:a\\;b\\,c\\nd\\\\e");
    expect(ics).toContain("LOCATION:카페\\; 2호점");
  });
});

describe("isExpired (s2)", () => {
  test("expired 24h after start, not before", () => {
    const now = new Date("2026-07-21T05:00:00Z"); // 23h after
    expect(isExpired(base, now)).toBe(false);
    const later = new Date("2026-07-21T07:00:00Z"); // 25h after
    expect(isExpired(base, later)).toBe(true);
  });

  test("never expired without startAtISO", () => {
    expect(isExpired({ ...base, payload: null }, new Date("2100-01-01T00:00:00Z"))).toBe(false);
  });
});

describe("buildSharePage (s2)", () => {
  const cardUrl = "https://share.saegim.one/s/abc/card.png";

  test("has ics button, maps link by name only, install CTA", () => {
    const html = buildSharePage(base, "abc", cardUrl, new Date("2026-07-19T00:00:00Z"));
    expect(html).toContain('href="/s/abc/event.ics"');
    // Apple Maps by name only — no coordinates anywhere.
    expect(html).toContain("maps.apple.com/?q=");
    expect(html).toContain(encodeURIComponent("성수 카페"));
    expect(html).not.toMatch(/ll=|lat|lng|37\.\d|126\.\d/);
    // install CTA always present
    expect(html).toContain("saegim.one");
    expect(html).toContain("새김");
    // OG preserved
    expect(html).toContain('property="og:image"');
  });

  test("omits ics button without startAtISO; keeps CTA", () => {
    const noStart: ShareRecord = { kind: "item", title: "제목만", payload: null };
    const html = buildSharePage(noStart, "abc", cardUrl, new Date());
    expect(html).not.toContain("event.ics");
    expect(html).not.toContain("maps.apple.com");
    expect(html).toContain("새김");
  });

  test("expired record shows past-appointment banner", () => {
    const html = buildSharePage(base, "abc", cardUrl, new Date("2026-07-22T00:00:00Z"));
    expect(html).toContain("지난 약속");
    // ics button suppressed when expired
    expect(html).not.toContain("event.ics");
  });

  test("escapes title in HTML", () => {
    const xss: ShareRecord = { kind: "item", title: '<script>alert(1)</script>' };
    const html = buildSharePage(xss, "abc", cardUrl, new Date());
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
  });
});
