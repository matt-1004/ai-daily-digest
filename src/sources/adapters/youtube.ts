import type { CandidateItem, SourceDefinition } from "../../types/content.ts";
import { feedAdapter } from "./feed.ts";
import type { CollectOptions, SourceAdapter } from "./shared.ts";
import { buildCandidate } from "./shared.ts";
import { closeCdpTab, openCdpTab, waitForCdpItems } from "./cdp.ts";

function toYoutubeFeedUrl(source: SourceDefinition): string | null {
  if (source.fetchUrl) return source.fetchUrl;
  const match = source.channelUrl.match(/\/channel\/([^/?#]+)/);
  if (!match?.[1]) return null;
  return `https://www.youtube.com/feeds/videos.xml?channel_id=${match[1]}`;
}

async function collectWithCdp(source: SourceDefinition, options?: CollectOptions): Promise<CandidateItem[]> {
  const videosUrl = source.channelUrl.replace(/\/$/, "") + "/videos";
  const tab = await openCdpTab(videosUrl);

  try {
    const items = await waitForCdpItems<{ title: string; url: string; summary?: string }>(tab.targetId, `(() => {
      const byUrl = new Map();
      for (const link of document.querySelectorAll('a[href*="/watch?v="], a[href*="/shorts/"]')) {
        const rawHref = link.getAttribute('href');
        if (!rawHref) continue;

        const normalized = new URL(rawHref, location.href);
        if (normalized.pathname === '/watch') {
          const videoId = normalized.searchParams.get('v');
          if (!videoId) continue;
          normalized.search = '?v=' + videoId;
        }

        const text = (link.textContent || link.getAttribute('aria-label') || '')
          .trim()
          .replace(/\\s+/g, ' ');
        if (
          !text ||
          text.length < 8 ||
          /^(\\d+:\\d+\\s*)?Now playing$/i.test(text) ||
          text.includes('Now playing Now playing')
        ) {
          continue;
        }

        const url = normalized.toString();
        const current = byUrl.get(url);
        if (!current || text.length > current.title.length) {
          byUrl.set(url, { title: text, url, summary: text });
        }
      }
      return [...byUrl.values()].slice(0, 10);
    })()`, { timeoutMs: options?.timeoutMs || 20000 });

    return items.map((item) => buildCandidate(source, item, options?.now));
  } finally {
    await closeCdpTab(tab.targetId);
  }
}

export const youtubeChannelAdapter: SourceAdapter = {
  async collect(source, options?: CollectOptions): Promise<CandidateItem[]> {
    const fetchUrl = toYoutubeFeedUrl(source);
    if (fetchUrl) {
      try {
        const items = await feedAdapter.collect({ ...source, fetchUrl }, options);
        if (items.length > 0) return items;
      } catch {
        // Fall back to the browser adapter for networks where YouTube RSS is blocked.
      }
    }

    return collectWithCdp(source, options);
  },
};
