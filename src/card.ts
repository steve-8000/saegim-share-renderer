// OG card JSX-shape template for Satori (00 §8, 02 §2.6 design tokens — hex
// values transcribed from docs/design/prototype/assets/tokens.css light theme).
//
// Two card families, deliberately distinct:
//  - kind=item  → 약속 카드: light, information-first (날짜·시간·장소·사람·날씨).
//    메신저 미리보기가 그대로 초대장이 된다.
//  - kind=story → 하루 카드: dark, mood-first (자동 한 줄 + 완료 모먼트).
//    기록을 자랑할 수 있는 인스타 감성.
//
// Privacy canon (02 §5/§8): only `shareAlias`/`locationName`/pre-formatted
// display strings are ever rendered — no real contact names, no coordinates.

export interface SharePayload {
  dateText?: string;
  timeText?: string;
  /// V11: 기계가독 시작시각(ISO8601 UTC) — .ics 생성·만료 판정용.
  startAtISO?: string;
  line?: string;
  moments?: string[];
  weather?: {
    icon?: string; // "sun" | "cloud-sun" | "cloud" | "rain" | "snow"
    tempC?: number;
    precipProb?: number;
    headline?: string;
  };
}

export interface ShareRecord {
  kind: "item" | "story";
  title: string;
  subtitle?: string;
  shareAlias?: string;
  locationName?: string;
  payload?: SharePayload | null;
}

/** Minimal Satori element shape — avoids depending on React's JSX types. */
interface SatoriNode {
  type: string;
  props: {
    style?: Record<string, string | number>;
    children?: SatoriNode | SatoriNode[] | string | (SatoriNode | null)[];
  };
}

const tokens = {
  bg: "#F6F7F9",
  bgElevated: "#FFFFFF",
  bgInset: "#ECEEF2",
  fg: "#1B1E28",
  fgMuted: "#606776",
  fgFaint: "#9AA1AE",
  border: "#DDE1E8",
  accent: "#D12E64",
  accentSoft: "rgba(209,46,100,0.10)",
  entityPlace: "#2F7A55",
  entityPerson: "#2668C5",
  // 스토리 카드(다크 무드 고정 — OG 이미지는 테마가 없다)
  storyBg0: "#17131A",
  storyBg1: "#341B28",
  storyFg: "#F4F1F3",
  storyMuted: "#B9AEB8",
  // 날씨 의미색 (아이콘 전용)
  sun: "#F5B23E",
  cloud: "#B8C0CE",
  rain: "#5B8DEF",
  snow: "#A9C7EE",
};

function el(
  type: string,
  style: Record<string, string | number>,
  children?: SatoriNode | SatoriNode[] | string | (SatoriNode | null)[]
): SatoriNode {
  return { type, props: { style, children } };
}

function textNode(text: string, style: Record<string, string | number>): SatoriNode {
  return el("div", { display: "flex", ...style }, text);
}

// MARK: - 워드마크

function wordmark(color: string): SatoriNode {
  return el(
    "div",
    { display: "flex", alignItems: "center", gap: 8 },
    [
      textNode("SAEGIM", {
        fontSize: 24,
        fontWeight: 600,
        color,
        letterSpacing: "0.1em",
      }),
      el("div", {
        width: 8,
        height: 8,
        borderRadius: 999,
        backgroundColor: tokens.accent,
        display: "flex",
      }),
    ]
  );
}

// MARK: - 날씨 아이콘 (레이어드 div — 외부 에셋 없이 그린다)

