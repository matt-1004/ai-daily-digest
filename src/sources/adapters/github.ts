import type { CandidateItem, SourceDefinition } from "../../types/content.ts";
import { execFile } from "node:child_process";
import { feedAdapter } from "./feed.ts";
import type { CollectOptions, SourceAdapter } from "./shared.ts";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export function toGithubReleasesFeedUrl(repoUrl: string): string {
  const normalized = repoUrl.replace(/\/+$/, "");
  return normalized.endsWith("/releases")
    ? `${normalized}.atom`
    : `${normalized}/releases.atom`;
}

function parseGithubRepo(repoUrl: string): string | null {
  const match = repoUrl.match(/^https:\/\/github\.com\/([^/]+\/[^/]+?)(?:\/.*)?$/);
  return match?.[1] || null;
}

async function collectWithGhApi(source: SourceDefinition): Promise<CandidateItem[]> {
  const repo = parseGithubRepo(source.channelUrl);
  if (!repo) return [];

  const { stdout } = await execFileAsync("gh", [
    "api",
    `repos/${repo}/releases`,
    "--jq",
    ".[:20]",
  ], { maxBuffer: 1024 * 1024 });

  const releases = JSON.parse(stdout) as Array<{
    name?: string;
    tag_name?: string;
    html_url?: string;
    published_at?: string;
    body?: string;
  }>;

  return releases
    .filter((release) => release.html_url && (release.name || release.tag_name))
    .map((release) => ({
      id: `${source.id}:${release.html_url}`,
      title: release.name || release.tag_name || "GitHub release",
      url: release.html_url || source.channelUrl,
      canonicalUrl: release.html_url || source.channelUrl,
      publishedAt: release.published_at || new Date().toISOString(),
      summary: release.body || undefined,
      source: {
        name: source.name,
        kind: source.kind,
        url: source.channelUrl,
        isOfficial: false,
        independent: true,
      },
      corroboratingSources: [],
      tags: [],
    }));
}

export const githubReleasesAdapter: SourceAdapter = {
  async collect(source: SourceDefinition, options?: CollectOptions): Promise<CandidateItem[]> {
    try {
      const items = await collectWithGhApi(source);
      if (items.length > 0) return items;
    } catch {
      // Fall back to the public Atom feed when gh is unavailable.
    }

    return feedAdapter.collect(
      {
        ...source,
        fetchUrl: source.fetchUrl || toGithubReleasesFeedUrl(source.channelUrl),
      },
      options,
    );
  },
};
