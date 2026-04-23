import type { CandidateItem, WeeklySelection } from "../types/content.ts";
import { buildWeeklyHighlights, formatCandidateBlock } from "./shared.ts";

function section(title: string, items: CandidateItem[]): string[] {
  const lines = [`## ${title}`, ""];

  if (items.length === 0) {
    lines.push("本期无条目。", "");
    return lines;
  }

  lines.push(...items.flatMap((item, index) => formatCandidateBlock(item, index).split("\n")), "");
  return lines;
}

export function renderWeeklyReport(
  selection: WeeklySelection,
  generatedAt = "生成时间未知",
): string {
  const highlights = buildWeeklyHighlights(selection.verifiedNews, selection.deepDives);
  const lines: string[] = [
    "# AI 周报",
    "",
    `- ${generatedAt}`,
    "- 结构：先放已验证动态，再放深度阅读，最后保留观察池。",
    "",
  ];
  if (highlights.length > 0) {
    lines.push("## 本周判断", "", ...highlights, "");
  }
  lines.push(...section("本周已验证动态", selection.verifiedNews));
  lines.push(...section("本周深度阅读", selection.deepDives));
  lines.push(...section("观察池", selection.watchlist));
  return lines.join("\n");
}
