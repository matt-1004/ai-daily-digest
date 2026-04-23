import type { SourceKind, SourcePolicy } from "../types/content.ts";

const SOURCE_POLICIES: Record<SourceKind, SourcePolicy> = {
  official_site: {
    tier: "primary",
    directDailyAllowed: true,
    directWeeklyAllowed: true,
    requiresOriginalSource: false,
  },
  official_blog: {
    tier: "primary",
    directDailyAllowed: true,
    directWeeklyAllowed: true,
    requiresOriginalSource: false,
  },
  github_release: {
    tier: "primary",
    directDailyAllowed: true,
    directWeeklyAllowed: true,
    requiresOriginalSource: false,
  },
  github_repo: {
    tier: "primary",
    directDailyAllowed: true,
    directWeeklyAllowed: true,
    requiresOriginalSource: false,
  },
  research_paper: {
    tier: "primary",
    directDailyAllowed: true,
    directWeeklyAllowed: true,
    requiresOriginalSource: false,
  },
  regulator: {
    tier: "primary",
    directDailyAllowed: true,
    directWeeklyAllowed: true,
    requiresOriginalSource: false,
  },
  major_media: {
    tier: "secondary",
    directDailyAllowed: false,
    directWeeklyAllowed: true,
    requiresOriginalSource: true,
  },
  independent_blog: {
    tier: "analysis",
    directDailyAllowed: false,
    directWeeklyAllowed: true,
    requiresOriginalSource: true,
  },
  podcast: {
    tier: "analysis",
    directDailyAllowed: false,
    directWeeklyAllowed: true,
    requiresOriginalSource: true,
  },
  youtube: {
    tier: "analysis",
    directDailyAllowed: false,
    directWeeklyAllowed: true,
    requiresOriginalSource: true,
  },
  x: {
    tier: "discovery",
    directDailyAllowed: false,
    directWeeklyAllowed: false,
    requiresOriginalSource: true,
  },
  community: {
    tier: "discovery",
    directDailyAllowed: false,
    directWeeklyAllowed: false,
    requiresOriginalSource: true,
  },
};

export function getSourcePolicy(kind: SourceKind): SourcePolicy {
  return SOURCE_POLICIES[kind];
}
