import type { CandidateItem } from "../../types/content.ts";
import { buildCandidate, type CollectOptions, type SourceAdapter } from "./shared.ts";
import { closeCdpTab, openCdpTab, waitForCdpItems } from "./cdp.ts";

interface XPost {
  title: string;
  url: string;
  summary?: string;
}

export const xAccountAdapter: SourceAdapter = {
  async collect(source, options: CollectOptions = {}): Promise<CandidateItem[]> {
    const tab = await openCdpTab(source.channelUrl);
    const fallbackName = JSON.stringify(source.name);

    try {
      const posts = await waitForCdpItems<XPost>(tab.targetId, `(() => {
        const posts = [];
        const seen = new Set();
        for (const article of document.querySelectorAll('article, [data-testid="cellInnerDiv"]')) {
          const text = (article.innerText || '').trim();
          if (!text || text.length < 40) continue;
          const status = [...article.querySelectorAll('a[href*="/status/"]')]
            .map((a) => a.href)
            .find((href) => /\\/status\\/\\d+/.test(href));
          if (!status || seen.has(status)) continue;
          const normalized = status.replace('/analytics', '').replace(/\\/photo\\/\\d+$/, '');
          if (seen.has(normalized)) continue;
          seen.add(normalized);
          const lines = text.split('\\n').map((line) => line.trim()).filter(Boolean);
          const handleIndex = lines.findIndex((line) => /^@/.test(line));
          const author = handleIndex > 0 ? lines[handleIndex - 1] : ${fallbackName};
          let bodyStart = handleIndex >= 0 ? handleIndex + 1 : 1;
          while (
            bodyStart < lines.length &&
            (lines[bodyStart] === '·' ||
              /^\\d+[smhd]$/.test(lines[bodyStart]) ||
              /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\\b/.test(lines[bodyStart]))
          ) {
            bodyStart += 1;
          }
          const body = lines.slice(bodyStart).join(' ').slice(0, 500);
          posts.push({
            title: author + ': ' + body.slice(0, 120),
            url: normalized,
            summary: body,
          });
        }
        return posts.slice(0, 10);
      })()`, { timeoutMs: options.timeoutMs || 20000 });

      return posts.map((post) => buildCandidate(source, post, options.now));
    } finally {
      await closeCdpTab(tab.targetId);
    }
  },
};
