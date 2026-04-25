import { getSourcePolicy } from "../core/trust.ts";
import type { SourceDefinition } from "../types/content.ts";
import { BLOG_SOURCES } from "./blogs.ts";
import { GITHUB_SOURCES } from "./github.ts";
import { OFFICIAL_SOURCES } from "./official.ts";
import { PAPER_SOURCES } from "./papers.ts";
import { SOCIAL_SOURCES } from "./social.ts";
import { YOUTUBE_SOURCES } from "./youtube.ts";

export const DEFAULT_SOURCE_CATALOG: SourceDefinition[] = [
  ...OFFICIAL_SOURCES.filter(
    (source) => source.id !== "huggingface-blog" && source.id !== "google-deepmind-blog",
  ),
  ...GITHUB_SOURCES,
  ...PAPER_SOURCES,
  ...YOUTUBE_SOURCES,
  ...SOCIAL_SOURCES,
  ...BLOG_SOURCES.filter((source) => source.id !== "gwern-blog"),
];

export function getDefaultSourceCatalog(): SourceDefinition[] {
  return DEFAULT_SOURCE_CATALOG.slice();
}

export function getDailySourceCatalog(): SourceDefinition[] {
  return DEFAULT_SOURCE_CATALOG.filter((source) => {
    const policy = getSourcePolicy(source.kind);
    return policy.directWeeklyAllowed && source.laneHint === "daily";
  });
}

export function getWeeklySourceCatalog(): SourceDefinition[] {
  return DEFAULT_SOURCE_CATALOG.filter((source) => {
    const policy = getSourcePolicy(source.kind);
    return policy.directWeeklyAllowed;
  });
}

export function getWatchlistSourceCatalog(): SourceDefinition[] {
  return DEFAULT_SOURCE_CATALOG.filter((source) => source.laneHint === "watchlist");
}

export function getAutomatableSourceCatalog(): SourceDefinition[] {
  return DEFAULT_SOURCE_CATALOG.filter((source) =>
    source.adapter === "rss" ||
    source.adapter === "atom" ||
    source.adapter === "arxiv_recent" ||
    source.adapter === "github_releases" ||
    source.adapter === "podcast_feed" ||
    source.adapter === "youtube_channel" ||
    source.adapter === "x_account",
  );
}

export { collectFromCatalog, collectFromSource } from "./adapters/index.ts";
