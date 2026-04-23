import type { CandidateItem, SourceDefinition } from "../../types/content.ts";

export type FetchFn = (
  input: string,
  init?: RequestInit,
) => Promise<{
  ok: boolean;
  status: number;
  text(): Promise<string>;
}>;

export interface CollectOptions {
  fetchFn?: FetchFn;
  now?: Date;
  timeoutMs?: number;
}

export interface SourceAdapter {
  collect(source: SourceDefinition, options?: CollectOptions): Promise<CandidateItem[]>;
}

export function getFetchFn(fetchFn?: FetchFn): FetchFn {
  return fetchFn || (globalThis.fetch as FetchFn);
}

export function buildTimedRequestInit(
  init: RequestInit = {},
  timeoutMs = 8000,
): RequestInit {
  if (init.signal || timeoutMs <= 0 || typeof AbortSignal === "undefined") {
    return init;
  }

  return {
    ...init,
    signal: AbortSignal.timeout(timeoutMs),
  };
}

export function toAbsoluteUrl(value: string, baseUrl: string): string | null {
  if (!value) return null;
  if (value.startsWith("#") || value.startsWith("javascript:") || value.startsWith("mailto:")) {
    return null;
  }

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return null;
  }
}

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeDate(dateString: string | undefined, now = new Date()): string {
  if (!dateString) return now.toISOString();
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return now.toISOString();
  return parsed.toISOString();
}

export function buildCandidateId(sourceId: string, url: string): string {
  return `${sourceId}:${url}`;
}

export function buildCandidate(
  source: SourceDefinition,
  input: {
    title: string;
    url: string;
    publishedAt?: string;
    summary?: string;
  },
  now = new Date(),
): CandidateItem {
  return {
    id: buildCandidateId(source.id, input.url),
    title: input.title,
    url: input.url,
    canonicalUrl: input.url,
    publishedAt: normalizeDate(input.publishedAt, now),
    summary: input.summary,
    source: {
      name: source.name,
      kind: source.kind,
      url: source.channelUrl,
      isOfficial: source.kind === "official_site" || source.kind === "official_blog",
      independent: source.kind !== "official_site" && source.kind !== "official_blog",
    },
    corroboratingSources: [],
    tags: [],
  };
}

export function filterSourceUrl(source: SourceDefinition, url: string): boolean {
  if (source.urlIncludes && !source.urlIncludes.some((needle) => url.includes(needle))) {
    return false;
  }

  if (source.urlExcludes && source.urlExcludes.some((needle) => url.includes(needle))) {
    return false;
  }

  return true;
}
