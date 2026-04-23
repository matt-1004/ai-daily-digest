import { describe, expect, test } from "bun:test";

import { getSourcePolicy } from "../src/core/trust.ts";

describe("source policy", () => {
  test("treats official sites as primary daily sources", () => {
    expect(getSourcePolicy("official_site")).toEqual({
      tier: "primary",
      directDailyAllowed: true,
      directWeeklyAllowed: true,
      requiresOriginalSource: false,
    });
  });

  test("treats GitHub releases as primary daily sources", () => {
    expect(getSourcePolicy("github_release")).toEqual({
      tier: "primary",
      directDailyAllowed: true,
      directWeeklyAllowed: true,
      requiresOriginalSource: false,
    });
  });

  test("treats major media as secondary sources that require an original source", () => {
    expect(getSourcePolicy("major_media")).toEqual({
      tier: "secondary",
      directDailyAllowed: false,
      directWeeklyAllowed: true,
      requiresOriginalSource: true,
    });
  });

  test("allows podcasts in weekly digests but not as direct daily facts", () => {
    expect(getSourcePolicy("podcast")).toEqual({
      tier: "analysis",
      directDailyAllowed: false,
      directWeeklyAllowed: true,
      requiresOriginalSource: true,
    });
  });

  test("treats X as a discovery-only source", () => {
    expect(getSourcePolicy("x")).toEqual({
      tier: "discovery",
      directDailyAllowed: false,
      directWeeklyAllowed: false,
      requiresOriginalSource: true,
    });
  });
});
