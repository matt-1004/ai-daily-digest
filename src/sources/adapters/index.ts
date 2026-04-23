import type { CandidateItem, SourceDefinition } from "../../types/content.ts";
import { feedAdapter } from "./feed.ts";
import { githubReleasesAdapter } from "./github.ts";
import type { CollectOptions, SourceAdapter } from "./shared.ts";
import { webPageAdapter } from "./web-page.ts";

const ADAPTERS: Record<SourceDefinition["adapter"], SourceAdapter | null> = {
  rss: feedAdapter,
  atom: feedAdapter,
  github_releases: githubReleasesAdapter,
  web_page: webPageAdapter,
  podcast_feed: feedAdapter,
  youtube_channel: null,
  x_account: null,
};

export async function collectFromSource(
  source: SourceDefinition,
  options?: CollectOptions,
): Promise<CandidateItem[]> {
  const adapter = ADAPTERS[source.adapter];
  if (!adapter) return [];
  return adapter.collect(source, options);
}

export async function collectFromCatalog(
  sources: SourceDefinition[],
  options?: CollectOptions,
): Promise<CandidateItem[]> {
  const settled = await Promise.allSettled(
    sources.map((source) => collectFromSource(source, options)),
  );

  return settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
}
