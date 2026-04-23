import { describe, expect, test } from "bun:test";

import { deduplicateCandidates } from "../src/core/dedup.ts";
import {
  confirmedMediaCoverage,
  duplicateOfficialAnnouncement,
  officialAnnouncement,
  unrelatedOfficialUpdate,
} from "./fixtures/candidates.ts";

describe("deduplication", () => {
  test("merges items that share the same underlying original announcement", () => {
    const clusters = deduplicateCandidates([
      officialAnnouncement,
      duplicateOfficialAnnouncement,
      confirmedMediaCoverage,
    ]);

    expect(clusters).toHaveLength(1);
    expect(clusters[0]).toMatchObject({
      canonicalUrl: "https://openai.com/news/new-evals-api",
      primary: { id: "official-announcement" },
    });
    expect(clusters[0]?.members.map((item) => item.id)).toEqual([
      "official-announcement",
      "duplicate-official-announcement",
      "confirmed-media-coverage",
    ]);
  });

  test("keeps unrelated official posts in separate clusters", () => {
    const clusters = deduplicateCandidates([
      officialAnnouncement,
      unrelatedOfficialUpdate,
    ]);

    expect(clusters).toHaveLength(2);
    expect(clusters.map((cluster) => cluster.primary.id)).toEqual([
      "official-announcement",
      "unrelated-official-update",
    ]);
  });
});
