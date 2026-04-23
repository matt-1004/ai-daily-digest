import type { CandidateItem, VerificationDecision } from "../types/content.ts";
import { getSourcePolicy } from "./trust.ts";

function hasOriginalSource(candidate: CandidateItem): boolean {
  return Boolean(candidate.originalUrl);
}

function hasIndependentCorroboration(candidate: CandidateItem): boolean {
  return (candidate.corroboratingSources || []).some((source) => source.independent !== false);
}

export function evaluateVerification(candidate: CandidateItem): VerificationDecision {
  const policy = getSourcePolicy(candidate.source.kind);

  if (policy.tier === "primary") {
    return {
      status: "verified",
      confidence: "high",
      dailyEligible: true,
      weeklyEligible: true,
      reasons: ["primary source is the original announcement"],
    };
  }

  if (policy.tier === "secondary") {
    if (!hasOriginalSource(candidate)) {
      return {
        status: "needs_review",
        confidence: "low",
        dailyEligible: false,
        weeklyEligible: true,
        reasons: ["secondary source is missing an original source link"],
      };
    }

    if (!hasIndependentCorroboration(candidate)) {
      return {
        status: "needs_review",
        confidence: "medium",
        dailyEligible: false,
        weeklyEligible: true,
        reasons: [
          "secondary source points to an original source",
          "event lacks independent corroboration",
        ],
      };
    }

    return {
      status: "verified",
      confidence: "medium",
      dailyEligible: true,
      weeklyEligible: true,
      reasons: [
        "secondary source points to an original source",
        "event is corroborated by independent outlets",
      ],
    };
  }

  if (policy.tier === "analysis") {
    return {
      status: "needs_review",
      confidence: "low",
      dailyEligible: false,
      weeklyEligible: true,
      reasons: ["analysis source requires an original source before daily promotion"],
    };
  }

  if (!hasOriginalSource(candidate)) {
    return {
      status: "rejected",
      confidence: "low",
      dailyEligible: false,
      weeklyEligible: false,
      reasons: ["discovery source has no original evidence"],
    };
  }

  return {
    status: "rejected",
    confidence: "low",
    dailyEligible: false,
    weeklyEligible: false,
    reasons: ["discovery source cannot be promoted directly"],
  };
}
