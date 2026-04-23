import { getSourcePolicy } from "../core/trust.ts";
import type { SourceDefinition } from "../types/content.ts";
import { BLOG_SOURCES } from "./blogs.ts";
import { GITHUB_SOURCES } from "./github.ts";
import { MEDIA_SOURCES } from "./media.ts";
import { OFFICIAL_SOURCES } from "./official.ts";
import { PAPER_SOURCES } from "./papers.ts";
import { PODCAST_SOURCES } from "./podcasts.ts";
import { SOCIAL_SOURCES } from "./social.ts";
import { YOUTUBE_SOURCES } from "./youtube.ts";

export const DEFAULT_SOURCE_CATALOG: SourceDefinition[] = [
  ...OFFICIAL_SOURCES,
  ...GITHUB_SOURCES,
  ...PAPER_SOURCES,
  ...MEDIA_SOURCES,
  ...PODCAST_SOURCES,
  ...YOUTUBE_SOURCES,
  ...SOCIAL_SOURCES,
  ...BLOG_SOURCES,
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
    source.adapter === "github_releases" ||
    source.adapter === "podcast_feed",
  );
}

export { collectFromCatalog, collectFromSource } from "./adapters/index.ts";
