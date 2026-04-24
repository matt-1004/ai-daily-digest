# AI Daily Digest

Trust-aware AI briefing pipeline for two outputs:

- `AI 日报`: only verified, high-signal updates
- `AI 周报`: verified news plus deeper analysis and watchlist items

## What It Does

- collects from official sites, GitHub releases, papers, media, podcasts, and blog sources
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

## Run

```bash
bun test
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
- uses the `content-collector-bot` lark-cli profile by default
- stores created Feishu document targets in `~/.codex/ai-daily-digest/doc-targets.env`
- overwrites the same daily and weekly documents on later runs

Set `LARK_PROFILE=...` to use a different lark-cli profile.

## Notes

- Secrets are read from environment variables and should not be committed.
- `.lark-cli-app/` is local-only runtime config and is ignored by git.
- The current source catalog favors trust and signal over raw volume.
