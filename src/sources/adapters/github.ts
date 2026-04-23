import type { CandidateItem, SourceDefinition } from "../../types/content.ts";
import { feedAdapter } from "./feed.ts";
import type { CollectOptions, SourceAdapter } from "./shared.ts";

export function toGithubReleasesFeedUrl(repoUrl: string): string {
  const normalized = repoUrl.replace(/\/+$/, "");
  return normalized.endsWith("/releases")
    ? `${normalized}.atom`
    : `${normalized}/releases.atom`;
}

export const githubReleasesAdapter: SourceAdapter = {
  async collect(source: SourceDefinition, options?: CollectOptions): Promise<CandidateItem[]> {
    return feedAdapter.collect(
      {
        ...source,
        fetchUrl: source.fetchUrl || toGithubReleasesFeedUrl(source.channelUrl),
      },
      options,
    );
  },
};
