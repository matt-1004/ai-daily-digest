import type { DailySelection } from "../types/content.ts";
import { buildDailyHighlights, formatCandidateBlock } from "./shared.ts";

export function renderDailyReport(
  selection: DailySelection,
  generatedAt = "生成时间未知",
): string {
  const lines: string[] = [
    "# AI 日报",
    "",
    `- ${generatedAt}`,
    "- 规则：仅收录可直接核验事实的一手或可回溯信源。",
    "",
  ];

  if (selection.leadItems.length === 0) {
    lines.push("## 今日已验证动态", "", "今日没有满足准入规则的日报条目。");
    return lines.join("\n");
  }

  const highlights = buildDailyHighlights(selection.leadItems);
  if (highlights.length > 0) {
    lines.push("## 今日判断", "", ...highlights, "");
  }

  lines.push("## 今日已验证动态", "");
  lines.push(
    ...selection.leadItems.flatMap((item, index) => formatCandidateBlock(item, index).split("\n")),
  );

  if (selection.rejectedItems.length > 0) {
    lines.push(`- 已延后或剔除条目：${selection.rejectedItems.length}`);
  }

  return lines.join("\n");
}
