import { deduplicateCandidates } from "./core/dedup.ts";
import { selectDailyItems, selectWeeklyItems } from "./core/selection.ts";
import { renderDailyReport, renderWatchlistReport, renderWeeklyReport } from "./reporting/index.ts";
import type { BriefingOptions, BriefingResult, CandidateItem } from "./types/content.ts";

function mergeClusterMetadata(item: CandidateItem, supportingSources: CandidateItem["corroboratingSources"]): CandidateItem {
  const corroboratingSources = [
    ...(item.corroboratingSources || []),
    ...(supportingSources || []),
  ];

  return {
    ...item,
    corroboratingSources,
  };
}

export function buildBriefings(
  candidates: CandidateItem[],
  options: BriefingOptions,
  generatedAt = "Generated at unknown time",
): BriefingResult {
  const clusters = deduplicateCandidates(candidates);
  const canonicalItems = clusters.map((cluster) =>
    mergeClusterMetadata(cluster.primary, cluster.supportingSources),
  ).sort((left, right) => {
    const rightTime = new Date(right.publishedAt).getTime();
    const leftTime = new Date(left.publishedAt).getTime();
    return rightTime - leftTime;
  });

  const dailySelection = selectDailyItems(canonicalItems, options.dailyLimit, options.now);
  const weeklySelection = selectWeeklyItems(
    canonicalItems,
    options.weeklyNewsLimit,
    options.weeklyDeepDiveLimit,
    options.now,
  );

  return {
    canonicalItems,
    dailySelection,
    weeklySelection,
    dailyReport: renderDailyReport(dailySelection, generatedAt),
    weeklyReport: renderWeeklyReport(weeklySelection, generatedAt),
    watchlistReport: renderWatchlistReport(weeklySelection.watchlist, generatedAt),
  };
}
