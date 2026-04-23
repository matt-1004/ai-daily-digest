import type { CandidateItem } from "../types/content.ts";

export type EditorialCategory =
  | "product"
  | "developer"
  | "research"
  | "infrastructure"
  | "policy"
  | "business"
  | "general";

export interface EditorialAssessment {
  category: EditorialCategory;
  relevanceScore: number;
  impactScore: number;
  score: number;
  brief: string;
  whyImportant: string;
  shouldPromoteDaily: boolean;
  shouldPromoteWeeklyNews: boolean;
  shouldPromoteDeepDive: boolean;
}

const AI_TERMS = [
  "ai",
  "llm",
  "gpt",
  "chatgpt",
  "claude",
  "gemini",
  "llama",
  "model",
  "models",
  "language model",
  "large language model",
  "multimodal",
  "agent",
  "agents",
  "api",
  "sdk",
  "developer",
  "developers",
  "inference",
  "model training",
  "benchmark",
  "eval",
  "evaluation",
  "privacy",
  "safety",
  "research",
  "machine learning",
  "data center",
  "compute",
  "gpu",
  "clinical",
  "clinician",
  "medical",
  "image",
  "images",
];

const PRODUCT_TERMS = [
  "chatgpt",
  "claude",
  "gemini",
  "workspace agents",
  "assistant",
  "image",
  "images",
  "clinician",
  "clinical",
  "launch",
  "introducing",
];

const DEVELOPER_TERMS = [
  "api",
  "sdk",
  "developer",
  "developers",
  "eval",
  "responses api",
  "websocket",
  "agentic workflow",
  "release",
  "open weight",
];

const RESEARCH_TERMS = [
  "research",
  "paper",
  "arxiv",
  "benchmark",
  "domain adaptation",
  "large language model",
  "model training",
  "inference",
  "fine tuning",
];

const INFRASTRUCTURE_TERMS = [
  "data center",
  "compute",
  "gpu",
  "cluster",
  "inference",
  "capacity",
  "infrastructure",
  "optimized",
];

const POLICY_TERMS = [
  "privacy",
  "safety",
  "regulation",
  "governance",
  "policy",
  "compliance",
  "nist",
  "eu ai",
  "ai office",
];

const BUSINESS_TERMS = [
  "pricing",
  "enterprise",
  "workspace",
  "team",
  "market",
  "customer",
  "partnership",
  "revenue",
];

const LOW_SIGNAL_TERMS = [
  "threads",
  "creators",
  "fans",
  "edits",
  "instagram",
  "facebook",
  "reels",
  "moments",
  "together",
  "community",
  "celebration",
  "fiber",
  "technician",
  "jobs",
];

