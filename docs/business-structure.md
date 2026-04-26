# Business Structure

## Domain

AI knowledge briefing

## Role

Trust-aware AI daily/weekly briefing publisher for Matt.

## Fact Ownership

AI source catalog and briefing output contract

## Upstream

- public trusted sources
- local Chrome/CDP session for browser-bound sources

## Downstream

- Matt daily/weekly AI briefing documents

## Boundary Rules

- This repository owns its stated domain and should not become a general-purpose automation bucket.
- Secrets and local runtime data must stay out of git.
- Cross-domain outputs should reference the owning repository instead of copying raw facts into a second long-term store.
- Production schedules and health checks should be indexed from `jiheniao-ops` or the Matt Operating System control plane.
