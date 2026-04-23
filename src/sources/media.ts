import type { SourceDefinition } from "../types/content.ts";

export const MEDIA_SOURCES: SourceDefinition[] = [
  {
    id: "techcrunch-ai",
    name: "TechCrunch AI",
    kind: "major_media",
    adapter: "rss",
    channelUrl: "https://techcrunch.com/category/artificial-intelligence/",
    fetchUrl: "https://techcrunch.com/category/artificial-intelligence/feed/",
    laneHint: "daily",
  },
  {
    id: "reuters-ai",
    name: "Reuters AI",
    kind: "major_media",
    adapter: "web_page",
    channelUrl: "https://www.reuters.com/technology/artificial-intelligence/",
    laneHint: "daily",
    urlIncludes: ["/technology/"],
  },
  {
    id: "mit-tech-review-ai",
    name: "MIT Technology Review AI",
    kind: "major_media",
    adapter: "web_page",
    channelUrl: "https://www.technologyreview.com/topic/artificial-intelligence/",
    laneHint: "daily",
    urlIncludes: ["/20"],
  },
  {
    id: "the-verge-ai",
    name: "The Verge AI",
    kind: "major_media",
    adapter: "rss",
    channelUrl: "https://www.theverge.com/ai-artificial-intelligence",
    fetchUrl: "https://www.theverge.com/rss/ai/index.xml",
    laneHint: "daily",
  },
];
