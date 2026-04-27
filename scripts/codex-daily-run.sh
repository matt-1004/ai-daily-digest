#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LEGACY_STATE_DIR="${HOME}/.codex/ai-daily-digest"
STATE_DIR="${AI_DAILY_DIGEST_STATE_DIR:-${REPO_DIR}/.codex-state/ai-daily-digest}"
STATE_FILE="${STATE_DIR}/doc-targets.env"
LEGACY_STATE_FILE="${LEGACY_STATE_DIR}/doc-targets.env"
EXPECTED_LARK_PROFILE="content-collector-bot"
EXPECTED_LARK_APP_ID="cli_a92fdd8840f99bc9"
DEFAULT_TARGET_CHAT_ID="oc_96d31442a4869434727e586a8ecfcad2"
FAILED_LINE="unknown"
FAILED_COMMAND="unknown"
CLEANUP_DIR=""

send_failure_alert() {
  local exit_code="$1"
  local line="$2"
  local command="$3"
  local alert_user_id="${AI_DAILY_DIGEST_ALERT_USER_ID:-}"
  local alert_chat_id="${AI_DAILY_DIGEST_ALERT_CHAT_ID:-${AI_DAILY_DIGEST_TARGET_CHAT_ID:-${DEFAULT_TARGET_CHAT_ID}}}"
  local now
  local target_args=()

  if [[ "${AI_DAILY_DIGEST_DISABLE_ALERT:-}" == "1" ]]; then
    return 0
  fi

  if ! command -v lark-cli >/dev/null 2>&1; then
    echo "Cannot send failure alert: lark-cli is not installed or not on PATH." >&2
    return 0
  fi

  if [[ -n "${alert_chat_id}" ]]; then
    target_args=(--chat-id "${alert_chat_id}")
  elif [[ -n "${alert_user_id}" ]]; then
    target_args=(--user-id "${alert_user_id}")
  else
    echo "Cannot send failure alert: set AI_DAILY_DIGEST_ALERT_USER_ID or AI_DAILY_DIGEST_ALERT_CHAT_ID." >&2
    return 0
  fi

  now="$(TZ=Asia/Shanghai date '+%Y-%m-%d %H:%M:%S %Z')"
  local message=$'AI Daily Digest cannot run\n\nTime: '"${now}"$'\nRepo: '"${REPO_DIR}"$'\nExit code: '"${exit_code}"$'\nLine: '"${line}"$'\nCommand: '"${command}"$'\n\nRun `bun run smoke:publisher` in the repo to inspect dependencies, state path, Feishu profile, source checks, and briefing generation.'

  if [[ "${AI_DAILY_DIGEST_ALERT_DRY_RUN:-}" == "1" ]]; then
    printf '%s\n' "${message}" >&2
    return 0
  fi

  lark-cli im +messages-send \
    --profile "${EXPECTED_LARK_PROFILE}" \
    --as bot \
    "${target_args[@]}" \
    --text "${message}" \
    --idempotency-key "ai-daily-digest-cannot-run-$(TZ=Asia/Shanghai date '+%Y%m%d%H%M')" \
    >/dev/null && echo "Sent AI Daily Digest failure alert." >&2 || echo "Failed to send AI Daily Digest failure alert." >&2
}

send_success_notice() {
  local today="$1"
  local daily_doc_id="$2"
  local weekly_doc_id="$3"
  local canonical_items="$4"
  local daily_items="$5"
  local weekly_news="$6"
  local weekly_deep_dives="$7"
  local notice_chat_id="${AI_DAILY_DIGEST_NOTICE_CHAT_ID:-${AI_DAILY_DIGEST_TARGET_CHAT_ID:-${DEFAULT_TARGET_CHAT_ID}}}"
  local notice_user_id="${AI_DAILY_DIGEST_NOTICE_USER_ID:-}"
  local target_args=()

  if [[ "${AI_DAILY_DIGEST_DISABLE_SUCCESS_NOTICE:-}" == "1" ]]; then
    return 0
  fi

  if ! command -v lark-cli >/dev/null 2>&1; then
    echo "Cannot send success notice: lark-cli is not installed or not on PATH." >&2
    return 0
  fi

  if [[ -n "${notice_chat_id}" ]]; then
    target_args=(--chat-id "${notice_chat_id}")
  elif [[ -n "${notice_user_id}" ]]; then
    target_args=(--user-id "${notice_user_id}")
  else
    echo "Cannot send success notice: set AI_DAILY_DIGEST_NOTICE_CHAT_ID or AI_DAILY_DIGEST_NOTICE_USER_ID." >&2
    return 0
  fi

  lark-cli im +messages-send \
    --profile "${EXPECTED_LARK_PROFILE}" \
    --as bot \
    "${target_args[@]}" \
    --text $'AI Daily Digest '"${today}"$' 已发布\n\n日报：https://www.feishu.cn/docx/'"${daily_doc_id}"$'\n周报：https://www.feishu.cn/docx/'"${weekly_doc_id}"$'\n\n本次生成：canonical '"${canonical_items}"$'，日报 '"${daily_items}"$'，周报新闻 '"${weekly_news}"$'，周报深度 '"${weekly_deep_dives}"$'。' \
    --idempotency-key "ai-daily-digest-${today}-success-notice" \
    >/dev/null && echo "Sent AI Daily Digest success notice." >&2 || echo "Failed to send AI Daily Digest success notice." >&2
}

