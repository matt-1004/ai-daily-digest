import type { CandidateItem, DailySelection, WeeklySelection } from "../types/content.ts";
import { assessEditorialValue, compareEditorialPriority } from "./editorial.ts";
import { evaluateVerification } from "./verification.ts";

export function selectDailyItems(
  candidates: CandidateItem[],
  limit: number,
  now = new Date(),
): DailySelection {
  const sortedCandidates = [...candidates].sort((left, right) =>
    compareEditorialPriority(left, right, now),
  );
  const leadItems: CandidateItem[] = [];
  const rejectedItems: CandidateItem[] = [];
  const seenBriefs = new Set<string>();

  for (const candidate of sortedCandidates) {
    const decision = evaluateVerification(candidate);
    const editorial = assessEditorialValue(candidate, now);

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
  now = new Date(),
): WeeklySelection {
  const sortedCandidates = [...candidates].sort((left, right) =>
    compareEditorialPriority(left, right, now),
  );
  const verifiedNews: CandidateItem[] = [];
  const deepDives: CandidateItem[] = [];
  const watchlist: CandidateItem[] = [];
  const seenBriefs = new Set<string>();

  for (const candidate of sortedCandidates) {
    const decision = evaluateVerification(candidate);
    const editorial = assessEditorialValue(candidate, now);

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
