import { describe, expect, test } from "bun:test";

import {
  getFeishuBriefingDocTargetsFromEnv,
  getFeishuPublisherConfigFromEnv,
} from "../src/integrations/feishu.ts";

describe("feishu config", () => {
  test("reads app credentials from env", () => {
    const config = getFeishuPublisherConfigFromEnv({
      FEISHU_APP_ID: "cli_test",
      FEISHU_APP_SECRET: "secret",
    });

    expect(config).toEqual({
      appId: "cli_test",
      appSecret: "secret",
      brand: "feishu",
    });
  });

  test("returns null when credentials are incomplete", () => {
    expect(
      getFeishuPublisherConfigFromEnv({
        FEISHU_APP_ID: "cli_test",
      }),
    ).toBeNull();
  });
});

describe("feishu doc targets", () => {
  test("reads existing doc ids from env", () => {
    expect(
      getFeishuBriefingDocTargetsFromEnv({
        FEISHU_DAILY_DOC_ID: "daily-doc",
        FEISHU_WEEKLY_DOC_ID: "weekly-doc",
      }),
    ).toEqual({
      dailyDocId: "daily-doc",
      weeklyDocId: "weekly-doc",
    });
  });

  test("returns an empty object when doc ids are missing", () => {
    expect(getFeishuBriefingDocTargetsFromEnv({})).toEqual({});
  });
});
