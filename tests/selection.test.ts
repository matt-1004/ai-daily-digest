import { describe, expect, test } from "bun:test";

import {
  selectDailyItems,
  selectWeeklyItems,
} from "../src/core/selection.ts";
import {
  confirmedMediaCoverage,
  lowSignalOfficialPost,
  officialAnnouncement,
  podcastDeepDive,
  unverifiedMediaCoverage,
  xRumor,
} from "./fixtures/candidates.ts";

const TEST_NOW = new Date("2026-04-24T09:00:00.000Z");

describe("daily selection", () => {
  test("selects only verified factual items for the daily digest", () => {
    const selection = selectDailyItems(
      [
        officialAnnouncement,
        confirmedMediaCoverage,
        lowSignalOfficialPost,
        podcastDeepDive,
        unverifiedMediaCoverage,
        xRumor,
      ],
      3,
      TEST_NOW,
    );

    expect(selection.leadItems.map((item) => item.id)).toEqual([
      "official-announcement",
      "confirmed-media-coverage",
    ]);
    expect(selection.rejectedItems.map((item) => item.id).sort()).toEqual([
      "low-signal-official-post",
      "podcast-deep-dive",
      "unverified-media-coverage",
      "x-rumor",
    ].sort());
  });
});

describe("weekly selection", () => {
  test("keeps verified news and deep-dive analysis in separate weekly sections", () => {
    const selection = selectWeeklyItems(
      [
        officialAnnouncement,
        confirmedMediaCoverage,
        lowSignalOfficialPost,
        podcastDeepDive,
        unverifiedMediaCoverage,
        xRumor,
      ],
      3,
      3,
      TEST_NOW,
    );

    expect(selection.verifiedNews.map((item) => item.id)).toEqual([
      "official-announcement",
      "confirmed-media-coverage",
    ]);
    expect(selection.deepDives.map((item) => item.id).sort()).toEqual([
      "podcast-deep-dive",
      "unverified-media-coverage",
    ].sort());
    expect(selection.watchlist.map((item) => item.id)).toEqual([
      "x-rumor",
    ]);
  });
});
