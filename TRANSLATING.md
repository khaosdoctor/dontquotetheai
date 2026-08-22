# Translating dontpastetheai

Hi! Thanks for picking up a translation. This page works because someone took an afternoon to make it speak their language. Here's how to do that, with as little friction as possible.

If you get stuck, open a PR anyway — even half-finished. We'll help you across the finish line.

## TL;DR

1. Pick a [BCP 47 language code](https://en.wikipedia.org/wiki/IETF_language_tag), lowercase, hyphenated (e.g. `es`, `pt-br`, `zh-tw`).
2. Copy `index.html` → `<code>.html` and `angry/index.html` → `angry/<code>.html`. Translate the visible text in both.
3. Register your language in `assets/translations.json` — CI handles the hreflang links across all pages.
4. Make an OG image SVG (CI renders the PNG for you). Then open a PR.

The [GitHub Action](.github/workflows/validate.yml) runs on your PR and tells you what's missing. You can run it locally first: `node scripts/check-translations.mjs`.

---

## Step by step

Each language is one HTML file per version. You need to translate **both** smooth and angry — they're separate, with different tones, not one document.

### 1. Pick a code

Use [BCP 47](https://en.wikipedia.org/wiki/IETF_language_tag), lowercase, hyphenated. The filename matches the code:

- Spanish → `es.html`
- Brazilian Portuguese → `pt-br.html`
- Traditional Chinese (Taiwan) → `zh-tw.html`

Not `pt_BR`, not `ptBR`, not `ptbr` — `pt-br`.

### 2. Copy the files

Smooth and angry **share filenames** at different paths:

```
index.html         →  <code>.html         (smooth)
angry/index.html   →  angry/<code>.html   (angry)
```

So for Spanish: `es.html` and `angry/es.html`.

### 3. Translate the visible text

In each of your two new files, translate:

- `<title>` and the `<meta name="description">` tag
- `og:title`, `og:description`
- `<html lang="...">` attribute (set it to your language)
- Everything visible inside `<header>`, `<section>`, `<blockquote>`, `<ol>`, `.shout`, `.signature`, `.footer`
- The language `<select>` `aria-label`
- The cross-link button text (red `.cta-angry` on smooth, green `.cta-calm` on angry). Keep the `data-variant-toggle` attribute and the static `href` as-is — `assets/translations.js` rewrites the `href` at runtime to point at the matching counterpart file, so you only translate the visible label.
- `og:url` and `<link rel="canonical">` should point at your file:
  - smooth: `https://dontpastetheai.com/<code>.html`
  - angry: `https://dontpastetheai.com/angry/<code>.html`
- The copy button — translate the two data attributes, not the visible text:

  ```html
  <button id="copyBtn" type="button" class="url-tag-big"
      data-copy-aria="Copy {domain} to clipboard"
      data-copied-text="copied!">dontpastetheai.com</button>
  ```

  Translate `data-copy-aria` (keep the `{domain}` placeholder — `assets/copy.js` substitutes the actual hostname) and `data-copied-text` (the post-click feedback). The visible `dontpastetheai.com` text stays — JS rewrites it at runtime to whichever domain the visitor is on.

- The no-JS fallback `<option>` inside `<select data-lang-select>` should match **your** language, e.g. for `es.html`:

  ```html
  <select data-lang-select>
    <option>ES — Español</option>
  </select>
  ```

  `assets/translations.js` clears this and repopulates the dropdown from JSON, but it's the fallback when JS doesn't run.

### 4. Don't touch

- CSS classes, HTML structure, the `<select data-lang-select>` markup
- Font links and OG image paths (just change the filename suffix)
- The `data-variant-toggle` attribute on the smooth↔angry cross-link button — `assets/translations.js` derives its `href` from the current page name, so a stale `href` in the markup gets overwritten
- GitHub link, nohello/dontasktoask links, YouTube "mad" link
- In angry files, the `../styles.css` and `../assets/` relative paths
- `assets/copy.js` — it's shared by every page
- The block between `<!-- hreflang:start -->` and `<!-- hreflang:end -->` markers in every HTML file (managed by CI — see step 6)

### 5. Register the language in `assets/translations.json`

One entry, once:

```json
{
  "code": "es",
  "hreflang": "es",
  "label": "ES — Español",
  "file": "es.html"
}
```

Same `file` value applies to both smooth (`/es.html`) and angry (`/angry/es.html`). The dropdown in every existing page picks it up automatically — no per-file `<option>` edits.

### 6. hreflang links

Skip this — CI does it for you. Just make sure your entry in `assets/translations.json` is correct. The next push to main runs `scripts/sync-hreflang.mjs` and updates every HTML file's hreflang block automatically (the block between the `<!-- hreflang:start -->` and `<!-- hreflang:end -->` markers). The validation check on your PR will show you a preview of what changed.

These links stay static in the HTML (not JS-injected) so Bing, Yandex, and Baidu pick them up reliably — but you don't have to maintain them by hand.

### 7. OG image

Open a PR.

---

## OG image (social card)

Each language needs its own card so Twitter/Slack/etc show the right preview.

**File pattern:** `assets/og-image-<code>.svg` and `assets/og-image-<code>.png`. English is plain `og-image.svg` / `.png`. So Brazilian Portuguese is `og-image-pt-br.svg` / `og-image-pt-br.png`. Match the suffix to your HTML filename.

You can ship one image for both versions, or two (`og-image-<code>.png` and `og-image-<code>-angry.png`) for different previews.

### Making it

1. Copy `assets/og-image.svg` to `assets/og-image-<code>.svg`.
2. Open it, find the three `<text>` elements ("Oops, you pasted / the AI without / reading it."), translate them. Keep the red `<tspan fill="#a82820">` (whatever your word for "AI" is) so the color stays. Try to balance line lengths or text overflows.
3. Leave the `dontpastetheai.com` in the yellow tag alone — that's the domain.
4. Render to PNG at exactly **1200×630**. You need `Special Elite` and `JetBrains Mono` installed locally (Google Fonts → `~/.local/share/fonts/` → `fc-cache -f`), then:

   ```bash
   rsvg-convert -w 1200 -h 630 assets/og-image-<code>.svg -o assets/og-image-<code>.png
   ```

   No `rsvg-convert`? Inkscape, ImageMagick, or any SVG→PNG tool works.
5. Update `og:image` and `twitter:image` in your two HTML files to point at the PNG.

If you can't render locally, just ship the SVG. The push-to-main workflow runs `rsvg-convert` via `scripts/build-og-images.mjs` and generates the PNG for you. Your PR's `Check OG image freshness` step will warn that the PNG is missing — that's expected; ignore it.

## Non-Latin scripts (Cyrillic, CJK, Arabic, etc.)

`Special Elite` is Latin-only. It won't render Cyrillic, Chinese, Japanese, Korean, Arabic, Hebrew, Thai, or anything non-A–Z. You'll get empty boxes or fallback fonts.

What to do:

- Pick a monospace display font with the right vibe (typewriter, slightly rough). Good bets: `Courier Prime` (broad coverage), `IBM Plex Mono` (Latin + Cyrillic + Greek + JP/KR), `Noto Sans Mono` (everything), `JetBrains Mono` (already loaded, decent Cyrillic).
- In **your HTML only**, swap the Google Fonts `<link>` and update `--font-type` in a `<style>` block in `<head>`. Don't touch `styles.css`.
- In your OG SVG, change `font-family="Special Elite"` to your font. Make sure it's installed before rendering.
- It won't look identical to English, and that's fine. Aim for "same vibe in my script", not "pixel-perfect match".

Not sure? Open a PR with your best guess and we'll iterate.

## Tone notes

The two versions have different tones. Don't merge them.

- **Smooth** — friendly, work-safe, nohello.net-ish. Direct without being aggressive. Picture sending it to a coworker you respect and don't want to weird out. No swearing, no insults, just a clear ask. Check `pt-br.html` for how PT-BR pulls it off.
- **Angry** — satire with actual feelings. Frustrated, opinionated, a bit rude on purpose. Don't smooth it into corporate-speak. If your language has real slang for "lazy AI paste behavior", use it. Goal: reader feels called out, not lectured. Look at `angry/pt-br.html` — it's how people actually talk in Portuguese, not textbook stuff.

## Student page (optional)

There is a third page at `/student/`, written from a teacher's perspective for students who submit AI-generated work they never read. Translating it is optional, the language dropdown on that page only lists the languages that have one.

It works like `angry/`, one directory with `index.html` for English and `<code>.html` for everything else:

```
student/index.html  →  student/<code>.html
```

Register it under `pages.student` in `assets/translations.json`, using the bare filename:

```json
{ "code": "es", "label": "ES — Español", "file": "es.html" }
```

Registering it is all you need to do. CI generates the hreflang block, the `og:locale` tag and the sitemap entry from that one JSON edit, and it also points the teacher button on your smooth page at your translation instead of the English one. Languages without a student page fall back to English, so nothing breaks if you skip it.

## Right-to-left languages

Add `dir="rtl"` to the `<html>` tag. CSS doesn't have logical properties everywhere yet, so layout might look weird. Open the PR anyway — we'll fix it in review.

## The validation script

The workflow has two phases:

- **On PR:** `scripts/check-translations.mjs` runs and must pass. `scripts/sync-hreflang.mjs --check` and `scripts/build-og-images.mjs --check` also run, but only as informational status — drift there won't block your merge.
- **On push to main:** the sync scripts run for real, commit the regenerated hreflang blocks and any missing PNGs back with `[skip ci]`, which triggers Cloudflare to redeploy.

`check-translations.mjs` checks:

- Your `translations.json` entry exists and has all required fields
- The smooth + angry files exist at the expected paths
- Canonical URLs and og:url use `https://dontpastetheai.com/...`
- The OG image SVG is present (PNG is rendered by CI if missing)

You can run all three locally before pushing:

```bash
node scripts/check-translations.mjs
node scripts/sync-hreflang.mjs
node scripts/build-og-images.mjs   # needs rsvg-convert installed
```

Don't try to remember everything in this doc — let the scripts catch what you forgot.

---

That's it. If anything in this guide is wrong, outdated, or unclear, fixing the doc is also a great PR. Thanks for translating.
