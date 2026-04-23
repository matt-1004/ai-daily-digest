import type { CandidateItem, SourceDefinition } from "../../types/content.ts";
import {
  buildCandidate,
  buildTimedRequestInit,
  filterSourceUrl,
  getFetchFn,
  stripHtml,
  toAbsoluteUrl,
  type CollectOptions,
  type SourceAdapter,
} from "./shared.ts";

interface ExtractedLink {
  title: string;
  url: string;
}

function uniqueByUrl(items: ExtractedLink[]): ExtractedLink[] {
  const seen = new Set<string>();
  const output: ExtractedLink[] = [];

  for (const item of items) {
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    output.push(item);
  }

  return output;
}

export function extractWebLinks(html: string, source: SourceDefinition): ExtractedLink[] {
  const matches = html.matchAll(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi);
  const items: ExtractedLink[] = [];

  for (const match of matches) {
    const href = match[1];
    const text = stripHtml(match[2] || "");
    const url = toAbsoluteUrl(href, source.channelUrl);

    if (!url || text.length < 8) continue;
    if (!filterSourceUrl(source, url)) continue;

    items.push({ title: text, url });
  }

  return uniqueByUrl(items);
}

export const webPageAdapter: SourceAdapter = {
  async collect(source, options = {}): Promise<CandidateItem[]> {
    const fetchFn = getFetchFn(options.fetchFn);
    const url = source.fetchUrl || source.channelUrl;

    const response = await fetchFn(url, buildTimedRequestInit({}, options.timeoutMs));
    if (!response.ok) {
      throw new Error(`Web page request failed for ${source.id}: ${response.status}`);
    }

    const html = await response.text();
    const items = extractWebLinks(html, source).slice(0, source.maxItems || 20);
    return items.map((item) => buildCandidate(source, item, options.now));
  },
};