send_daily_image() {
  local today="$1"
  local image_file="$2"
  local notice_chat_id="${AI_DAILY_DIGEST_NOTICE_CHAT_ID:-${AI_DAILY_DIGEST_TARGET_CHAT_ID:-${DEFAULT_TARGET_CHAT_ID}}}"
  local notice_user_id="${AI_DAILY_DIGEST_NOTICE_USER_ID:-}"
  local target_args=()
  local upload_output
  local image_key
  local image_content

  if [[ "${AI_DAILY_DIGEST_DISABLE_IMAGE_NOTICE:-}" == "1" ]]; then
    return 0
  fi

  if [[ ! -f "${image_file}" ]]; then
    fail "$LINENO" "test -f daily image" "Missing generated daily image: ${image_file}"
  fi

  if [[ -n "${notice_chat_id}" ]]; then
    target_args=(--chat-id "${notice_chat_id}")
  elif [[ -n "${notice_user_id}" ]]; then
    target_args=(--user-id "${notice_user_id}")
  else
    echo "Cannot send daily image: set AI_DAILY_DIGEST_NOTICE_CHAT_ID or AI_DAILY_DIGEST_NOTICE_USER_ID." >&2
    return 0
  fi

  upload_output="$(lark-cli im images create \
    --profile "${EXPECTED_LARK_PROFILE}" \
    --as bot \
    --data '{"image_type":"message"}' \
    --file "image=${image_file}")" || fail "$LINENO" "upload daily image" "Failed to upload AI Daily Digest daily image."

  image_key="$(node -e 'const fs = require("node:fs"); const parsed = JSON.parse(fs.readFileSync(0, "utf8")); process.stdout.write(parsed?.data?.image_key || "");' <<<"${upload_output}")"
  if [[ -z "${image_key}" ]]; then
    fail "$LINENO" "parse uploaded image key" "Failed to parse uploaded AI Daily Digest daily image key."
  fi

  image_content="$(node -e 'process.stdout.write(JSON.stringify({ image_key: process.argv[1] }));' "${image_key}")"

  lark-cli im +messages-send \
    --profile "${EXPECTED_LARK_PROFILE}" \
    --as bot \
    "${target_args[@]}" \
    --msg-type image \
    --content "${image_content}" \
    --idempotency-key "ai-daily-digest-${today}-daily-image" \
    >/dev/null && echo "Sent AI Daily Digest daily image." >&2 || fail "$LINENO" "send daily image" "Failed to send AI Daily Digest daily image."
}

fail() {
  local line="$1"
  local command="$2"
  local message="$3"
  FAILED_LINE="${line}"
  FAILED_COMMAND="${command}"
  echo "${message}" >&2
  exit 1
}

on_error() {
  FAILED_LINE="${1:-unknown}"
  FAILED_COMMAND="${2:-unknown}"
}

on_exit() {
  local exit_code="$?"
  trap - ERR EXIT

  if [[ -n "${CLEANUP_DIR}" ]]; then
    rm -rf "${CLEANUP_DIR}"
  fi

  if [[ "${exit_code}" -ne 0 ]]; then
    send_failure_alert "${exit_code}" "${FAILED_LINE}" "${FAILED_COMMAND}"
  fi
}

trap 'on_error "$LINENO" "$BASH_COMMAND"' ERR
trap 'on_exit' EXIT