function weatherIcon(kind: string, size = 88): SatoriNode {
  const cloudBlob = (top: number, left: number, w: number, color: string) =>
    el("div", {
      position: "absolute",
      top,
      left,
      width: w,
      height: w * 0.62,
      borderRadius: 999,
      backgroundColor: color,
      display: "flex",
    });
  const drop = (left: number, color: string, h = size * 0.2) =>
    el("div", {
      position: "absolute",
      bottom: 0,
      left,
      width: size * 0.07,
      height: h,
      borderRadius: 999,
      backgroundColor: color,
      transform: "rotate(18deg)",
      display: "flex",
    });

  const children: SatoriNode[] = [];
  switch (kind) {
    case "sun":
      children.push(
        el("div", {
          position: "absolute",
          top: size * 0.14,
          left: size * 0.14,
          width: size * 0.72,
          height: size * 0.72,
          borderRadius: 999,
          backgroundColor: tokens.sun,
          display: "flex",
        })
      );
      break;
    case "cloud-sun":
      children.push(
        el("div", {
          position: "absolute",
          top: size * 0.08,
          left: size * 0.4,
          width: size * 0.42,
          height: size * 0.42,
          borderRadius: 999,
          backgroundColor: tokens.sun,
          display: "flex",
        }),
        cloudBlob(size * 0.34, size * 0.06, size * 0.62, tokens.cloud),
        cloudBlob(size * 0.42, size * 0.34, size * 0.52, "#CBD2DE")
      );
      break;
    case "rain":
      children.push(
        cloudBlob(size * 0.1, size * 0.1, size * 0.66, tokens.cloud),
        cloudBlob(size * 0.2, size * 0.38, size * 0.54, "#CBD2DE"),
        drop(size * 0.24, tokens.rain),
        drop(size * 0.46, tokens.rain, size * 0.26),
        drop(size * 0.68, tokens.rain)
      );
      break;
    case "snow":
      children.push(
        cloudBlob(size * 0.1, size * 0.1, size * 0.66, tokens.cloud),
        cloudBlob(size * 0.2, size * 0.38, size * 0.54, "#CBD2DE"),
        ...[0.26, 0.5, 0.72].map((x) =>
          el("div", {
            position: "absolute",
            bottom: size * 0.04,
            left: size * x,
            width: size * 0.1,
            height: size * 0.1,
            borderRadius: 999,
            backgroundColor: tokens.snow,
            display: "flex",
          })
        )
      );
      break;
    default: // "cloud"
      children.push(
        cloudBlob(size * 0.18, size * 0.08, size * 0.7, tokens.cloud),
        cloudBlob(size * 0.3, size * 0.4, size * 0.54, "#CBD2DE")
      );
  }
  return el("div", { position: "relative", width: size, height: size, display: "flex" }, children);
}

// MARK: - 슬롯 행 (앱의 어셈블리 카드와 같은 문법: 의미색 도트 + 값)

function slotRow(dotColor: string, text: string, opts: { bold?: boolean } = {}): SatoriNode {
  return el(
    "div",
    { display: "flex", alignItems: "center", gap: 16, marginTop: 22 },
    [
      el("div", {
        width: 12,
        height: 12,
        borderRadius: 999,
        backgroundColor: dotColor,
        display: "flex",
      }),
      textNode(text, {
        fontSize: 30,
        fontWeight: opts.bold ? 600 : 400,
        color: tokens.fg,
      }),
    ]
  );
}

// MARK: - 약속 카드 (kind=item)

