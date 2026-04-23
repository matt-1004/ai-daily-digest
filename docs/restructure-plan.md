# AI Daily Digest Restructure Plan

## Goal

Turn the current single-script "HN blog digest" into a trust-aware briefing system with two outputs:

- `Daily briefing`: verified, high-signal items that can be cited as factual updates.
- `Weekly deep digest`: verified news plus high-value analysis from blogs, podcasts, and videos.

## Problems In The Current Shape

- Sources are mostly personal blogs, not primary announcement channels.
- RSS `title + description` is used as the main input for scoring and summarization.
- There is no explicit trust model.
- There is no verification gate for daily output.
- There is no cross-source deduplication around `originalUrl` / canonical URL.
- Daily and weekly outputs share the same selection logic even though they should have different evidence bars.

## Target Pipeline

1. Fetch from source adapters.
2. Normalize each item into a shared `CandidateItem`.
3. Assign source policy from a trust model.
4. Verify each item using original URLs and corroborating sources.
5. Deduplicate around canonical URLs and original sources.
6. Select for `daily` and `weekly` using different thresholds.
7. Render reports and watchlists separately.

## Proposed Structure

```text
src/
  core/
    trust.ts
    verification.ts
    dedup.ts
    selection.ts
  reporting/
    daily.ts
    weekly.ts
    watchlist.ts
  sources/
    official.ts
    github.ts
    papers.ts
    media.ts
    podcasts.ts
    youtube.ts
    social.ts
    blogs.ts
  types/
    content.ts
tests/
  fixtures/
    candidates.ts
  trust.test.ts
  verification.test.ts
  dedup.test.ts
  selection.test.ts
```

## Trust Model

### Primary

- Official sites and blogs
- GitHub releases
- Research papers
- Regulators and standards bodies

These can go straight into the daily briefing when the item itself is the original source.

### Secondary

- Major media

These can enter the daily briefing only when they point back to the original source or when multiple independent outlets corroborate the same underlying event.

### Analysis

- Podcasts
- YouTube
- Independent blogs

These are valid for the weekly digest, but not as direct daily facts unless tied back to an original source.

### Discovery

- X
- Community threads

These are lead sources only. They should not be promoted directly into the daily briefing.

## Output Rules

### Daily

- Include only verified items.
- Prefer primary sources.
- Allow secondary sources only if traceable to the original source.
- Exclude podcasts, YouTube, X, and community items from lead slots.

### Weekly

- Include verified news.
- Add deep dives from blogs, podcasts, and YouTube.
- Keep low-confidence discovery items in a separate watchlist or reject them entirely.

## Test-First Scope

The first test pass covers:

- source policy and trust ranking
- verification gating
- deduplication around canonical and original URLs
- daily vs weekly selection behavior

The implementation can then fill in the behavior without changing the test contract.
