import { buildBriefings } from "./pipeline.ts";
import { formatShanghaiDateTime } from "./reporting/shared.ts";
import { collectFromCatalog } from "./sources/adapters/index.ts";
import { getAutomatableSourceCatalog } from "./sources/index.ts";
import type { BriefingResult } from "./types/content.ts";

export async function generateCurrentBriefings(): Promise<BriefingResult> {
  const generatedAt = `生成时间：${formatShanghaiDateTime(new Date().toISOString())}`;
  const catalog = getAutomatableSourceCatalog();
  const candidates = await collectFromCatalog(catalog, {
    now: new Date(),
    timeoutMs: 8000,
  });

  return buildBriefings(
    candidates,
    {
      dailyLimit: 10,
      weeklyNewsLimit: 10,
      weeklyDeepDiveLimit: 10,
    },
    generatedAt,
  );
}
