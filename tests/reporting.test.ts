import { describe, expect, test } from "bun:test";

import { renderDailyReport, renderWatchlistReport, renderWeeklyReport } from "../src/reporting/index.ts";
import { officialAnnouncement, podcastDeepDive, xRumor } from "./fixtures/candidates.ts";

describe("report rendering", () => {
  test("renders a daily report with verified reasons", () => {
    const report = renderDailyReport(
      { leadItems: [officialAnnouncement], rejectedItems: [xRumor] },
      "生成时间：2026-04-23 09:00 Asia/Shanghai",
    );

    expect(report).toContain("# AI 日报");
    expect(report).toContain("## 今日判断");
    expect(report).toContain("OpenAI launches a new evals API");
    expect(report).toContain("一句话：");
    expect(report).toContain("为什么重要：");
    expect(report).toContain("核验：一手来源，属于原始公告");
    expect(report).toContain("已延后或剔除条目：1");
  });

  test("renders a weekly report with separate sections", () => {
    const report = renderWeeklyReport(
      {
        verifiedNews: [officialAnnouncement],
        deepDives: [podcastDeepDive],
        watchlist: [xRumor],
      },
      "生成时间：2026-04-23 09:00 Asia/Shanghai",
    );

    expect(report).toContain("# AI 周报");
    expect(report).toContain("## 本周判断");
    expect(report).toContain("## 本周已验证动态");
    expect(report).toContain("## 本周深度阅读");
    expect(report).toContain("## 观察池");
    expect(report).toContain("Latent Space");
  });

  test("renders a standalone watchlist", () => {
    const report = renderWatchlistReport([xRumor], "生成时间：2026-04-23 09:00 Asia/Shanghai");

    expect(report).toContain("# AI 观察池");
    expect(report).toContain("Rumor: OpenAI is shipping a secret evals product tonight");
  });
});
