import type { CandidateItem, DailySelection, WeeklySelection } from "../types/content.ts";
import { assessEditorialValue, compareEditorialPriority } from "./editorial.ts";
import { evaluateVerification } from "./verification.ts";

export function selectDailyItems(
  candidates: CandidateItem[],
  limit: number,
): DailySelection {
  const sortedCandidates = [...candidates].sort(compareEditorialPriority);
  const leadItems: CandidateItem[] = [];
  const rejectedItems: CandidateItem[] = [];
  const seenBriefs = new Set<string>();

  for (const candidate of sortedCandidates) {
    const decision = evaluateVerification(candidate);
    const editorial = assessEditorialValue(candidate);

    if (
      decision.dailyEligible &&
      editorial.shouldPromoteDaily &&
      !seenBriefs.has(editorial.brief) &&
      leadItems.length < limit
    ) {
      seenBriefs.add(editorial.brief);
      leadItems.push(candidate);
      continue;
    }

    rejectedItems.push(candidate);
  }

  return { leadItems, rejectedItems };
}

export function selectWeeklyItems(
  candidates: CandidateItem[],
  newsLimit: number,
  deepDiveLimit: number,
): WeeklySelection {
  const sortedCandidates = [...candidates].sort(compareEditorialPriority);
  const verifiedNews: CandidateItem[] = [];
  const deepDives: CandidateItem[] = [];
  const watchlist: CandidateItem[] = [];
  const seenBriefs = new Set<string>();

  for (const candidate of sortedCandidates) {
    const decision = evaluateVerification(candidate);
    const editorial = assessEditorialValue(candidate);

    if (
      decision.status === "verified" &&
      decision.weeklyEligible &&
      editorial.shouldPromoteWeeklyNews &&
      !seenBriefs.has(editorial.brief)
    ) {
      if (verifiedNews.length < newsLimit) {
        seenBriefs.add(editorial.brief);
        verifiedNews.push(candidate);
      }
      continue;
    }

    if (
      decision.weeklyEligible &&
      editorial.shouldPromoteDeepDive &&
      !seenBriefs.has(editorial.brief)
    ) {
      if (deepDives.length < deepDiveLimit) {
        seenBriefs.add(editorial.brief);
        deepDives.push(candidate);
      }
      continue;
    }

    if (!decision.weeklyEligible) {
      watchlist.push(candidate);
    }
  }

  return { verifiedNews, deepDives, watchlist };
}
