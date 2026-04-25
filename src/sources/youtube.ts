import type { SourceDefinition } from "../types/content.ts";

export const YOUTUBE_SOURCES: SourceDefinition[] = [
  {
    id: "openai-youtube",
    name: "OpenAI YouTube",
    kind: "youtube",
    adapter: "youtube_channel",
    channelUrl: "https://www.youtube.com/@OpenAI",
    fetchUrl: "https://www.youtube.com/feeds/videos.xml?handle=@OpenAI",
    laneHint: "weekly",
  },
  {
    id: "anthropic-youtube",
    name: "Anthropic YouTube",
    kind: "youtube",
    adapter: "youtube_channel",
    channelUrl: "https://www.youtube.com/@anthropic-ai",
    fetchUrl: "https://www.youtube.com/feeds/videos.xml?handle=@anthropic-ai",
    laneHint: "weekly",
  },
  {
    id: "google-deepmind-youtube",
    name: "Google DeepMind YouTube",
    kind: "youtube",
    adapter: "youtube_channel",
    channelUrl: "https://www.youtube.com/@GoogleDeepMind",
    fetchUrl: "https://www.youtube.com/feeds/videos.xml?handle=@GoogleDeepMind",
    laneHint: "weekly",
  },
  {
    id: "meta-ai-youtube",
    name: "AI at Meta YouTube",
    kind: "youtube",
    adapter: "youtube_channel",
    channelUrl: "https://www.youtube.com/@AIatMeta",
    fetchUrl: "https://www.youtube.com/feeds/videos.xml?handle=@AIatMeta",
    laneHint: "weekly",
  },
];
