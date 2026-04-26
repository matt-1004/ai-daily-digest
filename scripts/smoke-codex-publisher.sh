#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATE_DIR="${HOME}/.codex/ai-daily-digest"
EXPECTED_LARK_PROFILE="content-collector-bot"
EXPECTED_LARK_APP_ID="cli_a92fdd8840f99bc9"

cd "${REPO_DIR}"

echo "checking shell syntax"
bash -n ./scripts/codex-daily-run.sh
bash -n ./scripts/smoke-codex-publisher.sh

echo "checking state directory"
mkdir -p "${STATE_DIR}"
chmod 700 "${STATE_DIR}"
test -w "${STATE_DIR}"
touch "${STATE_DIR}/.smoke-write"
rm -f "${STATE_DIR}/.smoke-write"

echo "checking local dependencies"
command -v bun >/dev/null
bun --version
command -v lark-cli >/dev/null
lark-cli --version

echo "checking Feishu publisher profile"
test -f "${HOME}/.lark-cli/config.json"
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
  console.error(`Profile ${expectedProfile} points to ${app.appId}, expected ${expectedAppId}.`);
  process.exit(1);
}

console.log(`profile ${expectedProfile} -> ${app.appId}`);
NODE

echo "checking Feishu connectivity"
lark-cli doctor --profile "${EXPECTED_LARK_PROFILE}"

echo "checking Feishu document dry run"
WORK_DIR="$(mktemp -d)"
trap 'rm -rf "${WORK_DIR}"' EXIT
printf '# AI Daily Digest smoke\n' > "${WORK_DIR}/smoke.md"
(
  cd "${WORK_DIR}"
  lark-cli docs +create \
    --profile "${EXPECTED_LARK_PROFILE}" \
    --as bot \
    --title "AI Daily Digest Smoke Test" \
    --markdown "@smoke.md" \
    --dry-run
)

echo "running unit tests"
bun test

echo "checking source adapters"
bun run sources:check

echo "checking briefing generation"
bun --eval '
  import { formatShanghaiDate, generateCurrentBriefings } from "./src/index.ts";

  const briefings = await generateCurrentBriefings();
  console.log(JSON.stringify({
    today: formatShanghaiDate(),
    canonicalItems: briefings.canonicalItems.length,
    dailyItems: briefings.dailySelection.leadItems.length,
    weeklyNews: briefings.weeklySelection.verifiedNews.length,
    weeklyDeepDives: briefings.weeklySelection.deepDives.length,
    dailyReportChars: briefings.dailyReport.length,
    weeklyReportChars: briefings.weeklyReport.length,
  }, null, 2));
'

echo "publisher smoke check passed"
