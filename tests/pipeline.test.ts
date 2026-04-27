import { describe, expect, test } from "bun:test";

import { buildBriefings } from "../src/pipeline.ts";
import {
  confirmedMediaCoverage,
  duplicateOfficialAnnouncement,
  officialAnnouncement,
  podcastDeepDive,
  xRumor,
} from "./fixtures/candidates.ts";

describe("briefing pipeline", () => {
  test("deduplicates canonical events and renders daily and weekly outputs", () => {
    const result = buildBriefings(
      [
        officialAnnouncement,
        duplicateOfficialAnnouncement,
        confirmedMediaCoverage,
        podcastDeepDive,
        xRumor,
      ],
      {
        dailyLimit: 5,
        weeklyNewsLimit: 5,
        weeklyDeepDiveLimit: 5,
        now: new Date("2026-04-24T09:00:00.000Z"),
      },
      "生成时间：2026-04-23 09:00 Asia/Shanghai",
    );

    expect(result.canonicalItems).toHaveLength(3);
    expect(result.dailySelection.leadItems.map((item) => item.id)).toEqual([
      "official-announcement",
    ]);
    expect(result.weeklySelection.deepDives.map((item) => item.id)).toEqual([
      "podcast-deep-dive",
    ]);
    expect(result.weeklySelection.watchlist.map((item) => item.id)).toEqual([
      "x-rumor",
    ]);
    expect(result.dailyReport).toContain("# AI 日报");
    expect(result.weeklyReport).toContain("# AI 周报");
    expect(result.watchlistReport).toContain("# AI 观察池");
  });
});
