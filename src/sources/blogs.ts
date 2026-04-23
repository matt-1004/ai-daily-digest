import type { SourceDefinition } from "../types/content.ts";

export const BLOG_SOURCES: SourceDefinition[] = [
  {
    id: "simon-willison-blog",
    name: "Simon Willison",
    kind: "independent_blog",
    adapter: "atom",
    channelUrl: "https://simonwillison.net/",
    fetchUrl: "https://simonwillison.net/atom/everything/",
    laneHint: "weekly",
  },
  {
    id: "gwern-blog",
    name: "Gwern",
    kind: "independent_blog",
    adapter: "rss",
    channelUrl: "https://gwern.net/",
    fetchUrl: "https://gwern.substack.com/feed",
    laneHint: "weekly",
  },
  {
    id: "latent-space-blog",
    name: "Latent Space Blog",
    kind: "independent_blog",
    adapter: "rss",
    channelUrl: "https://www.latent.space/",
    fetchUrl: "https://www.latent.space/feed",
    laneHint: "weekly",
  },
];
