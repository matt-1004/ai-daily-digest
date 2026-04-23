import { assessEditorialValue, buildEditorialHighlights } from "../core/editorial.ts";
import { evaluateVerification } from "../core/verification.ts";
import type { CandidateItem, Confidence } from "../types/content.ts";

const SHANGHAI_DATE_TIME = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const SHANGHAI_DATE = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const REASON_LABELS: Record<string, string> = {
  "primary source is the original announcement": "一手来源，属于原始公告",
  "secondary source is missing an original source link": "二手来源未附原始出处链接",
  "secondary source points to an original source": "二手来源已回链到原始出处",
  "event lacks independent corroboration": "事件仍缺少独立来源交叉验证",
  "event is corroborated by independent outlets": "事件已有独立来源交叉验证",
  "analysis source requires an original source before daily promotion":
    "分析型来源可用于周报，但进入日报前仍需回到原始出处",
  "discovery source has no original evidence": "线索源没有原始证据",
  "discovery source cannot be promoted directly": "线索源不能直接进入正式简报",
};

export function formatShanghaiDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${SHANGHAI_DATE_TIME.format(date)} Asia/Shanghai`;
}

export function formatShanghaiDate(value = new Date()): string {
  return SHANGHAI_DATE.format(value);
}

export function translateConfidence(confidence: Confidence): string {
  if (confidence === "high") return "高";
  if (confidence === "medium") return "中";
  return "低";
}

export function translateReasons(reasons: string[]): string {
  return reasons.map((reason) => REASON_LABELS[reason] || reason).join("；");
}

export function formatLinks(item: CandidateItem): string {
  const links = [`[原文](${item.url})`];
  if (item.originalUrl && item.originalUrl !== item.url) {
    links.push(`[原始出处](${item.originalUrl})`);
  }
  return links.join(" | ");
}

export function formatCandidateBlock(item: CandidateItem, index?: number): string {
  const decision = evaluateVerification(item);
  const editorial = assessEditorialValue(item);
  const title = typeof index === "number" ? `${index + 1}. ${item.title}` : item.title;
  const lines = [
    `### ${title}`,
    "",
    `- 一句话：${editorial.brief}`,
    `- 为什么重要：${editorial.whyImportant}`,
    `- 来源：${item.source.name}`,
    `- 发布时间：${formatShanghaiDateTime(item.publishedAt)}`,
    `- 核验：${translateReasons(decision.reasons)}；置信度 ${translateConfidence(decision.confidence)}`,
    `- 链接：${formatLinks(item)}`,
  ];

  lines.push("");
  return lines.join("\n");
}

export function buildDailyHighlights(items: CandidateItem[]): string[] {
  return buildEditorialHighlights(items, 3);
}

export function buildWeeklyHighlights(
  verifiedNews: CandidateItem[],
  deepDives: CandidateItem[],
): string[] {
  return buildEditorialHighlights([...verifiedNews, ...deepDives], 4);
}
