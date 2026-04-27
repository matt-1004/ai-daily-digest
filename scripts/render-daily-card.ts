import { basename, dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

interface DailyMeta {
  today: string;
  counts: {
    canonicalItems: number;
    dailyItems: number;
    weeklyNews: number;
    weeklyDeepDives: number;
  };
}

interface DailyItem {
  rank: string;
  title: string;
  summary: string;
  source: string;
}

const [dailyPath, metaPath, svgPath, pngPath] = process.argv.slice(2);

if (!dailyPath || !metaPath || !svgPath) {
  console.error("Usage: bun run scripts/render-daily-card.ts <daily.md> <meta.json> <out.svg> [out.png]");
  process.exit(1);
}

const dailyMarkdown = await Bun.file(dailyPath).text();
const meta = JSON.parse(await Bun.file(metaPath).text()) as DailyMeta;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function trimText(value: string, maxLength: number): string {
  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length > maxLength ? `${compact.slice(0, maxLength - 1)}…` : compact;
}

function wrapText(value: string, maxChars: number, maxLines: number): string[] {
  const chars = [...value.replace(/\s+/g, " ").trim()];
  const lines: string[] = [];
  let line = "";

  for (const char of chars) {
    if ([...line, char].length > maxChars) {
      lines.push(line);
      line = char;
      if (lines.length >= maxLines) break;
      continue;
    }
    line += char;
  }

  if (line && lines.length < maxLines) lines.push(line);
  if (lines.length === maxLines && chars.length > lines.join("").length) {
    lines[lines.length - 1] = `${lines[lines.length - 1].slice(0, Math.max(0, maxChars - 1))}…`;
  }

  return lines;
}

function extractJudgements(markdown: string): string[] {
  const match = markdown.match(/## 今日判断\n\n([\s\S]*?)\n\n## 今日已验证动态/);
  if (!match) return [];

  return match[1]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.replace(/^- /, ""))
    .slice(0, 3);
}

function extractItems(markdown: string): DailyItem[] {
  const itemBlocks = markdown.split(/\n### /).slice(1);

  return itemBlocks.slice(0, 4).map((block) => {
    const lines = block.split("\n");
    const heading = lines[0].trim();
    const headingMatch = heading.match(/^(\d+)\.\s+(.+)$/);
    const rank = headingMatch?.[1] || "";
    const title = headingMatch?.[2] || heading;
    const summary = lines.find((line) => line.startsWith("- 一句话："))?.replace("- 一句话：", "").trim() || "";
    const source = lines.find((line) => line.startsWith("- 来源："))?.replace("- 来源：", "").trim() || "";

    return {
      rank,
      title: trimText(title, 72),
      summary: trimText(summary, 62),
      source: trimText(source, 30),
    };
  });
}

const judgements = extractJudgements(dailyMarkdown);
const items = extractItems(dailyMarkdown);
const generatedAt = dailyMarkdown.match(/- 生成时间：(.+)/)?.[1]?.trim() || meta.today;
const rejectedCount = dailyMarkdown.match(/已延后或剔除条目：(\d+)/)?.[1] || "";

function textLines(lines: string[], x: number, y: number, className: string, lineHeight: number): string {
  return lines
    .map((line, index) => `<text class="${className}" x="${x}" y="${y + index * lineHeight}">${escapeXml(line)}</text>`)
    .join("\n");
}

const itemMarkup = items
  .map((item, index) => {
    const y = 825 + index * 130;
    const titleLines = wrapText(item.title, 34, 2);
    const summaryLines = wrapText(item.summary, 46, 2);
    return `
      <g transform="translate(120 ${y})">
        ${index > 0 ? '<line class="divider" x1="0" y1="-20" x2="1360" y2="-20"/>' : ""}
        <rect class="rankBox" x="0" y="0" width="72" height="72" rx="20" fill="${index < 2 ? "#0c7f8d" : "#d7902e"}"/>
        <text class="rank" x="36" y="48" text-anchor="middle">${escapeXml(item.rank)}</text>
        <text class="source" x="1320" y="36" text-anchor="end">${escapeXml(item.source)}</text>
        ${textLines(titleLines, 102, 24, "itemTitle", 34)}
        ${textLines(summaryLines, 102, 87, "itemText", 27)}
      </g>
    `;
  })
  .join("\n");

const judgementMarkup = judgements
  .map((judgement, index) => {
    const lines = wrapText(judgement, 13, 3);
    return `
      <g transform="translate(${120 + index * 455} 495)">
        <rect class="judgement" x="0" y="0" width="440" height="150"/>
        <text class="judgementNo" x="32" y="42">0${index + 1}</text>
        ${textLines(lines, 32, 82, "judgementText", 31)}
      </g>
    `;
  })
  .join("\n");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1600" viewBox="0 0 1600 1600" role="img" aria-labelledby="title desc">
  <title id="title">AI 日报 ${escapeXml(meta.today)} 配图</title>
  <desc id="desc">用于飞书群发布的 AI Daily Digest 日报图片。</desc>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f6f3ec"/>
      <stop offset="0.45" stop-color="#e8f2ee"/>
      <stop offset="1" stop-color="#fff6e4"/>
    </linearGradient>
    <linearGradient id="head" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#102b32"/>
      <stop offset="0.62" stop-color="#0f676d"/>
      <stop offset="1" stop-color="#253956"/>
    </linearGradient>
    <filter id="shadow" x="-12%" y="-12%" width="124%" height="124%">
      <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#20343b" flood-opacity="0.16"/>
    </filter>
    <style>
      .bg { fill: url(#bg); }
      .header { fill: url(#head); }
      .panel { fill: rgba(255,255,255,0.86); stroke: rgba(21,77,78,0.16); stroke-width: 1.4; filter: url(#shadow); }
      .judgement { fill: #ffffff; stroke: rgba(21,77,78,0.16); stroke-width: 1.2; rx: 22; }
      .divider { stroke: rgba(20,61,65,0.13); stroke-width: 1.4; }
      .title { fill: #fffefa; font-family: "PingFang SC", "Microsoft YaHei", sans-serif; font-size: 104px; font-weight: 900; letter-spacing: 0; }
      .date { fill: #dcefe9; font-family: "PingFang SC", "Microsoft YaHei", sans-serif; font-size: 32px; letter-spacing: 0; }
      .sub { fill: #f2c45b; font-family: "PingFang SC", "Microsoft YaHei", sans-serif; font-size: 29px; font-weight: 720; letter-spacing: 0; }
      .kicker { fill: #dcefe9; font-family: "PingFang SC", "Microsoft YaHei", sans-serif; font-size: 25px; font-weight: 650; letter-spacing: 0; }
      .section { fill: #102b32; font-family: "PingFang SC", "Microsoft YaHei", sans-serif; font-size: 42px; font-weight: 860; letter-spacing: 0; }
      .metric { fill: #102b32; font-family: "PingFang SC", "Microsoft YaHei", sans-serif; font-size: 58px; font-weight: 900; letter-spacing: 0; }
      .metricLabel { fill: #60787c; font-family: "PingFang SC", "Microsoft YaHei", sans-serif; font-size: 23px; letter-spacing: 0; }
      .judgementNo { fill: #0c7f8d; font-family: "PingFang SC", "Microsoft YaHei", sans-serif; font-size: 28px; font-weight: 850; letter-spacing: 0; }
      .judgementText { fill: #24484b; font-family: "PingFang SC", "Microsoft YaHei", sans-serif; font-size: 25px; font-weight: 650; letter-spacing: 0; }
      .itemTitle { fill: #123238; font-family: "PingFang SC", "Microsoft YaHei", sans-serif; font-size: 33px; font-weight: 820; letter-spacing: 0; }
      .itemText { fill: #496467; font-family: "PingFang SC", "Microsoft YaHei", sans-serif; font-size: 26px; letter-spacing: 0; }
      .source { fill: #0c7f8d; font-family: "PingFang SC", "Microsoft YaHei", sans-serif; font-size: 24px; font-weight: 720; letter-spacing: 0; }
      .rank { fill: #ffffff; font-family: "PingFang SC", "Microsoft YaHei", sans-serif; font-size: 32px; font-weight: 860; letter-spacing: 0; }
      .foot { fill: #6d8084; font-family: "PingFang SC", "Microsoft YaHei", sans-serif; font-size: 24px; letter-spacing: 0; }
      .brand { fill: #102b32; font-family: "PingFang SC", "Microsoft YaHei", sans-serif; font-size: 26px; font-weight: 780; letter-spacing: 0; }
    </style>
  </defs>
  <rect class="bg" width="1600" height="1600"/>
  <path d="M1320 0H1600V1600H1420C1510 1245 1516 882 1438 532C1398 353 1361 177 1320 0Z" fill="#f2b84b" opacity="0.16"/>
  <path d="M0 1190C155 1102 312 1128 430 1248C534 1354 624 1436 760 1454V1600H0Z" fill="#0c7f8d" opacity="0.11"/>
  <rect class="header" x="80" y="70" width="1440" height="320" rx="46"/>
  <text class="sub" x="124" y="144">AI DAILY DIGEST</text>
  <text class="title" x="120" y="260">AI 日报</text>
  <text class="kicker" x="124" y="326">Codex 生成 · 可核验事实 · 低信号延后观察</text>
  <text class="date" x="875" y="178">${escapeXml(generatedAt)}</text>
  <text class="date" x="875" y="232">今日精选 ${meta.counts.dailyItems} 条</text>
  <text class="date" x="875" y="286">完整内容见飞书云文档</text>

  <rect class="panel" x="80" y="430" width="1440" height="245" rx="38"/>
  <text class="section" x="120" y="490">今日判断</text>
  ${judgementMarkup}

  <rect class="panel" x="80" y="710" width="1440" height="665" rx="38"/>
  <text class="section" x="120" y="775">今日已验证动态 TOP 4</text>
  ${itemMarkup}

  <rect class="panel" x="80" y="1390" width="1440" height="130" rx="38"/>
  <g transform="translate(122 1450)">
    <text class="metric" x="0" y="0">${meta.counts.canonicalItems}</text>
    <text class="metricLabel" x="0" y="40">canonical items</text>
    <text class="metric" x="330" y="0">${meta.counts.dailyItems}</text>
    <text class="metricLabel" x="330" y="40">日报条目</text>
    <text class="metric" x="610" y="0">${meta.counts.weeklyNews}</text>
    <text class="metricLabel" x="610" y="40">周报新闻</text>
    <text class="metric" x="920" y="0">${rejectedCount || "—"}</text>
    <text class="metricLabel" x="920" y="40">延后观察</text>
  </g>
  <text class="brand" x="120" y="1570">Generated by Codex · content-collector-bot</text>
  <text class="foot" x="1100" y="1570">发送至 AI Daily Digest 飞书群</text>
</svg>
`;

await Bun.write(svgPath, svg);

if (pngPath) {
  const outDir = dirname(svgPath);
  const result = spawnSync("qlmanage", ["-t", "-s", "1600", "-o", outDir, svgPath], {
    stdio: "pipe",
  });

  if (result.status !== 0) {
    console.error(result.stderr.toString("utf8") || result.stdout.toString("utf8"));
    process.exit(result.status || 1);
  }

  const generatedPng = join(outDir, `${basename(svgPath)}.png`);
  if (generatedPng !== pngPath) {
    await Bun.write(pngPath, Bun.file(generatedPng));
  }
}
