# CHANGELOG

## V1.3.0 — 2026-07-19 16:39 Asia/Ho_Chi_Minh

- Fixed iOS PWA navigation caching by removing all navigation response writes and adding `offline.html` as the only navigation fallback.
- Updated Service Worker cache to `zhuyin-bee-v1-3-0` and added a user-triggered update prompt.
- Rebuilt spelling mode with clear word/target/instruction layout, option IDs, beginner first-symbol mode, and advanced full-zhuyin mode.
- Added dedicated zhuyin answer syllable and single-symbol styling.
- Enlarged home cards, child cards, Han characters, zhuyin, controls, and small-screen layouts.
- Split button speech behavior so content playback buttons do not announce their labels and parent mode stays silent.
- Added parent dictionary management stats, search, manual add forms, import-review placeholders, data checks, export, and cache repair.
- Added Cloudflare D1 schema migration, Worker API skeleton, `DATABASE.md`, and `API.md`.
- Added original child themes for Lisa, Jack, and Kyky without official character assets.

## PR #7 — Merged 2026-07-19T09:11:19Z

- PR: #7
- Status: Merged
- Title: feat: V1.2.0 — add child profiles, system TTS, vertical zhuyin layout and expanded data
- Head: codex/v1.2.0
- Base: main
- Code commit: 4fe1e128980981b4b11ef33953a37859043be6e9
- Merge commit: f0f824ed99c87735a8affc5d42b957b3e8f41d23
- GitHub Actions: Validate PWA, Workflow Run #20, success

## V1.2.0 — 2026-07-19 16:00 Asia/Ho_Chi_Minh

- Added child profiles, system TTS, zhuyin learning mode, vertical zhuyin layout, expanded JSON data, and initial Service Worker redirect safeguards.
