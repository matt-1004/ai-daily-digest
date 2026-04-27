# AI Daily Digest

Trust-aware AI briefing pipeline for two outputs:

- `AI 日报`: only verified, high-signal updates
- `AI 周报`: verified news plus deeper analysis and watchlist items

## What It Does

- collects from official sites, GitHub releases, arXiv, YouTube, X watchlist accounts, and selected independent blogs
- classifies sources by trust tier
- verifies whether an item can enter daily or weekly output
- deduplicates around canonical URLs and original sources
- applies editorial ranking so low-signal but true items do not dominate the briefing
- renders briefing-style markdown
- can publish the daily and weekly briefings to Feishu cloud docs

## Structure

```text
src/
  core/
  integrations/
  reporting/
  sources/
  types/
scripts/
tests/
docs/
```

## 会话总结图

这张中文图展示当前的信息源工作流、飞书机器人隔离、定时自动化和 GitHub 发布状态：

- [二零二六年四月二十五日会话成果总览](docs/session-summary-2026-04-25.svg)

## Requirements

- `bun`
- `lark-cli` for Feishu publishing
- Chrome remote debugging for YouTube/X sources, through the local Codex web-access CDP proxy

## Run

```bash
bun test
```

Check every configured source with real requests:

```bash
bun run sources:check
```

YouTube and X use the user's logged-in Chrome session through `http://localhost:3456`. Run the Codex web-access dependency check first if the proxy is not already ready:

```bash
node /Users/yongku/.agents/skills/web-access/scripts/check-deps.mjs
```

Generate and publish Feishu docs:

```bash
FEISHU_APP_ID=... \
FEISHU_APP_SECRET=... \
FEISHU_DAILY_DOC_ID=... \
FEISHU_WEEKLY_DOC_ID=... \
bun run scripts/publish-briefings.ts
```

If `FEISHU_DAILY_DOC_ID` and `FEISHU_WEEKLY_DOC_ID` are omitted, the script creates new docs. If they are provided, it overwrites the existing docs.

Run with the local Codex/Lark wrapper:

```bash
bun run publish:codex
```

The wrapper is intended for local scheduled execution. It:

- publishes from the current local checkout
- uses the `content-collector-bot` lark-cli profile and refuses accidental profile changes
- stores created Feishu document targets in `.codex-state/ai-daily-digest/doc-targets.env`
- overwrites the same daily and weekly documents on later runs

If the legacy target file exists at `~/.codex/ai-daily-digest/doc-targets.env`, the wrapper migrates it into the repo-local state directory on first run. Git sync is skipped by default so a stale local proxy or GitHub outage cannot block publishing; set `AI_DAILY_DIGEST_GIT_SYNC=1` only when you explicitly want a best-effort pull/fetch before publishing.

The Feishu publish mechanism is `lark-cli docs +update --profile content-collector-bot --as bot`, so scheduled runs update the existing docs as that bot instead of sending IM messages. The wrapper also verifies that `content-collector-bot` points to app ID `cli_a92fdd8840f99bc9`.

Publishing is intentionally locked to that bot. If `LARK_PROFILE` points to another profile, or direct `FEISHU_APP_ID` credentials point to another app, the publisher exits before touching any Feishu document.

After a successful publish, the wrapper sends a direct Feishu notice with the daily and weekly document URLs and item counts. The default target is the owner direct chat configured in the wrapper. Override with `AI_DAILY_DIGEST_NOTICE_CHAT_ID` or `AI_DAILY_DIGEST_NOTICE_USER_ID`; set `AI_DAILY_DIGEST_DISABLE_SUCCESS_NOTICE=1` only for intentional local debugging.

Run the publisher smoke inspection:

```bash
bun run smoke:publisher
```

The smoke check verifies shell syntax, the local state directory, required tools, the pinned Feishu profile, Feishu CLI connectivity, a document-create dry run, unit tests, source adapters, and briefing generation without publishing the daily or weekly docs.

If the scheduled wrapper cannot run, it sends a Feishu direct alert through `content-collector-bot`. By default the alert goes to the configured owner open_id in the wrapper. To override the target locally, set `AI_DAILY_DIGEST_ALERT_USER_ID` or `AI_DAILY_DIGEST_ALERT_CHAT_ID`; set `AI_DAILY_DIGEST_DISABLE_ALERT=1` only for intentional local debugging.

## Notes

- Secrets are read from environment variables and should not be committed.
- `.lark-cli-app/` is local-only runtime config and is ignored by git.
- The current source catalog favors trust and signal over raw volume.
- Media, podcast, Hugging Face RSS, Google DeepMind blog, and Gwern sources are intentionally excluded until they are reliable enough for scheduled runs.

## Business Structure

This repository is part of the Matt Operating System / Jiheniao Business OS map.

- [Business structure](docs/business-structure.md)
- [Data contract](docs/data-contract.md)
