import type { CandidateItem, SourceDefinition } from "../../types/content.ts";
import {
  buildCandidate,
  buildTimedRequestInit,
  getFetchFn,
  stripHtml,
  toAbsoluteUrl,
  type CollectOptions,
  type SourceAdapter,
} from "./shared.ts";

interface ParsedFeedItem {
  title: string;
  url: string;
  publishedAt?: string;
  summary?: string;
}

function extractCDATA(value: string): string {
  const match = value.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  return match?.[1] || value;
}

function getTagContent(xml: string, tagName: string): string {
  const match = xml.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, "i"));
  if (!match?.[1]) return "";
  return extractCDATA(match[1]).trim();
}

function getLinkHref(xml: string): string {
  const alternate = xml.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i);
  if (alternate?.[1]) return alternate[1];
  const direct = xml.match(/<link[^>]*href=["']([^"']+)["']/i);
  return direct?.[1] || "";
}

function parseAtom(xml: string, source: SourceDefinition): ParsedFeedItem[] {
  const items: ParsedFeedItem[] = [];
  const matches = xml.matchAll(/<entry[\s\S]*?<\/entry>/gi);

  for (const match of matches) {
    const entry = match[0];
    const title = stripHtml(getTagContent(entry, "title"));
    const href = getLinkHref(entry);
    const url = toAbsoluteUrl(href, source.channelUrl);
    if (!title || !url) continue;

    items.push({
      title,
      url,
      publishedAt: getTagContent(entry, "published") || getTagContent(entry, "updated"),
      summary: stripHtml(getTagContent(entry, "summary") || getTagContent(entry, "content")),
    });
  }

  return items;
}

function parseRss(xml: string, source: SourceDefinition): ParsedFeedItem[] {
  const items: ParsedFeedItem[] = [];
  const matches = xml.matchAll(/<item[\s\S]*?<\/item>/gi);

  for (const match of matches) {
    const item = match[0];
    const title = stripHtml(getTagContent(item, "title"));
    const href = getTagContent(item, "link") || getTagContent(item, "guid");
    const url = toAbsoluteUrl(href, source.channelUrl);
    if (!title || !url) continue;

    items.push({
      title,
      url,
      publishedAt:
        getTagContent(item, "pubDate") ||
        getTagContent(item, "dc:date") ||
        getTagContent(item, "date"),
      summary: stripHtml(
        getTagContent(item, "description") || getTagContent(item, "content:encoded"),
      ),
    });
  }

  return items;
}

export function parseFeed(xml: string, source: SourceDefinition): ParsedFeedItem[] {
  if (xml.includes("<feed")) {
    return parseAtom(xml, source);
  }

  return parseRss(xml, source);
}

export const feedAdapter: SourceAdapter = {
  async collect(source, options = {}): Promise<CandidateItem[]> {
    const fetchFn = getFetchFn(options.fetchFn);
    const url = source.fetchUrl;
    if (!url) return [];

    const response = await fetchFn(url, {
      ...buildTimedRequestInit(
        {
          headers: {
            Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
          },
        },
        options.timeoutMs,
      ),
    });

    if (!response.ok) {
      throw new Error(`Feed request failed for ${source.id}: ${response.status}`);
    }

    const xml = await response.text();
    const items = parseFeed(xml, source).slice(0, source.maxItems || 20);
    return items.map((item) => buildCandidate(source, item, options.now));
  },
};