function itemCard(record: ShareRecord): SatoriNode {
  const payload = record.payload ?? {};
  const weather = payload.weather;

  const dateLine = [payload.dateText, payload.timeText].filter(Boolean).join(" · ");

  const leftChildren: (SatoriNode | null)[] = [
    textNode(record.title, {
      fontSize: 54,
      fontWeight: 700,
      color: tokens.fg,
      lineHeight: 1.25,
      maxWidth: 640,
    }),
    dateLine ? slotRow(tokens.accent, dateLine, { bold: true }) : null,
    record.locationName ? slotRow(tokens.entityPlace, record.locationName) : null,
    // Cannon (02 §5/§8): contact real name never appears here — alias only.
    record.shareAlias ? slotRow(tokens.entityPerson, `${record.shareAlias}와 함께`) : null,
  ];

  const weatherPanel = weather
    ? el(
        "div",
        {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: tokens.bgInset,
          borderRadius: 24,
          padding: "36px 44px",
          gap: 8,
        },
        [
          weatherIcon(weather.icon ?? "cloud"),
          weather.tempC != null
            ? textNode(`${Math.round(weather.tempC)}°`, {
                fontSize: 52,
                fontWeight: 700,
                color: tokens.fg,
              })
            : null,
          weather.precipProb != null
            ? textNode(`강수 ${Math.round(weather.precipProb)}%`, {
                fontSize: 22,
                color: tokens.fgMuted,
              })
            : null,
          weather.headline
            ? textNode(weather.headline, { fontSize: 20, color: tokens.fgMuted })
            : null,
        ].filter(Boolean) as SatoriNode[]
      )
    : null;

  return el(
    "div",
    {
      width: "1200px",
      height: "630px",
      display: "flex",
      flexDirection: "column",
      backgroundImage: "linear-gradient(135deg, #FFFFFF 0%, #FBEFF4 100%)",
      padding: "52px 60px",
      fontFamily: "Pretendard",
    },
    [
      // 헤더: 워드마크 + 카드 종류
      el("div", { display: "flex", justifyContent: "space-between", alignItems: "center" }, [
        wordmark(tokens.accent),
        textNode("약속", {
          fontSize: 22,
          fontWeight: 600,
          color: tokens.accent,
          backgroundColor: tokens.accentSoft,
          padding: "8px 20px",
          borderRadius: 999,
        }),
      ]),
      // 본문 카드
      el(
        "div",
        {
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          flexGrow: 1,
          backgroundColor: tokens.bgElevated,
          borderRadius: 28,
          padding: "52px 56px",
          marginTop: 32,
          boxShadow: "0 16px 48px rgba(30,20,30,0.10)",
          border: `1px solid ${tokens.border}`,
        },
        [
          el("div", { display: "flex", flexDirection: "column" }, leftChildren),
          weatherPanel,
        ].filter(Boolean) as SatoriNode[]
      ),
      textNode("새김으로 만든 약속 카드 · justsend.cloud", {
        fontSize: 20,
        color: tokens.fgFaint,
        marginTop: 28,
      }),
    ]
  );
}

// MARK: - 하루 카드 (kind=story)

function storyCard(record: ShareRecord): SatoriNode {
  const payload = record.payload ?? {};
  const line = payload.line ?? record.title;
  const moments = (payload.moments ?? []).slice(0, 4);

  return el(
    "div",
    {
      width: "1200px",
      height: "630px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      backgroundImage: `linear-gradient(150deg, ${tokens.storyBg0} 0%, ${tokens.storyBg1} 100%)`,
      padding: "56px 64px",
      fontFamily: "Pretendard",
    },
    [
      el("div", { display: "flex", justifyContent: "space-between", alignItems: "center" }, [
        wordmark(tokens.storyFg),
        payload.dateText
          ? textNode(payload.dateText, { fontSize: 24, color: tokens.storyMuted })
          : null,
      ].filter(Boolean) as SatoriNode[]),
      // 자동 생성 한 줄이 카드의 주인공
      textNode(line, {
        fontSize: 58,
        fontWeight: 700,
        color: tokens.storyFg,
        lineHeight: 1.35,
        maxWidth: 1000,
      }),
      el("div", { display: "flex", flexDirection: "column" }, [
        record.subtitle
          ? textNode(record.subtitle, {
              fontSize: 24,
              fontWeight: 600,
              color: "#F0A9C4",
              marginBottom: moments.length > 0 ? 20 : 0,
            })
          : null,
        moments.length > 0
          ? el(
              "div",
              { display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 14 },
              moments.map((moment) =>
                el(
                  "div",
                  { display: "flex", alignItems: "center", gap: 10 },
                  [
                    el("div", {
                      width: 9,
                      height: 9,
                      borderRadius: 999,
                      backgroundColor: tokens.accent,
                      display: "flex",
                    }),
                    textNode(moment, {
                      fontSize: 26,
                      color: tokens.storyMuted,
                      marginRight: 18,
                    }),
                  ]
                )
              )
            )
          : null,
      ].filter(Boolean) as SatoriNode[]),
    ]
  );
}

export function cardTemplate(record: ShareRecord): SatoriNode {
  return record.kind === "story" ? storyCard(record) : itemCard(record);
}
