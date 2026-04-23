import { describe, expect, test } from "bun:test";

import {
  getAutomatableSourceCatalog,
  getDailySourceCatalog,
  getDefaultSourceCatalog,
  getWatchlistSourceCatalog,
  getWeeklySourceCatalog,
} from "../src/sources/index.ts";

describe("source catalog", () => {
  test("includes official, github, papers, media, podcasts, youtube, social, and blogs", () => {
    const ids = getDefaultSourceCatalog().map((source) => source.id);

    expect(ids).toContain("openai-newsroom");
    expect(ids).toContain("github-openai-python");
    expect(ids).toContain("arxiv-cs-ai");
    expect(ids).toContain("techcrunch-ai");
    expect(ids).toContain("openai-podcast");
    expect(ids).toContain("openai-youtube");
    expect(ids).toContain("openai-x");
    expect(ids).toContain("simon-willison-blog");
  });

  test("exposes daily-only sources without watchlist accounts", () => {
    const ids = getDailySourceCatalog().map((source) => source.id);

    expect(ids).toContain("openai-newsroom");
    expect(ids).toContain("github-openai-python");
    expect(ids).not.toContain("openai-x");
    expect(ids).not.toContain("openai-podcast");
  });

  test("exposes weekly sources including podcasts and blogs", () => {
    const ids = getWeeklySourceCatalog().map((source) => source.id);

    expect(ids).toContain("openai-podcast");
    expect(ids).toContain("simon-willison-blog");
    expect(ids).not.toContain("openai-x");
  });

  test("keeps watchlist accounts isolated", () => {
    const ids = getWatchlistSourceCatalog().map((source) => source.id);

    expect(ids).toEqual([
      "openai-x",
      "openai-devs-x",
      "anthropic-x",
      "google-deepmind-x",
      "meta-ai-x",
    ]);
  });

  test("keeps the automatable catalog on stable adapters", () => {
    const adapters = new Set(getAutomatableSourceCatalog().map((source) => source.adapter));

    expect(Array.from(adapters).sort()).toEqual([
      "atom",
      "github_releases",
      "podcast_feed",
      "rss",
    ]);
  });
});