const LOW_URGENCY_TERMS = [
  "fundamentals",
  "what is ai",
  "guide",
  "academy",
  "tutorial",
  "basics",
];

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function getCandidateText(item: CandidateItem): string {
  return normalizeText(
    [
      item.title,
      item.summary,
      item.source.name,
      item.source.url,
      item.url,
      item.originalUrl,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function getAgeDays(publishedAt: string, now = new Date()): number {
  const published = new Date(publishedAt);
  if (Number.isNaN(published.getTime())) return 365;
  return (now.getTime() - published.getTime()) / (1000 * 60 * 60 * 24);
}

function countMatches(text: string, terms: string[]): number {
  return terms.reduce((count, term) => count + (text.includes(term) ? 1 : 0), 0);
}

function containsAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function detectCategory(item: CandidateItem, text: string): EditorialCategory {
  if (item.source.kind === "research_paper" || containsAny(text, RESEARCH_TERMS)) {
    return "research";
  }

  if (item.source.kind === "github_release" || containsAny(text, DEVELOPER_TERMS)) {
    return "developer";
  }

  if (containsAny(text, INFRASTRUCTURE_TERMS)) {
    return "infrastructure";
  }

  if (item.source.kind === "regulator" || containsAny(text, POLICY_TERMS)) {
    return "policy";
  }

  if (containsAny(text, PRODUCT_TERMS)) {
    return "product";
  }

  if (containsAny(text, BUSINESS_TERMS)) {
    return "business";
  }

  return "general";
}

function sourceImpactBoost(item: CandidateItem): number {
  const sourceName = item.source.name.toLowerCase();

  if (
    sourceName.includes("openai") ||
    sourceName.includes("anthropic") ||
    sourceName.includes("deepmind")
  ) {
    return 3;
  }

  if (
    sourceName.includes("microsoft") ||
    sourceName.includes("hugging face") ||
    sourceName.includes("meta")
  ) {
    return 2;
  }

  if (item.source.kind === "research_paper" || item.source.kind === "github_release") {
    return 2;
  }

  return 1;
}

function computeRelevanceScore(item: CandidateItem, text: string): number {
  let score = 0;

  if (item.source.kind === "official_site" || item.source.kind === "official_blog") {
    score += 2;
  }

  if (item.source.kind === "github_release" || item.source.kind === "research_paper") {
    score += 3;
  }

  score += countMatches(text, AI_TERMS) * 2;
  score += countMatches(text, PRODUCT_TERMS);
  score += countMatches(text, DEVELOPER_TERMS);
  score += countMatches(text, RESEARCH_TERMS);
  score += countMatches(text, INFRASTRUCTURE_TERMS);
  score += countMatches(text, POLICY_TERMS);

  const metaGeneralNews =
    item.source.name === "Meta Newsroom" &&
    !containsAny(text, ["ai", "llama", "model", "data center", "privacy", "image"]);

  if (metaGeneralNews) {
    score -= 6;
  }

  if (!containsAny(text, AI_TERMS)) {
    score -= 4;
  }

  if (containsAny(text, LOW_SIGNAL_TERMS) && !containsAny(text, ["ai", "data center", "model"])) {
    score -= 5;
  }

  if (item.url.includes("/academy/") || containsAny(text, LOW_URGENCY_TERMS)) {
    score -= 3;
  }

  return Math.max(score, 0);
}

function computeImpactScore(item: CandidateItem, text: string, category: EditorialCategory): number {
  let score = sourceImpactBoost(item);

  if (containsAny(text, ["launch", "launches", "introducing", "introduces", "release", "released"])) {
    score += 1;
  }

  if (containsAny(text, ["chatgpt", "claude", "gemini", "llama", "gpt"])) {
    score += 2;
  }

  if (containsAny(text, ["workspace agents", "responses api", "websocket", "privacy filter", "clinician"])) {
    score += 2;
  }

  if (category === "developer" || category === "research" || category === "infrastructure") {
    score += 1;
  }

  return score;
}

function buildFallbackBrief(item: CandidateItem, category: EditorialCategory): string {
  const sourceName = item.source.name.replace(/\s+Newsroom$/, "");

  if (category === "developer") {
    return `${sourceName} 发布开发者能力更新，重点在接口、工具接入或工作流。`;
  }

  if (category === "research") {
    return `${sourceName} 释放了一条研究层信号，重点在模型能力和垂直场景落地。`;
  }

  if (category === "infrastructure") {
    return `${sourceName} 披露了基础设施层动态，反映 AI 供给侧仍在加码。`;
  }

  if (category === "policy") {
    return `${sourceName} 给出治理或合规相关更新，后续可能影响企业采用。`;
  }

  if (category === "business") {
    return `${sourceName} 释放公司战略和商业化方向上的新信号。`;
  }

  return `${sourceName} 发布了一条值得关注的 AI 更新。`;
}

function buildBrief(item: CandidateItem, text: string, category: EditorialCategory): string {
  if (text.includes("workspace agents")) {
    return "OpenAI 把 agent 能力推进到团队工作流和云端执行。";
  }

  if (text.includes("responses api") || (text.includes("websocket") && text.includes("agent"))) {
    return "OpenAI 在开发者链路上继续优化 agent 工作流的实时交互和延迟表现。";
  }

  if (text.includes("privacy filter") || text.includes("pii")) {
    return "OpenAI 开始把隐私过滤能力产品化，瞄准企业级合规场景。";
  }

  if (text.includes("clinician") || text.includes("clinical")) {
    return "OpenAI 正把 ChatGPT 继续推向医疗专业场景。";
  }

  if (text.includes("images 2 0") || (text.includes("chatgpt") && text.includes("image"))) {
    return "OpenAI 继续强化图像生成和多模态能力。";
  }

  if (text.includes("autoadapt") || text.includes("domain adaptation")) {
    return "微软在研究侧推进大模型面向垂直场景的自动适配。";
  }

  if (text.includes("data center")) {
    return "头部公司仍在持续加码 AI 基础设施建设。";
  }

  return buildFallbackBrief(item, category);
}

function buildWhyImportant(text: string, category: EditorialCategory): string {
  if (text.includes("workspace agents")) {
    return "这说明 ChatGPT 正从问答工具走向可编排的团队自动化平台，后续要关注权限、工具连接和计费。";
  }

  if (text.includes("responses api") || (text.includes("websocket") && text.includes("agent"))) {
    return "这会直接影响 agent 产品的实时体验、开发复杂度和 API 成本，对开发者落地很关键。";
  }

  if (text.includes("privacy filter") || text.includes("pii")) {
    return "如果隐私过滤能力成熟，企业把真实数据接入模型的意愿会明显提高。";
  }

  if (text.includes("clinician") || text.includes("clinical")) {
    return "医疗是高价值垂直场景，这类更新更能反映模型进入专业工作流的速度。";
  }

  if (text.includes("images 2 0") || (text.includes("chatgpt") && text.includes("image"))) {
    return "图像模型升级会影响多模态产品竞争力，也会改变内容生成场景的能力边界。";
  }

  if (text.includes("autoadapt") || text.includes("domain adaptation")) {
    return "高风险行业的大模型适配是落地难点，这类研究比通用 demo 更接近真实业务问题。";
  }

  if (text.includes("data center")) {
    return "资本开支和算力供给决定后续模型训练与推理节奏，是中期竞争力的重要信号。";
  }

  if (category === "developer") {
    return "这会直接影响 API 能力、接入方式和团队工作流，离开发者实际落地很近。";
  }

  if (category === "research") {
    return "要看它能否进入后续产品化或垂直行业场景，而不只是停留在论文层。";
  }

  if (category === "infrastructure") {
    return "基础设施层变化通常先影响供给能力和成本结构，后面才反映到产品节奏。";
  }

  if (category === "policy") {
    return "这类变化会影响企业采用门槛、数据使用方式和合规要求。";
  }

  if (category === "business") {
    return "这反映的是公司战略和行业竞争方向，不只是单点功能更新。";
  }

  return "这是值得跟踪的行业信号，后续要看它是否形成持续产品化或生态扩散。";
}

export function assessEditorialValue(item: CandidateItem): EditorialAssessment {
  const text = getCandidateText(item);
  const category = detectCategory(item, text);
  const relevanceScore = computeRelevanceScore(item, text);
  const impactScore = computeImpactScore(item, text, category);
  const score = relevanceScore + impactScore;
  const ageDays = getAgeDays(item.publishedAt);
  const guideLikeContent =
    item.url.includes("/podcast/") ||
    item.url.includes("/academy/") ||
    containsAny(text, LOW_URGENCY_TERMS);
  const dailySourceAllowed =
    item.source.kind !== "podcast" &&
    item.source.kind !== "independent_blog" &&
    item.source.kind !== "youtube" &&
    item.source.kind !== "x" &&
    item.source.kind !== "community" &&
    !guideLikeContent;
  const weeklyNewsSourceAllowed =
    item.source.kind !== "podcast" &&
    item.source.kind !== "independent_blog" &&
    item.source.kind !== "youtube" &&
    item.source.kind !== "x" &&
    item.source.kind !== "community" &&
    !guideLikeContent;

  return {
    category,
    relevanceScore,
    impactScore,
    score,
    brief: buildBrief(item, text, category),
    whyImportant: buildWhyImportant(text, category),
    shouldPromoteDaily: dailySourceAllowed && score >= 8 && ageDays <= 4,
    shouldPromoteWeeklyNews: weeklyNewsSourceAllowed && score >= 6 && ageDays <= 10,
    shouldPromoteDeepDive: score >= 4 && ageDays <= 21,
  };
}

export function compareEditorialPriority(left: CandidateItem, right: CandidateItem): number {
  const leftAssessment = assessEditorialValue(left);
  const rightAssessment = assessEditorialValue(right);

  if (rightAssessment.score !== leftAssessment.score) {
    return rightAssessment.score - leftAssessment.score;
  }

  const rightTime = new Date(right.publishedAt).getTime();
  const leftTime = new Date(left.publishedAt).getTime();
  return rightTime - leftTime;
}

export function buildEditorialHighlights(items: CandidateItem[], limit: number): string[] {
  const seen = new Set<string>();
  const lines: string[] = [];

  for (const item of items) {
    const brief = assessEditorialValue(item).brief;
    if (seen.has(brief)) continue;
    seen.add(brief);
    lines.push(`- ${brief}`);
    if (lines.length >= limit) break;
  }

  return lines;
}
