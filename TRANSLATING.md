# Translating dontpastetheai

Hi! Thanks for picking up a translation. Here's how to do that.

If you get stuck, open a PR anyway, even half-finished. We'll help you across the finish line.

## TL;DR

1. Pick a [BCP 47 language code](https://en.wikipedia.org/wiki/IETF_language_tag), lowercase, hyphenated (e.g. `es`, `pt-br`, `zh-tw`).
2. Copy `index.html` → `<code>.html` and `angry/index.html` → `angry/<code>.html`. Translate the visible text in both.
3. Copy `student/index.html` → `<code>.html`, student pages have no angry versions. Translate that too
4. Register your language in `assets/translations.json` and add your student page under `pages`. CI handles the hreflang links across all pages so you **DO NOT** need to add them manually on the `<head>`
5. Make an OG image SVG, it will be converted to PNG once the CI run.
6. Then open a PR.

The [GitHub Action](.github/workflows/validate.yml) runs on your PR and tells you what's missing. You can run it locally first: `node scripts/check-translations.mjs`.

---

## Step by step

Each language is one HTML file per version. You need to translate **both** smooth and angry.

### 1. Pick a code

Use [BCP 47](https://en.wikipedia.org/wiki/IETF_language_tag), lowercase, hyphenated. The filename matches the code:

- Spanish → `es.html`
- Brazilian Portuguese → `pt-br.html`
- Traditional Chinese (Taiwan) → `zh-tw.html`

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
- The cross-link button text (red `.cta-angry` on smooth, green `.cta-calm` on angry). Keep the `data-variant-toggle` attribute and the static `href` as-is.
- `og:url` and `<link rel="canonical">` should point at your file:
  - smooth: `https://dontpastetheai.com/<code>.html`
  - angry: `https://dontpastetheai.com/angry/<code>.html`
- For the copy button you should translate the two data attributes, not the visible text:

  ```html
  <button id="copyBtn" type="button" class="url-tag-big"
      data-copy-aria="Copy {domain} to clipboard"
      data-copied-text="copied!">dontpastetheai.com</button>
  ```

  Translate `data-copy-aria` (keep the `{domain}` placeholder since `assets/copy.js` substitutes the actual hostname) and `data-copied-text`.

- The no-JS fallback `<option>` inside `<select data-lang-select>` should match **your** language, e.g. for `es.html`:

  ```html
  <select data-lang-select>
    <option>ES — Español</option>
  </select>
  ```

  `assets/translations.js` clears this and repopulates the dropdown from JSON, but it's the fallback when JS doesn't run.

### 4. Don't touch

If you change any of these files, the PR will be automatically closed:

- CSS classes, HTML structure, the `<select data-lang-select>` markup
- Font links and OG image paths (just change the filename suffix)
- The `data-variant-toggle` attribute on the smooth↔angry cross-link button
- GitHub link, nohello/dontasktoask links, YouTube "mad" link
- In angry files, the `../styles.css` and `../assets/` relative paths
- `assets/copy.js` because it is shared by every page
- The block between `<!-- hreflang:start -->` and `<!-- hreflang:end -->` markers in every HTML file (managed by CI, see step 6. It will create a LOT of conflicts if you do)

### 5. Register the language in `assets/translations.json`

One entry, once:

```json
{
  "code": "es",
  "hreflang": "es",
  "locale": "es_ES",
  "label": "ES — Español",
  "file": "es.html"
}
```

`locale` is the `og:locale` value (`language_TERRITORY`).

Same `file` value applies to both smooth (`/es.html`) and angry (`/angry/es.html`). The dropdown in every existing page picks it up automatically — no per-file `<option>` edits.

### 6. hreflang links

**DO NOT** change them. CI does it for you. Just make sure your entry in `assets/translations.json` is correct. The next push to main will run `scripts/sync-hreflang.mjs` and it will update every HTML file's hreflang block automatically (the block between the `<!-- hreflang:start -->` and `<!-- hreflang:end -->` markers). The validation check on your PR will show you a preview of what changed.

## 7. OG image (social card)

Each language needs its own card so Twitter/Slack/etc show the right preview.

**File pattern:** `assets/og-image-<code>.svg` and `assets/og-image-<code>.png`. English is plain `og-image.svg` / `.png`. So Brazilian Portuguese is `og-image-pt-br.svg` / `og-image-pt-br.png`. Match the suffix to your HTML filename.

You can ship one image for both versions, or two (`og-image-<code>.png` and `og-image-<code>-angry.png`) for different previews.

### Making it

1. Copy `assets/og-image.svg` to `assets/og-image-<code>.svg`.
2. Open it, find the three `<text>` elements ("Oops, you pasted / the AI without / reading it."), translate them. Keep the red `<tspan fill="#a82820">` (whatever your word for "AI" is) so the color stays. Try to balance line lengths or text overflows.
3. Leave the `dontpastetheai.com` in the yellow tag alone 
4. Render to PNG at exactly **1200×630**. You need `Special Elite` and `JetBrains Mono` installed locally (Google Fonts) or if your language has non Latin characters, you will need to have that installed to, then:

   ```bash
   rsvg-convert -w 1200 -h 630 assets/og-image-<code>.svg -o assets/og-image-<code>.png
   ```

   No `rsvg-convert`? Inkscape, ImageMagick, or any SVG→PNG tool works.

6. Update `og:image` and `twitter:image` in your two HTML files to point at the PNG.

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

The two versions have different tones.

- **Smooth** — friendly, work-safe, nohello.net-ish. Direct without being aggressive. Picture sending it to a coworker you respect and don't want to weird out. No swearing, no insults, just a clear ask. Check `pt-br.html` for how PT-BR does it.
- **Angry** — satire with actual feelings. Frustrated, opinionated, a bit rude on purpose. If your language has real slang for "lazy AI paste behavior", use it. Goal: reader feels called out, not lectured. Look at `angry/pt-br.html`

## Student page

There is a third page at `/student/`, written from a teacher's perspective for students who submit AI-generated work they never read.

It works like `angry/`, one directory with `index.html` for English and `<code>.html` for everything else:

```
student/index.html  →  student/<code>.html
```

Registered under `pages.student` in `assets/translations.json`, same shape as a language entry but with the bare filename:

```json
{ "code": "es", "hreflang": "es", "locale": "es_ES", "label": "ES — Español", "file": "es.html" }
```

That's basically it! CI generates the hreflang block, the `og:locale` tag and the sitemap entry from it, and it points the teacher button on your smooth page at your translation instead of the English one.

Two things specific to this page: 

- set `data-copy-path="/student/<code>"` on the copy button so it shares your page rather than the homepage,
- and remember the assets are one directory up, so paths are `../styles.css` and `../assets/`.

Student pages share the **SAME OG IMAGE** so you don't need to create another one.

## Right-to-left languages

Add `dir="rtl"` to the `<html>` tag. CSS doesn't have logical properties everywhere yet, so layout might look weird. Open the PR anyway

## The validation script

The workflow has two phases:

- **On PR:** `scripts/check-translations.mjs` runs and must pass. `scripts/sync-hreflang.mjs --check`, `scripts/sync-seo.mjs --check` and `scripts/build-og-images.mjs --check` also run, but only as informational status
- **On push to main:** the sync scripts run for real, commit the regenerated hreflang blocks, `og:locale` tags, `sitemap.xml`, `robots.txt` and any missing PNGs back with `[skip ci]`, which triggers Cloudflare to redeploy.

`check-translations.mjs` checks:

- Your `translations.json` entry exists and has all required fields
- The languages are sorted by `code`
- The smooth + angry files exist at the expected paths
- Canonical URLs and og:url use `https://dontpastetheai.com/...`
- The OG image SVG is present (PNG is rendered by CI if missing)
- Section pages under `pages.*` (student) get the same canonical, og:url and `<html lang>` checks

You can run them all locally before pushing:

```bash
node scripts/check-translations.mjs
node scripts/sync-hreflang.mjs
node scripts/sync-seo.mjs
node scripts/build-og-images.mjs   # needs rsvg-convert installed
```

That's it. If anything in this guide is wrong, outdated, or unclear, fixing the doc is also a great PR. Thanks for translating.
