import { describe, expect, test } from "bun:test";

import { assessEditorialValue, compareEditorialPriority } from "../src/core/editorial.ts";
import {
  lowSignalOfficialPost,
  officialAnnouncement,
  podcastDeepDive,
} from "./fixtures/candidates.ts";

const TEST_NOW = new Date("2026-04-24T09:00:00.000Z");

describe("editorial assessment", () => {
  test("scores high-signal AI product updates above generic platform news", () => {
    const highSignal = assessEditorialValue(officialAnnouncement, TEST_NOW);
    const lowSignal = assessEditorialValue(lowSignalOfficialPost, TEST_NOW);

    expect(highSignal.score).toBeGreaterThan(lowSignal.score);
    expect(highSignal.shouldPromoteDaily).toBe(true);
    expect(lowSignal.shouldPromoteDaily).toBe(false);
  });

  test("keeps strong weekly analysis even when it should not enter the daily digest", () => {
    const podcast = assessEditorialValue(podcastDeepDive, TEST_NOW);

    expect(podcast.shouldPromoteDaily).toBe(false);
    expect(podcast.shouldPromoteDeepDive).toBe(true);
  });

  test("sorts higher-value AI items ahead of low-signal official posts", () => {
    const sorted = [lowSignalOfficialPost, officialAnnouncement].sort(compareEditorialPriority);
    expect(sorted.map((item) => item.id)).toEqual([
      "official-announcement",
      "low-signal-official-post",
    ]);
  });
});
