# dontpastetheai.com / dontquotetheai.com

![](./assets/og-image.png)

> A website you send to that one person who answers every question with eight hundred words of ChatGPT they clearly didn't read.

You know... That one.

> **This is satire.** Nobody is being attacked, nobody is being cancelled, nobody hates AI, have some humor. Use the tools. Just, you know, read them first.

Spiritual cousin of [nohello.net](https://nohello.net) and [dontasktoask.com](https://dontasktoask.com). Static HTML, like the aztecs used to do back in the day. PRs welcome — especially translations.

## Translations

> **Don't see your language?** Translations are how this page actually helps people. The whole process is in [TRANSLATING.md](TRANSLATING.md) — you don't need to touch hreflang or render PNGs, CI handles both. Just translate the text and open a PR.

| Language | Smooth | Angry | OG image | Maintainer |
|----------|--------|-------|----------|-----------|
| English (`en`) | ✅ [index.html](index.html) | ✅ [angry/](angry/) | ✅ | — |
| Українська (`uk`) | ✅ [uk.html](uk.html) | ✅ [angry/uk.html](angry/uk.html) | ✅ | [@webknjaz] |
| Português (BR) (`pt-br`) | ✅ [pt-br.html](pt-br.html) | ✅ [angry/pt-br.html](angry/pt-br.html) | ✅ | — |
| Русский (`ru`) | ✅ [ru.html](ru.html) | ✅ [angry/ru.html](angry/ru.html) | ✅ | — |
| 繁體中文 (`zh-tw`) | ✅ [zh-tw.html](zh-tw.html) | ✅ [angry/zh-tw.html](angry/zh-tw.html) | ✅ | — |
| 简体中文 (`zh-cn`) | ✅ [zh-cn.html](zh-cn.html) | ✅ [angry/zh-cn.html](angry/zh-cn.html) | ✅ | — |
| Italiano (`it`) | ✅ [it.html](it.html) | ✅ [angry/it.html](angry/it.html) | ✅ | — |

[@webknjaz]: https://github.com/sponsors/webknjaz

Want to suggest a language? Open an issue or just send the PR — even a half-finished one. We can iterate.

## Two versions

The site comes in two flavors. Pick whichever one fits:

- **Smooth version** (`/`) — friendly, work-safe, nohello.net-ish. Safe to send to a coworker, a manager, or basically anyone you don't want to surprise with feelings.
- **Angry version** (`/angry/`) — the original, but angrier. Send to people who can handle a joke at volume. Not safe for your manager. Probably.

They cross-link to each other (red button on smooth → angry, green button on angry → smooth). Each has its own translations at the same path:

```
/                  → smooth EN
/pt-br.html        → smooth PT-BR
/angry/            → angry EN
/angry/pt-br.html  → angry PT-BR
```

CSS and assets live at the root (`/styles.css`, `/assets/`). Angry pages reference them with `../`.

## How it works

Static HTML. No build step. A few things worth knowing:

- `assets/translations.json` is the single source of truth for languages. The language dropdown is built at runtime by `assets/translations.js` from it (each HTML file ships a single matching `<option>` as a no-JS fallback). The same script also rewrites the smooth↔angry cross-link `href` on any element marked `data-variant-toggle`, so translated files don't have to hardcode their counterpart's path. A GitHub Action on push to main runs `scripts/sync-hreflang.mjs` (regenerates the `<link rel="alternate" hreflang>` block between the `<!-- hreflang:start -->` / `<!-- hreflang:end -->` markers in every HTML file) and `scripts/build-og-images.mjs` (renders any missing PNGs from their SVG sources), then commits the result back — which triggers Cloudflare to redeploy. Translators just translate; CI keeps the cross-references consistent.
- Cloudflare Workers Assets serves `.html` files at clean URLs (`/it` resolves to `it.html`). `assets/translations.js` normalizes the last path segment so the dropdown still highlights the current page when the extension is missing.
- `<link rel="alternate" hreflang="...">` tags stay **static** in each `<head>` on purpose — Googlebot renders JS but Bing / Yandex / Baidu are flaky about it, and we'd rather not gamble on SEO.
- The copy button reads `location.hostname` so the same code works on both domains (dontpastetheai.com or dontquotetheai.com) — it copies whichever one the visitor landed on. The inline `<script>` that used to live in every HTML file got deduped into `assets/copy.js`; translatable strings come from `data-copy-aria` and `data-copied-text` attributes on the button itself.

## CI

Two GitHub Actions workflows in `.github/workflows/`:

- **`validate.yml`** — runs on every PR and on push to `main`. Executes `scripts/check-translations.mjs` (blocking) to verify each language registered in `assets/translations.json` has its smooth + angry files, correct canonical/og:url, and an OG SVG. It also runs `scripts/sync-hreflang.mjs --check` and `scripts/build-og-images.mjs --check` as **informational** steps (`continue-on-error: true`) — drift there is reported but doesn't block merge, because the sync workflow fixes it on push.
- **`sync.yml`** — runs on push to `main` (skipped when the commit message contains `[skip ci]`, so it doesn't recurse on its own commits). Installs `librsvg2-bin` plus Latin and CJK fonts, then:
  1. `scripts/sync-hreflang.mjs` regenerates the `<link rel="alternate" hreflang>` block between the `<!-- hreflang:start -->` / `<!-- hreflang:end -->` markers in every HTML file from `assets/translations.json`.
  2. `scripts/build-og-images.mjs` renders any missing/stale `assets/og-image-<code>.png` at 1200×630 via `rsvg-convert` from their SVG sources.
  3. If anything changed, it commits as `github-actions[bot]` with `chore: sync hreflang + og images [skip ci]` and pushes back to `main`. The push triggers Cloudflare to redeploy; the `[skip ci]` marker prevents the workflow from re-firing on its own commit.

Net effect: translators only edit visible text + `assets/translations.json` + the OG SVG. Everything cross-file (hreflang, PNG renders) is generated by CI.

## Local dev

No build step. Open `index.html` in a browser, or run `python3 -m http.server` from the repo root if you want a local server. Angry pages are at `/angry/index.html` and friends.

## Deploy

Cloudflare Workers Assets via `wrangler.jsonc`. Pushes to `main` go live automatically. Served at both `dontpastetheai.com` (canonical) and `dontquotetheai.com` (redirect/mirror) — the copy button shows whichever domain the visitor is on.

## Contributing translations

See [TRANSLATING.md](TRANSLATING.md). The GitHub Action validates PRs and tells you exactly what's missing, so don't overthink it.

## License

See `LICENSE`. Free to share, remix, translate.
