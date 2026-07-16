// Local design-review harness: renders both card families to PNG without PB.
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { cardTemplate, type ShareRecord } from "../src/card.ts";

const fontRegular = await Bun.file(new URL("../assets/Pretendard-Regular.otf", import.meta.url)).arrayBuffer();
const fontSemiBold = await Bun.file(new URL("../assets/Pretendard-SemiBold.otf", import.meta.url)).arrayBuffer();
const fontBold = await Bun.file(new URL("../assets/Pretendard-Bold.otf", import.meta.url)).arrayBuffer();

async function render(record: ShareRecord, out: string) {
  const svg = await satori(cardTemplate(record) as unknown as Parameters<typeof satori>[0], {
    width: 1200,
    height: 630,
    fonts: [
      { name: "Pretendard", data: fontRegular, weight: 400, style: "normal" },
      { name: "Pretendard", data: fontSemiBold, weight: 600, style: "normal" },
      { name: "Pretendard", data: fontBold, weight: 700, style: "normal" },
    ],
  });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
  await Bun.write(out, png);
  console.log("wrote", out);
}

await render({
  kind: "item",
  title: "성수 카페 미팅",
  locationName: "어니언 성수",
  shareAlias: "민지",
  payload: {
    dateText: "7월 17일 (금)",
    timeText: "오후 3:00",
    weather: { icon: "rain", tempC: 26, precipProb: 60, headline: "비 소식, 우산 챙기세요" },
  },
}, "/tmp/saegim-ref/card-item.png");

await render({
  kind: "story",
  title: "오늘의 새김",
  subtitle: "완료 4건 · 사진 2장",
  payload: {
    dateText: "7월 16일 목요일",
    line: "달리기로 시작해 저녁 준비까지, 꽉 찬 하루",
    moments: ["달리기", "영어 단어", "장보기", "우산 챙기기"],
  },
}, "/tmp/saegim-ref/card-story.png");
