import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

export interface FeishuDocResult {
  docId: string;
  docUrl: string;
}

export interface FeishuPublisherConfig {
  appId: string;
  appSecret: string;
  brand?: "feishu" | "lark";
}

export interface FeishuBriefingDocTargets {
  dailyDocId?: string;
  weeklyDocId?: string;
}

export interface FeishuDocInput {
  title: string;
  markdown: string;
}

interface CliResponse {
  ok: boolean;
  data?: {
    doc_id?: string;
    doc_url?: string;
  };
  error?: {
    message?: string;
  };
}

export function getFeishuPublisherConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): FeishuPublisherConfig | null {
  const appId = env.FEISHU_APP_ID?.trim();
  const appSecret = env.FEISHU_APP_SECRET?.trim();
  if (!appId || !appSecret) return null;

  return {
    appId,
    appSecret,
    brand: "feishu",
  };
}

export function getFeishuBriefingDocTargetsFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): FeishuBriefingDocTargets {
  const dailyDocId = env.FEISHU_DAILY_DOC_ID?.trim();
  const weeklyDocId = env.FEISHU_WEEKLY_DOC_ID?.trim();

  return {
    ...(dailyDocId ? { dailyDocId } : {}),
    ...(weeklyDocId ? { weeklyDocId } : {}),
  };
}

async function createTempLarkHome(config: FeishuPublisherConfig): Promise<string> {
  const homeDir = await mkdtemp(join(tmpdir(), "ai-daily-digest-lark-"));
  const configDir = join(homeDir, ".lark-cli");
  await mkdir(configDir, { recursive: true });
  await writeFile(
    join(configDir, "config.json"),
    JSON.stringify(
      {
        apps: [
          {
            appId: config.appId,
            appSecret: config.appSecret,
            brand: config.brand || "feishu",
            lang: "zh",
            users: [],
          },
        ],
      },
      null,
      2,
    ),
    "utf-8",
  );

  return homeDir;
}

function getFeishuDocBaseUrl(brand: FeishuPublisherConfig["brand"] = "feishu"): string {
  return brand === "lark" ? "https://www.larksuite.com/docx" : "https://www.feishu.cn/docx";
}

async function runLarkCli(
  homeDir: string,
  args: string[],
  brand: FeishuPublisherConfig["brand"] = "feishu",
): Promise<FeishuDocResult> {
  const child = spawn("lark-cli", args, {
    env: { ...process.env, HOME: homeDir },
    stdio: ["ignore", "pipe", "pipe"],
  });

  const stdoutChunks: Buffer[] = [];
  const stderrChunks: Buffer[] = [];

  child.stdout.on("data", (chunk) => stdoutChunks.push(Buffer.from(chunk)));
  child.stderr.on("data", (chunk) => stderrChunks.push(Buffer.from(chunk)));

  const exitCode = await new Promise<number>((resolve, reject) => {
    child.on("error", reject);
    child.on("close", resolve);
  });

  const stdout = Buffer.concat(stdoutChunks).toString("utf-8");
  const stderr = Buffer.concat(stderrChunks).toString("utf-8");

  if (exitCode !== 0) {
    throw new Error(`lark-cli exited with code ${exitCode}: ${stderr || stdout}`);
  }

  const parsed = JSON.parse(stdout) as CliResponse;
  const docId = parsed.data?.doc_id?.trim();
  const docUrl = parsed.data?.doc_url?.trim();
  if (!parsed.ok || !docId) {
    throw new Error(parsed.error?.message || `Unexpected lark-cli response: ${stdout}`);
  }

  return {
    docId,
    docUrl: docUrl || `${getFeishuDocBaseUrl(brand)}/${docId}`,
  };
}

async function runLarkCliCreate(
  homeDir: string,
  input: FeishuDocInput,
  brand: FeishuPublisherConfig["brand"] = "feishu",
): Promise<FeishuDocResult> {
  return runLarkCli(
    homeDir,
    [
      "docs",
      "+create",
      "--as",
      "bot",
      "--title",
      input.title,
      "--markdown",
      input.markdown,
    ],
    brand,
  );
}

async function runLarkCliUpdate(
  homeDir: string,
  input: FeishuDocInput & { docId: string },
  brand: FeishuPublisherConfig["brand"] = "feishu",
): Promise<FeishuDocResult> {
  return runLarkCli(
    homeDir,
    [
      "docs",
      "+update",
      "--as",
      "bot",
      "--doc",
      input.docId,
      "--mode",
      "overwrite",
      "--new-title",
      input.title,
      "--markdown",
      input.markdown,
    ],
    brand,
  );
}

export async function publishMarkdownToFeishuDoc(
  config: FeishuPublisherConfig,
  input: FeishuDocInput,
): Promise<FeishuDocResult> {
  const homeDir = await createTempLarkHome(config);

  try {
    return await runLarkCliCreate(homeDir, input, config.brand);
  } finally {
    await rm(homeDir, { recursive: true, force: true });
  }
}

export async function updateMarkdownToFeishuDoc(
  config: FeishuPublisherConfig,
  input: FeishuDocInput & { docId: string },
): Promise<FeishuDocResult> {
  const homeDir = await createTempLarkHome(config);

  try {
    return await runLarkCliUpdate(homeDir, input, config.brand);
  } finally {
    await rm(homeDir, { recursive: true, force: true });
  }
}

export async function upsertMarkdownToFeishuDoc(
  config: FeishuPublisherConfig,
  input: FeishuDocInput & { docId?: string },
): Promise<FeishuDocResult> {
  if (input.docId) {
    return updateMarkdownToFeishuDoc(config, {
      docId: input.docId,
      title: input.title,
      markdown: input.markdown,
    });
  }

  return publishMarkdownToFeishuDoc(config, input);
}

export async function publishBriefingDocs(
  config: FeishuPublisherConfig,
  input: {
    dailyTitle: string;
    dailyMarkdown: string;
    weeklyTitle: string;
    weeklyMarkdown: string;
    dailyDocId?: string;
    weeklyDocId?: string;
  },
): Promise<{ daily: FeishuDocResult; weekly: FeishuDocResult }> {
  const daily = await upsertMarkdownToFeishuDoc(config, {
    docId: input.dailyDocId,
    title: input.dailyTitle,
    markdown: input.dailyMarkdown,
  });

  const weekly = await upsertMarkdownToFeishuDoc(config, {
    docId: input.weeklyDocId,
    title: input.weeklyTitle,
    markdown: input.weeklyMarkdown,
  });

  return { daily, weekly };
}
