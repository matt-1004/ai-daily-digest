import { getDefaultSourceCatalog } from "../src/sources/index.ts";
import { collectFromSource } from "../src/sources/adapters/index.ts";

const timeoutMs = Number(process.env.SOURCE_TIMEOUT_MS || 15000);
const sourceLimitMs = Number(process.env.SOURCE_LIMIT_MS || timeoutMs + 5000);
const results = [];

async function withSourceLimit<T>(promise: Promise<T>, label: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const limit = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(`Source check timed out for ${label}`)), sourceLimitMs);
  });

  try {
    return await Promise.race([promise, limit]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

for (const source of getDefaultSourceCatalog()) {
  const started = Date.now();
  console.error(`checking ${source.id} (${source.adapter})`);
  try {
    const items = await withSourceLimit(collectFromSource(source, { timeoutMs }), source.id);
    const result = {
      id: source.id,
      name: source.name,
      kind: source.kind,
      adapter: source.adapter,
      status: items.length > 0 ? "ok" : "empty",
      count: items.length,
      sampleTitle: items[0]?.title || "",
      sampleUrl: items[0]?.url || "",
      ms: Date.now() - started,
    };
    results.push(result);
    console.error(`  ${result.status}: ${result.count} item(s)`);
  } catch (error) {
    const result = {
      id: source.id,
      name: source.name,
      kind: source.kind,
      adapter: source.adapter,
      status: "error",
      count: 0,
      error: error instanceof Error ? error.message : String(error),
      ms: Date.now() - started,
    };
    results.push(result);
    console.error(`  error: ${result.error}`);
  }
}

console.log(JSON.stringify(results, null, 2));
