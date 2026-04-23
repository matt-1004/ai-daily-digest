import type { SourceDefinition } from "../types/content.ts";

export const SOCIAL_SOURCES: SourceDefinition[] = [
  {
    id: "openai-x",
    name: "OpenAI on X",
    kind: "x",
    adapter: "x_account",
    channelUrl: "https://x.com/OpenAI",
    laneHint: "watchlist",
  },
  {
    id: "openai-devs-x",
    name: "OpenAI Developers on X",
    kind: "x",
    adapter: "x_account",
    channelUrl: "https://x.com/OpenAIDevs",
    laneHint: "watchlist",
  },
  {
    id: "anthropic-x",
    name: "Anthropic on X",
    kind: "x",
    adapter: "x_account",
    channelUrl: "https://x.com/AnthropicAI",
    laneHint: "watchlist",
  },
  {
    id: "google-deepmind-x",
    name: "Google DeepMind on X",
    kind: "x",
    adapter: "x_account",
    channelUrl: "https://x.com/GoogleDeepMind",
    laneHint: "watchlist",
  },
  {
    id: "meta-ai-x",
    name: "AI at Meta on X",
    kind: "x",
    adapter: "x_account",
    channelUrl: "https://x.com/AIatMeta",
    laneHint: "watchlist",
  },
];
