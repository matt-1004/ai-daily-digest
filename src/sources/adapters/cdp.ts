import { execFile } from "node:child_process";
import { promisify } from "node:util";

export interface CdpTab {
  targetId: string;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const CDP_BASE_URL = "http://localhost:3456";
const CDP_TIMEOUT_MS = Number(process.env.CDP_TIMEOUT_MS || 20000);
const execFileAsync = promisify(execFile);
let ensureCdpPromise: Promise<void> | null = null;

function withCdpTimeout(init: RequestInit = {}): RequestInit {
  if (init.signal || CDP_TIMEOUT_MS <= 0 || typeof AbortSignal === "undefined") {
    return init;
  }

  return {
    ...init,
    signal: AbortSignal.timeout(CDP_TIMEOUT_MS),
  };
}

async function cdpFetch(url: string, init: RequestInit = {}): Promise<Response> {
  return fetch(url, withCdpTimeout(init));
}

async function pingCdpProxy(): Promise<boolean> {
  try {
    const response = await cdpFetch(`${CDP_BASE_URL}/targets`);
    return response.ok;
  } catch {
    return false;
  }
}

async function ensureCdpProxy(): Promise<void> {
  if (await pingCdpProxy()) return;

  ensureCdpPromise ||= (async () => {
    const checkDepsScript =
      process.env.WEB_ACCESS_CHECK_DEPS ||
      "/Users/yongku/.agents/skills/web-access/scripts/check-deps.mjs";

    await execFileAsync("node", [checkDepsScript], { timeout: 30000 });

    if (!(await pingCdpProxy())) {
      throw new Error("CDP proxy is not ready after running web-access dependency check");
    }
  })().finally(() => {
    ensureCdpPromise = null;
  });

  await ensureCdpPromise;
}

export async function openCdpTab(url: string): Promise<CdpTab> {
  await ensureCdpProxy();

  const response = await cdpFetch(`${CDP_BASE_URL}/new?url=${encodeURIComponent(url)}`);
  if (!response.ok) {
    throw new Error(`CDP tab open failed: ${response.status}`);
  }

  return response.json() as Promise<CdpTab>;
}

export async function evalCdpTab<T>(targetId: string, expression: string): Promise<T> {
  await ensureCdpProxy();

  const response = await cdpFetch(`${CDP_BASE_URL}/eval?target=${encodeURIComponent(targetId)}`, {
    method: "POST",
    body: expression,
  });
  if (!response.ok) {
    throw new Error(`CDP eval failed: ${response.status}`);
  }

  const payload = await response.json() as { value?: T; error?: string };
  if (payload.error) throw new Error(payload.error);
  return payload.value as T;
}

export async function closeCdpTab(targetId: string): Promise<void> {
  await cdpFetch(`${CDP_BASE_URL}/close?target=${encodeURIComponent(targetId)}`).catch(() => undefined);
}

export async function waitForCdpItems<T>(
  targetId: string,
  expression: string,
  options: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<T[]> {
  const timeoutMs = options.timeoutMs || CDP_TIMEOUT_MS;
  const intervalMs = options.intervalMs || 1000;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const items = await evalCdpTab<T[]>(targetId, expression);
    if (items.length > 0) return items;

    await evalCdpTab<unknown>(
      targetId,
      "window.scrollBy(0, Math.max(700, Math.floor(window.innerHeight * 0.8))); undefined",
    ).catch(() => undefined);
    await delay(intervalMs);
  }

  return [];
}
