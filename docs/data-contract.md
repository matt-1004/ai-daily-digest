# Data Contract

## Reads

- official AI/product sites
- GitHub releases
- arXiv
- YouTube/X/blog sources through configured adapters

## Writes

- rendered markdown briefings
- Feishu cloud docs when publishing
- local scheduled-run state under ~/.codex/ai-daily-digest

## Fact Owner

AI source catalog and briefing output contract

## Data Rules

- Raw private data, credentials, cookies, tokens, and local databases must be ignored by git.
- External writes must be domain-specific and use the configured bot/profile for this repository.
- Downstream summaries should store references or derived summaries, not duplicate raw facts unless explicitly documented.
- If the contract changes, update README, CHANGELOG, and the Matt Operating System control-plane docs.
