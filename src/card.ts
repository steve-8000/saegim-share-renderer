// OG card JSX-shape template for Satori (00 §8, 02 §2.6 design tokens — hex
// values transcribed from docs/design/prototype/assets/tokens.css light theme).

export interface ShareRecord {
  kind: "item" | "story";
  title: string;
  subtitle?: string;
  shareAlias?: string;
  locationName?: string;
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
  fg: "#1B1E28",
  fgMuted: "#606776",
  accent: "#D12E64",
};

function textNode(text: string, style: Record<string, string | number>): SatoriNode {
  return { type: "div", props: { style, children: text } };
}

export function cardTemplate(record: ShareRecord): SatoriNode {
  const cardChildren: (SatoriNode | null)[] = [
    textNode(record.title, { fontSize: 48, fontWeight: 700, color: tokens.fg }),
    record.subtitle
      ? textNode(record.subtitle, { fontSize: 28, color: tokens.accent, marginTop: 16 })
      : null,
    record.locationName
      ? textNode(record.locationName, { fontSize: 22, color: tokens.fgMuted, marginTop: 12 })
      : null,
    // Cannon (02 §5/§8): contact real name never appears here — alias only.
    record.shareAlias
      ? textNode(`with ${record.shareAlias}`, { fontSize: 20, color: tokens.fgMuted, marginTop: 24 })
      : null,
  ];

  return {
    type: "div",
    props: {
      style: {
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: tokens.bg,
        padding: "64px",
        fontFamily: "Pretendard",
      },
      children: [
        textNode("SAEGIM", {
          fontSize: 22,
          fontWeight: 600,
          color: tokens.accent,
          letterSpacing: "0.08em",
        }),
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              backgroundColor: tokens.bgElevated,
              borderRadius: 24,
              padding: "48px",
              boxShadow: "0 12px 40px rgba(20,20,30,0.12)",
            },
            children: cardChildren,
          },
        },
      ],
    },
  };
}
