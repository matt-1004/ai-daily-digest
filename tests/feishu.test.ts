import { describe, expect, test } from "bun:test";

import {
  FEISHU_PUBLISHER_APP_ID,
  getFeishuBriefingDocTargetsFromEnv,
  getFeishuPublisherConfigFromEnv,
} from "../src/integrations/feishu.ts";

describe("feishu config", () => {
  test("reads app credentials from env", () => {
    const config = getFeishuPublisherConfigFromEnv({
      FEISHU_APP_ID: FEISHU_PUBLISHER_APP_ID,
      FEISHU_APP_SECRET: "secret",
    });

    expect(config).toEqual({
      appId: FEISHU_PUBLISHER_APP_ID,
      appSecret: "secret",
      brand: "feishu",
    });
  });

  test("returns null when credentials are incomplete", () => {
    expect(
      getFeishuPublisherConfigFromEnv({
        FEISHU_APP_ID: FEISHU_PUBLISHER_APP_ID,
      }),
    ).toBeNull();
  });

  test("rejects credentials for any other bot app", () => {
    expect(() =>
      getFeishuPublisherConfigFromEnv({
        FEISHU_APP_ID: "cli_other_bot",
        FEISHU_APP_SECRET: "secret",
      }),
    ).toThrow("Refusing to publish");
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
