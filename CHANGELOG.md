# Changelog

## Unreleased

- Document business structure and data contract for the Matt Operating System map.
- Send a Feishu success notice with daily and weekly document links after scheduled publishing completes.
- Add a Chinese infographic for the 2026-04-27 scheduled publisher recovery.

## 0.2.5 - 2026-04-27

- Move scheduled publisher state into an ignored repo-local directory while migrating existing Feishu doc targets.
- Skip Git sync by default so a stale local proxy or GitHub network failure does not block publishing; set `AI_DAILY_DIGEST_GIT_SYNC=1` to opt into best-effort sync.
- Preserve the failure-alert exit handler after temporary workspace creation.
- Keep the scheduled automation on the real repository checkout only, avoiding duplicate runs from the state directory.

## 0.2.4 - 2026-04-26

- Add a publisher smoke inspection script for local scheduled-run readiness checks.
- Send a Feishu cannot-run alert when the scheduled wrapper exits before publishing.
- Document the smoke inspection and alert override environment variables.

## 0.2.3 - 2026-04-25

- 新增中文视觉总结图，说明人工智能日报的信息源工作流、飞书机器人边界、自动化和 GitHub 发布状态。
- 在 README 中链接总结图，方便协作者快速理解当前系统。

## 0.2.2 - 2026-04-25

- Lock Feishu publishing to the `content-collector-bot` app ID `cli_a92fdd8840f99bc9`.
- Reject both lark-cli profile drift and direct `FEISHU_APP_ID` publishing with any other bot.
- Remove the one-off profile override path so the digest cannot accidentally publish through another bot.

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
