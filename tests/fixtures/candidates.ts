import type { CandidateItem, SourceRef } from "../../src/types/content.ts";

function source(overrides: Partial<SourceRef>): SourceRef {
  return {
    name: "Unknown source",
    kind: "official_site",
    url: "https://example.com",
    isOfficial: false,
    independent: true,
    ...overrides,
  };
}

function candidate(overrides: Partial<CandidateItem>): CandidateItem {
  return {
    id: "candidate-1",
    title: "Untitled",
    url: "https://example.com/posts/1",
    canonicalUrl: "https://example.com/posts/1",
    publishedAt: "2026-04-23T00:00:00.000Z",
    source: source({}),
    corroboratingSources: [],
    tags: [],
    ...overrides,
  };
}

export const officialAnnouncement = candidate({
  id: "official-announcement",
  title: "OpenAI launches a new evals API",
  url: "https://openai.com/news/new-evals-api",
  canonicalUrl: "https://openai.com/news/new-evals-api",
  source: source({
    name: "OpenAI News",
    kind: "official_site",
    url: "https://openai.com/newsroom/",
    isOfficial: true,
  }),
});

export const confirmedMediaCoverage = candidate({
  id: "confirmed-media-coverage",
  title: "OpenAI unveils a new evals API",
  url: "https://techcrunch.com/2026/04/23/openai-evals-api",
  canonicalUrl: "https://techcrunch.com/2026/04/23/openai-evals-api",
  originalUrl: "https://openai.com/news/new-evals-api",
  source: source({
    name: "TechCrunch AI",
    kind: "major_media",
    url: "https://techcrunch.com/category/artificial-intelligence/",
  }),
  corroboratingSources: [
    source({
      name: "Reuters AI",
      kind: "major_media",
      url: "https://www.reuters.com/technology/artificial-intelligence/",
      independent: true,
    }),
    source({
      name: "The Verge AI",
      kind: "major_media",
      url: "https://www.theverge.com/ai-artificial-intelligence",
      independent: true,
    }),
  ],
});

export const unverifiedMediaCoverage = candidate({
  id: "unverified-media-coverage",
  title: "OpenAI may be preparing a new evals API",
  url: "https://example-media.com/openai-may-launch-evals-api",
  canonicalUrl: "https://example-media.com/openai-may-launch-evals-api",
  source: source({
    name: "Example Media",
    kind: "major_media",
    url: "https://example-media.com/ai",
  }),
});

export const podcastDeepDive = candidate({
  id: "podcast-deep-dive",
  title: "What the new evals API changes for AI teams",
  url: "https://podcasts.example.com/episodes/evals-api",
  canonicalUrl: "https://podcasts.example.com/episodes/evals-api",
  source: source({
    name: "Latent Space",
    kind: "podcast",
    url: "https://www.latent.space/podcast",
  }),
});

export const xRumor = candidate({
  id: "x-rumor",
  title: "Rumor: OpenAI is shipping a secret evals product tonight",
  url: "https://x.com/example/status/123",
  canonicalUrl: "https://x.com/example/status/123",
  source: source({
    name: "Example on X",
    kind: "x",
    url: "https://x.com/example",
  }),
});

export const duplicateOfficialAnnouncement = candidate({
  id: "duplicate-official-announcement",
  title: "OpenAI launches a new evals API",
  url: "https://openai.com/news/new-evals-api?utm_source=rss",
  canonicalUrl: "https://openai.com/news/new-evals-api",
  source: source({
    name: "OpenAI Blog",
    kind: "official_blog",
    url: "https://openai.com/blog/",
    isOfficial: true,
  }),
});

export const lowSignalOfficialPost = candidate({
  id: "low-signal-official-post",
  title: "Live Chats on Threads: Because Big Moments Are Better Together",
  url: "https://about.fb.com/news/2026/04/threads-live-chats",
  canonicalUrl: "https://about.fb.com/news/2026/04/threads-live-chats",
  source: source({
    name: "Meta Newsroom",
    kind: "official_site",
    url: "https://about.fb.com/news/",
    isOfficial: true,
  }),
});

export const unrelatedOfficialUpdate = candidate({
  id: "unrelated-official-update",
  title: "OpenAI publishes a new image guide",
  url: "https://openai.com/news/image-guide",
  canonicalUrl: "https://openai.com/news/image-guide",
  source: source({
    name: "OpenAI News",
    kind: "official_site",
    url: "https://openai.com/newsroom/",
    isOfficial: true,
  }),
});
