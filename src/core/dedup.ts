import type { CandidateItem, DedupedCluster } from "../types/content.ts";
import { getSourcePolicy } from "./trust.ts";

function normalizeUrl(url: string): string {
  const parsed = new URL(url);
  parsed.hash = "";
  parsed.search = "";

  const normalized = parsed.toString();
  return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
}

function clusterKey(candidate: CandidateItem): string {
  return normalizeUrl(candidate.originalUrl || candidate.canonicalUrl || candidate.url);
}

function sourceRank(candidate: CandidateItem): number {
  const { tier } = getSourcePolicy(candidate.source.kind);

  switch (tier) {
    case "primary":
      return 4;
    case "secondary":
      return 3;
    case "analysis":
      return 2;
    case "discovery":
      return 1;
  }
}

export function deduplicateCandidates(candidates: CandidateItem[]): DedupedCluster[] {
  const grouped = new Map<string, CandidateItem[]>();

  for (const candidate of candidates) {
    const key = clusterKey(candidate);
    const members = grouped.get(key);
    if (members) {
      members.push(candidate);
    } else {
      grouped.set(key, [candidate]);
    }
  }

  return Array.from(grouped.entries()).map(([canonicalUrl, members]) => {
    const primary = members.reduce((best, current) => {
      if (!best) return current;
      return sourceRank(current) > sourceRank(best) ? current : best;
    });

    return {
      canonicalUrl,
      primary,
      members,
      supportingSources: members
        .filter((member) => member.id !== primary.id)
        .map((member) => member.source),
    };
  });
}
