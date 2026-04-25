import { describe, expect, test } from "bun:test";

import { collectFromCatalog, collectFromSource } from "../src/sources/index.ts";
import type { SourceDefinition } from "../src/types/content.ts";
import { toGithubReleasesFeedUrl } from "../src/sources/adapters/github.ts";
import { parseFeed } from "../src/sources/adapters/feed.ts";

function response(body: string) {
  return {
    ok: true,
    status: 200,
    async text() {
      return body;
    },
  };
}

describe("source adapters", () => {
  test("collects RSS items into canonical candidates", async () => {
    const source: SourceDefinition = {
      id: "test-rss",
      name: "Test RSS",
      kind: "official_site",
      adapter: "rss",
      channelUrl: "https://example.com/news",
      fetchUrl: "https://example.com/news/feed.xml",
      laneHint: "daily",
    };

    const items = await collectFromSource(source, {
      now: new Date("2026-04-23T00:00:00.000Z"),
      fetchFn: async () =>
        response(`<?xml version="1.0"?>
          <rss><channel>
            <item>
              <title>Launch day</title>
              <link>https://example.com/news/launch-day</link>
              <pubDate>Wed, 23 Apr 2026 00:00:00 GMT</pubDate>
              <description>Product launch</description>
            </item>
          </channel></rss>`),
    });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: "test-rss:https://example.com/news/launch-day",
      title: "Launch day",
      url: "https://example.com/news/launch-day",
      source: { name: "Test RSS", kind: "official_site" },
    });
  });

  test("derives GitHub release feed urls from repository urls", async () => {
    expect(toGithubReleasesFeedUrl("https://github.com/openai/openai-python")).toBe(
      "https://github.com/openai/openai-python/releases.atom",
    );
  });

  test("falls back to Atom entries for GitHub releases", async () => {
    const source: SourceDefinition = {
      id: "test-github",
      name: "OpenAI Python Releases",
      kind: "github_release",
      adapter: "github_releases",
      channelUrl: "https://github.com/not-a-real-owner/not-a-real-repo",
      laneHint: "daily",
    };

    let requestedUrl = "";
    const items = await collectFromSource(source, {
      fetchFn: async (url) => {
        requestedUrl = url;
        return response(`<?xml version="1.0"?>
          <feed xmlns="http://www.w3.org/2005/Atom">
            <entry>
              <title>v2.32.0</title>
              <link rel="alternate" href="https://github.com/openai/openai-python/releases/tag/v2.32.0" />
              <updated>2026-04-15T22:27:00Z</updated>
              <summary>SDK release</summary>
            </entry>
          </feed>`);
      },
    });

    expect(requestedUrl).toBe("https://github.com/not-a-real-owner/not-a-real-repo/releases.atom");
    expect(items[0]?.title).toBe("v2.32.0");
  });

  test("extracts matching article links from web pages", async () => {
    const source: SourceDefinition = {
      id: "test-web",
      name: "Anthropic News",
      kind: "official_site",
      adapter: "web_page",
      channelUrl: "https://www.anthropic.com/news",
      laneHint: "daily",
      urlIncludes: ["/news/"],
      urlExcludes: ["/news$"],
    };

    const items = await collectFromSource(source, {
      fetchFn: async () =>
        response(`
          <html><body>
            <a href="/about">About</a>
            <a href="/news">News</a>
            <a href="/news/model-context-protocol">Model Context Protocol</a>
            <a href="/news/claude-updates">Claude Updates For Teams</a>
          </body></html>
        `),
    });

    expect(items.map((item) => item.url)).toEqual([
      "https://www.anthropic.com/news/model-context-protocol",
      "https://www.anthropic.com/news/claude-updates",
    ]);
  });

  test("parses YouTube Atom feed entries", () => {
    const source: SourceDefinition = {
      id: "test-youtube",
      name: "Test YouTube",
      kind: "youtube",
      adapter: "youtube_channel",
      channelUrl: "https://www.youtube.com/@test",
      fetchUrl: "https://www.youtube.com/feeds/videos.xml?handle=@test",
      laneHint: "weekly",
    };

    const items = parseFeed(`<?xml version="1.0"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <entry>
          <title>Model update walkthrough</title>
          <link rel="alternate" href="https://www.youtube.com/watch?v=abc123" />
          <published>2026-04-24T00:00:00Z</published>
        </entry>
      </feed>`, source);

    expect(items[0]).toMatchObject({
      title: "Model update walkthrough",
      url: "https://www.youtube.com/watch?v=abc123",
    });
  });

  test("continues collecting when one source fails", async () => {
    const sources: SourceDefinition[] = [
      {
        id: "broken",
        name: "Broken",
        kind: "official_site",
        adapter: "rss",
        channelUrl: "https://broken.example.com",
        fetchUrl: "https://broken.example.com/feed.xml",
        laneHint: "daily",
      },
      {
        id: "working",
        name: "Working",
        kind: "official_site",
        adapter: "rss",
        channelUrl: "https://working.example.com",
        fetchUrl: "https://working.example.com/feed.xml",
        laneHint: "daily",
      },
    ];

    const items = await collectFromCatalog(sources, {
      fetchFn: async (url) => {
        if (url.includes("broken")) {
          throw new Error("network error");
        }

        return response(`<?xml version="1.0"?>
          <rss><channel>
            <item>
              <title>Working item</title>
              <link>https://working.example.com/posts/1</link>
            </item>
          </channel></rss>`);
      },
    });

    expect(items.map((item) => item.id)).toEqual([
      "working:https://working.example.com/posts/1",
    ]);
  });
});