if [[ -n "${LARK_PROFILE:-}" && "${LARK_PROFILE}" != "${EXPECTED_LARK_PROFILE}" ]]; then
  fail "$LINENO" "validate LARK_PROFILE" "Refusing to publish with LARK_PROFILE=${LARK_PROFILE}. Expected ${EXPECTED_LARK_PROFILE}."
fi

LARK_PROFILE="${EXPECTED_LARK_PROFILE}"
export LARK_PROFILE

mkdir -p "${STATE_DIR}"
chmod 700 "${STATE_DIR}"

if [[ ! -f "${STATE_FILE}" && -f "${LEGACY_STATE_FILE}" ]]; then
  cp "${LEGACY_STATE_FILE}" "${STATE_FILE}"
  chmod 600 "${STATE_FILE}"
fi

export PATH="${HOME}/.bun/bin:/opt/homebrew/bin:/usr/local/bin:${PATH}"

if ! command -v bun >/dev/null 2>&1; then
  fail "$LINENO" "command -v bun" "bun is not installed. Install it first: curl -fsSL https://bun.sh/install | bash"
fi

if ! command -v lark-cli >/dev/null 2>&1; then
  fail "$LINENO" "command -v lark-cli" "lark-cli is not installed or not on PATH."
fi

if [[ ! -f "${HOME}/.lark-cli/config.json" ]]; then
  fail "$LINENO" "test -f ${HOME}/.lark-cli/config.json" "Missing ${HOME}/.lark-cli/config.json. Run lark-cli config init first."
fi

node - "${HOME}/.lark-cli/config.json" "${EXPECTED_LARK_PROFILE}" "${EXPECTED_LARK_APP_ID}" <<'NODE'
const fs = require("node:fs");
const [configPath, expectedProfile, expectedAppId] = process.argv.slice(2);
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const app = (config.apps || []).find((item) => item.name === expectedProfile || item.appName === expectedProfile);

if (!app) {
  console.error(`Missing required lark-cli profile: ${expectedProfile}`);
  process.exit(1);
}

if (app.appId !== expectedAppId) {
  console.error(`Refusing to publish: ${expectedProfile} points to ${app.appId}, expected ${expectedAppId}.`);
  process.exit(1);
}
NODE

if [[ -f "${STATE_FILE}" ]]; then
  # shellcheck disable=SC1090
  source "${STATE_FILE}"
fi

cd "${REPO_DIR}"

if [[ "${AI_DAILY_DIGEST_GIT_SYNC:-}" == "1" ]] && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  UPSTREAM_BRANCH="$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || true)"
  if [[ -n "${UPSTREAM_BRANCH}" ]]; then
    if ! GIT_TERMINAL_PROMPT=0 git -c http.proxy= -c https.proxy= pull --ff-only; then
      echo "Warning: git pull failed; continuing with local checkout." >&2
    fi
  else
    if ! GIT_TERMINAL_PROMPT=0 git -c http.proxy= -c https.proxy= fetch origin main; then
      echo "Warning: git fetch failed; continuing with local checkout." >&2
    fi
  fi
fi

WORK_DIR="$(mktemp -d)"
CLEANUP_DIR="${WORK_DIR}"

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

bun run scripts/render-daily-card.ts \
  "${WORK_DIR}/daily.md" \
  "${WORK_DIR}/meta.json" \
  "${WORK_DIR}/daily-card.svg" \
  "${WORK_DIR}/daily-card.png"

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

# shellcheck disable=SC1090
source "${STATE_FILE}"

node - "${WORK_DIR}/meta.json" "${FEISHU_DAILY_DOC_ID}" "${FEISHU_WEEKLY_DOC_ID}" <<'NODE' | while IFS=$'\t' read -r today canonical_items daily_items weekly_news weekly_deep_dives daily_doc_id weekly_doc_id; do
const fs = require("node:fs");
const [metaPath, dailyDocId, weeklyDocId] = process.argv.slice(2);
const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
console.log([
  meta.today,
  meta.counts.canonicalItems,
  meta.counts.dailyItems,
  meta.counts.weeklyNews,
  meta.counts.weeklyDeepDives,
  dailyDocId,
  weeklyDocId,
].join("\t"));
NODE
  send_success_notice \
    "${today}" \
    "${daily_doc_id}" \
    "${weekly_doc_id}" \
    "${canonical_items}" \
    "${daily_items}" \
    "${weekly_news}" \
    "${weekly_deep_dives}"
  send_daily_image \
    "${today}" \
    "${WORK_DIR}/daily-card.png"
done
