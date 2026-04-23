import type { SourceDefinition } from "../types/content.ts";

export const YOUTUBE_SOURCES: SourceDefinition[] = [
  {
    id: "openai-youtube",
    name: "OpenAI YouTube",
    kind: "youtube",
    adapter: "youtube_channel",
    channelUrl: "https://www.youtube.com/@OpenAI",
    laneHint: "weekly",
  },
  {
    id: "anthropic-youtube",
    name: "Anthropic YouTube",
    kind: "youtube",
    adapter: "youtube_channel",
    channelUrl: "https://www.youtube.com/@AnthropicAI",
    laneHint: "weekly",
  },
  {
    id: "google-deepmind-youtube",
    name: "Google DeepMind YouTube",
    kind: "youtube",
    adapter: "youtube_channel",
    channelUrl: "https://www.youtube.com/@GoogleDeepMind",
    laneHint: "weekly",
  },
  {
    id: "meta-ai-youtube",
    name: "AI at Meta YouTube",
    kind: "youtube",
    adapter: "youtube_channel",
    channelUrl: "https://www.youtube.com/@AIatMeta",
    laneHint: "weekly",
  },
];
