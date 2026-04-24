#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATE_DIR="${HOME}/.codex/ai-daily-digest"
STATE_FILE="${STATE_DIR}/doc-targets.env"
LARK_PROFILE="${LARK_PROFILE:-content-collector-bot}"

mkdir -p "${STATE_DIR}"
chmod 700 "${STATE_DIR}"

export PATH="${HOME}/.bun/bin:/opt/homebrew/bin:/usr/local/bin:${PATH}"

if ! command -v bun >/dev/null 2>&1; then
  echo "bun is not installed. Install it first: curl -fsSL https://bun.sh/install | bash" >&2
  exit 1
fi

if ! command -v lark-cli >/dev/null 2>&1; then
  echo "lark-cli is not installed or not on PATH." >&2
  exit 1
fi

if [[ ! -f "${HOME}/.lark-cli/config.json" ]]; then
  echo "Missing ${HOME}/.lark-cli/config.json. Run lark-cli config init first." >&2
  exit 1
fi

if [[ -f "${STATE_FILE}" ]]; then
  # shellcheck disable=SC1090
  source "${STATE_FILE}"
fi

cd "${REPO_DIR}"

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  UPSTREAM_BRANCH="$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || true)"
  if [[ -n "${UPSTREAM_BRANCH}" ]]; then
    git pull --ff-only
  else
    git fetch origin main
  fi
fi

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "${WORK_DIR}"' EXIT

bun --eval '
  import { formatShanghaiDate, generateCurrentBriefings } from "./src/index.ts";

  const outputDir = process.argv[1];
  const briefings = await generateCurrentBriefings();
  const today = formatShanghaiDate();

  await Bun.write(`${outputDir}/daily.md`, briefings.dailyReport);
  await Bun.write(`${outputDir}/weekly.md`, briefings.weeklyReport);
  await Bun.write(
    `${outputDir}/meta.json`,
    JSON.stringify(
      {
        today,
        counts: {
          canonicalItems: briefings.canonicalItems.length,
          dailyItems: briefings.dailySelection.leadItems.length,
          weeklyNews: briefings.weeklySelection.verifiedNews.length,
          weeklyDeepDives: briefings.weeklySelection.deepDives.length,
        },
      },
      null,
      2,
    ),
  );
' "${WORK_DIR}"

TODAY="$(node -e 'process.stdout.write(require(process.argv[1]).today)' "${WORK_DIR}/meta.json")"
DAILY_TITLE="AI 日报 ${TODAY}"
WEEKLY_TITLE="AI 周报 ${TODAY}"

publish_doc() {
  local title="$1"
  local markdown_file="$2"
  local doc_id="${3:-}"
  local output_file="$4"
  local markdown_dir
  local markdown_name

  markdown_dir="$(dirname "${markdown_file}")"
  markdown_name="$(basename "${markdown_file}")"

  if [[ -n "${doc_id}" ]]; then
    (
      cd "${markdown_dir}"
      lark-cli docs +update \
        --profile "${LARK_PROFILE}" \
        --as bot \
        --doc "${doc_id}" \
        --mode overwrite \
        --new-title "${title}" \
        --markdown "@${markdown_name}"
    ) | tee "${output_file}"
  else
    (
      cd "${markdown_dir}"
      lark-cli docs +create \
        --profile "${LARK_PROFILE}" \
        --as bot \
        --title "${title}" \
        --markdown "@${markdown_name}"
    ) | tee "${output_file}"
  fi
}

DAILY_OUTPUT="${WORK_DIR}/daily-result.json"
WEEKLY_OUTPUT="${WORK_DIR}/weekly-result.json"

publish_doc "${DAILY_TITLE}" "${WORK_DIR}/daily.md" "${FEISHU_DAILY_DOC_ID:-}" "${DAILY_OUTPUT}"
publish_doc "${WEEKLY_TITLE}" "${WORK_DIR}/weekly.md" "${FEISHU_WEEKLY_DOC_ID:-}" "${WEEKLY_OUTPUT}"

node - "${DAILY_OUTPUT}" "${WEEKLY_OUTPUT}" "${STATE_FILE}" <<'NODE'
const fs = require("node:fs");
const [dailyPath, weeklyPath, statePath] = process.argv.slice(2);

function readDocId(path) {
  const output = fs.readFileSync(path, "utf8");
  const jsonStart = output.indexOf("{");
  if (jsonStart < 0) return "";
  const parsed = JSON.parse(output.slice(jsonStart));
  return parsed?.data?.doc_id || "";
}

const dailyDocId = readDocId(dailyPath);
const weeklyDocId = readDocId(weeklyPath);
if (!dailyDocId || !weeklyDocId) process.exit(0);

fs.writeFileSync(
  statePath,
  [
    `export FEISHU_DAILY_DOC_ID='${String(dailyDocId).replace(/'/g, `'\\''`)}'`,
    `export FEISHU_WEEKLY_DOC_ID='${String(weeklyDocId).replace(/'/g, `'\\''`)}'`,
    "",
  ].join("\n"),
  { mode: 0o600 },
);
NODE
