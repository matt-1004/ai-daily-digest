import type { SourceDefinition } from "../types/content.ts";

export const GITHUB_SOURCES: SourceDefinition[] = [
  {
    id: "github-openai-python",
    name: "openai/openai-python Releases",
    kind: "github_release",
    adapter: "github_releases",
    channelUrl: "https://github.com/openai/openai-python",
    laneHint: "daily",
  },
  {
    id: "github-openai-node",
    name: "openai/openai-node Releases",
    kind: "github_release",
    adapter: "github_releases",
    channelUrl: "https://github.com/openai/openai-node",
    laneHint: "daily",
  },
  {
    id: "github-anthropic-ts",
    name: "anthropics/anthropic-sdk-typescript Releases",
    kind: "github_release",
    adapter: "github_releases",
    channelUrl: "https://github.com/anthropics/anthropic-sdk-typescript",
    laneHint: "daily",
  },
  {
    id: "github-deepmind-alphafold3",
    name: "google-deepmind/alphafold3 Releases",
    kind: "github_release",
    adapter: "github_releases",
    channelUrl: "https://github.com/google-deepmind/alphafold3",
    laneHint: "daily",
  },
  {
    id: "github-meta-llama-models",
    name: "meta-llama/llama-models Releases",
    kind: "github_release",
    adapter: "github_releases",
    channelUrl: "https://github.com/meta-llama/llama-models",
    laneHint: "daily",
  },
];
