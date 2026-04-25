# Changelog

## 0.2.1 - 2026-04-25

- Pin the scheduled Feishu publisher to the `content-collector-bot` lark-cli profile.
- Refuse accidental bot/profile changes unless `ALLOW_LARK_PROFILE_OVERRIDE=1` is set explicitly.

## 0.2.0 - 2026-04-25

- Add runnable source health checks with per-source progress and timeout handling.
- Add real adapters for GitHub releases, arXiv recent listings, YouTube channels, and X accounts.
- Use the local Chrome/CDP session for YouTube and X so logged-in sources can be collected without storing cookies in git.
- Restrict the scheduled catalog to sources that passed real collection checks.
- Document source verification and Chrome/CDP requirements.

## 0.1.1 - 2026-04-24

- Add a local Codex/Lark wrapper for scheduled Feishu publishing.
- Persist Feishu daily and weekly document targets locally so repeated runs overwrite the same docs.
- Add a `publish:codex` script for the local automation entrypoint.
