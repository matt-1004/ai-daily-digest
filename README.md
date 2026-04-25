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

- fast-forwards the checked out upstream branch before publishing
- uses the `content-collector-bot` lark-cli profile and refuses accidental profile changes
- stores created Feishu document targets in `~/.codex/ai-daily-digest/doc-targets.env`
- overwrites the same daily and weekly documents on later runs

The Feishu publish mechanism is `lark-cli docs +update --profile content-collector-bot --as bot`, so scheduled runs update the existing docs as that bot instead of sending IM messages. The wrapper also verifies that `content-collector-bot` points to app ID `cli_a92fdd8840f99bc9`.

Publishing is intentionally locked to that bot. If `LARK_PROFILE` points to another profile, or direct `FEISHU_APP_ID` credentials point to another app, the publisher exits before touching any Feishu document.

## Notes

- Secrets are read from environment variables and should not be committed.
- `.lark-cli-app/` is local-only runtime config and is ignored by git.
- The current source catalog favors trust and signal over raw volume.
- Media, podcast, Hugging Face RSS, Google DeepMind blog, and Gwern sources are intentionally excluded until they are reliable enough for scheduled runs.
