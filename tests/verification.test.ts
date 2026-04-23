import { describe, expect, test } from "bun:test";

import { evaluateVerification } from "../src/core/verification.ts";
import {
  confirmedMediaCoverage,
  officialAnnouncement,
  podcastDeepDive,
  unverifiedMediaCoverage,
  xRumor,
} from "./fixtures/candidates.ts";

describe("verification", () => {
  test("marks original official announcements as verified with high confidence", () => {
    expect(evaluateVerification(officialAnnouncement)).toEqual({
      status: "verified",
      confidence: "high",
      dailyEligible: true,
      weeklyEligible: true,
      reasons: ["primary source is the original announcement"],
    });
  });

  test("allows major media into the daily digest only when it points to the original source and has corroboration", () => {
    expect(evaluateVerification(confirmedMediaCoverage)).toEqual({
      status: "verified",
      confidence: "medium",
      dailyEligible: true,
      weeklyEligible: true,
      reasons: [
        "secondary source points to an original source",
        "event is corroborated by independent outlets",
      ],
    });
  });

  test("keeps unsupported media stories out of the daily digest", () => {
    expect(evaluateVerification(unverifiedMediaCoverage)).toEqual({
      status: "needs_review",
      confidence: "low",
      dailyEligible: false,
      weeklyEligible: true,
      reasons: ["secondary source is missing an original source link"],
    });
  });

  test("allows podcasts for weekly analysis but not as direct daily facts", () => {
    expect(evaluateVerification(podcastDeepDive)).toEqual({
      status: "needs_review",
      confidence: "low",
      dailyEligible: false,
      weeklyEligible: true,
      reasons: ["analysis source requires an original source before daily promotion"],
    });
  });

  test("rejects X rumors without traceable evidence", () => {
    expect(evaluateVerification(xRumor)).toEqual({
      status: "rejected",
      confidence: "low",
      dailyEligible: false,
      weeklyEligible: false,
      reasons: ["discovery source has no original evidence"],
    });
  });
});
