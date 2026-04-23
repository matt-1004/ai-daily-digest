import type { SourceDefinition } from "../types/content.ts";

export const PAPER_SOURCES: SourceDefinition[] = [
  {
    id: "arxiv-cs-ai",
    name: "arXiv cs.AI",
    kind: "research_paper",
    adapter: "web_page",
    channelUrl: "https://arxiv.org/list/cs.AI/recent",
    laneHint: "daily",
    urlIncludes: ["/abs/"],
  },
  {
    id: "arxiv-cs-cl",
    name: "arXiv cs.CL",
    kind: "research_paper",
    adapter: "web_page",
    channelUrl: "https://arxiv.org/list/cs.CL/recent",
    laneHint: "daily",
    urlIncludes: ["/abs/"],
  },
  {
    id: "arxiv-cs-lg",
    name: "arXiv cs.LG",
    kind: "research_paper",
    adapter: "web_page",
    channelUrl: "https://arxiv.org/list/cs.LG/recent",
    laneHint: "daily",
    urlIncludes: ["/abs/"],
  },
];
