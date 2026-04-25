import type { CandidateItem } from "../../types/content.ts";
import {
  buildCandidate,
  buildTimedRequestInit,
  getFetchFn,
  stripHtml,
  toAbsoluteUrl,
  type CollectOptions,
  type SourceAdapter,
} from "./shared.ts";

function parseArxivRecent(html: string, sourceUrl: string): Array<{ title: string; url: string }> {
  const entries = html.matchAll(/<dt>[\s\S]*?<a href\s*=\s*"([^"]+)"[^>]*title="Abstract"[\s\S]*?<\/dt>\s*<dd>([\s\S]*?)<\/dd>/g);
  const items: Array<{ title: string; url: string }> = [];

  for (const entry of entries) {
    const href = entry[1];
    const dd = entry[2];
    const titleMatch = dd.match(/<div class=['"]list-title[^>]*>\s*<span class=['"]descriptor['"]>Title:<\/span>([\s\S]*?)<\/div>/i);
    const title = stripHtml(titleMatch?.[1] || "");
    const url = toAbsoluteUrl(href, sourceUrl);
    if (!title || !url) continue;
    items.push({ title, url });
  }

  return items;
}

export const arxivRecentAdapter: SourceAdapter = {
  async collect(source, options = {}): Promise<CandidateItem[]> {
    const fetchFn = getFetchFn(options.fetchFn);
    const response = await fetchFn(source.fetchUrl || source.channelUrl, buildTimedRequestInit({}, options.timeoutMs));
    if (!response.ok) {
      throw new Error(`arXiv request failed for ${source.id}: ${response.status}`);
    }

    const html = await response.text();
    return parseArxivRecent(html, source.channelUrl)
      .slice(0, source.maxItems || 20)
      .map((item) => buildCandidate(source, item, options.now));
  },
};
