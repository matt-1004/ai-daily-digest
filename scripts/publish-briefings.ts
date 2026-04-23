import {
  formatShanghaiDate,
  generateCurrentBriefings,
  getFeishuBriefingDocTargetsFromEnv,
  getFeishuPublisherConfigFromEnv,
  publishBriefingDocs,
} from "../src/index.ts";

const config = getFeishuPublisherConfigFromEnv();
if (!config) {
  console.error("Missing FEISHU_APP_ID or FEISHU_APP_SECRET");
  process.exit(1);
}

const docTargets = getFeishuBriefingDocTargetsFromEnv();
const briefings = await generateCurrentBriefings();
const today = formatShanghaiDate();

const docs = await publishBriefingDocs(config, {
  dailyTitle: `AI 日报 ${today}`,
  dailyMarkdown: briefings.dailyReport,
  weeklyTitle: `AI 周报 ${today}`,
  weeklyMarkdown: briefings.weeklyReport,
  dailyDocId: docTargets.dailyDocId,
  weeklyDocId: docTargets.weeklyDocId,
});

console.log(
  JSON.stringify(
    {
      ok: true,
      daily: docs.daily,
      weekly: docs.weekly,
      counts: {
        canonicalItems: briefings.canonicalItems.length,
        dailyItems: briefings.dailySelection.leadItems.length,
        weeklyNews: briefings.weeklySelection.verifiedNews.length,
        weeklyDeepDives: briefings.weeklySelection.deepDives.length,
      },
    },
    null,
    2,
  ),
);
