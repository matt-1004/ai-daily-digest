import type { CandidateItem } from "../types/content.ts";
import { formatCandidateBlock } from "./shared.ts";

export function renderWatchlistReport(
  items: CandidateItem[],
  generatedAt = "生成时间未知",
): string {
  const lines: string[] = [
    "# AI 观察池",
    "",
    `- ${generatedAt}`,
    "- 说明：以下条目仅作为后续核验线索，不直接进入主简报。",
    "",
  ];

  if (items.length === 0) {
    lines.push("当前没有待观察条目。");
    return lines.join("\n");
  }

  lines.push("## 待核验线索", "");
  lines.push(...items.flatMap((item, index) => formatCandidateBlock(item, index).split("\n")));
  return lines.join("\n");
}
