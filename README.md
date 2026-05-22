# dontpastetheai.com

> A website you send to that one person who answers every question with eight hundred words of ChatGPT they clearly didn't read.

You know... That one.

> **This is satire.** Nobody is being attacked, nobody is being cancelled, nobody hates AI, have some humor. Use the tools. Just, you know, read them first.

PRs welcome, especially translations. This is a static HTML page, like the
aztecs used to do back in the day.

## How to translate

The site is one HTML file per language. Just copy and translate.

### Steps

1. Pick a language code (e.g. `es` for Spanish, `de` for German, `fr` for French). Use [BCP 47](https://en.wikipedia.org/wiki/IETF_language_tag) tags — `pt-BR` not `pt_BR`, `zh-CN` not `zh_cn`.
2. Copy `index.html` to `<code>.html`. For example: `es.html`, `de.html`, `frfr.html`. Whatever, just make it short and recognizable.
3. Translate the content inside the file. Things to translate:
   - `<title>` and all `<meta>` description tags
   - `og:title` and `og:description`
   - `<html lang="...">` attribute (set to your language code)
   - All visible text in `<header>`, `<section>`, `<blockquote>`, `<ol>`, `<.shout>`, `<.signature>`, `<.footer>`
   - The `aria-label` on the language `<select>`
   - The button `aria-label` and the "copied!" string in the inline `<script>` if you want feedback localized
   - The `og:url` and `<link rel="canonical">` to point at your file (e.g. `https://dontpastetheai.com/es.html`)
4. Things to leave alone:
   - All CSS classes, HTML structure, `<script>` logic
   - The `dontpastetheai.com` text inside the copy button (it's the URL)
   - Font links, asset paths, OG image URL
   - The GitHub link, the nohello/dontasktoask links, the YouTube "mad" link
5. Add an `<option>` for your language to the `<select>` in **every** existing HTML file (including yours). Keep the format: `<option value="yourfile.html">XX — Native Name</option>`. The selected option in your file should be your own language.
6. Add an `hreflang` link in the `<head>` of **every** existing HTML file, pointing to yours:
   ```html
   <link rel="alternate" hreflang="xx-XX" href="https://dontpastetheai.com/yourfile.html">
   ```
7. Make an OG image for your language (see below).
8. Open a PR.

### OG image (social card)

Each language gets its own social card so the preview people see on Twitter/Slack/etc matches the language of the page they're about to click.

Pattern: `assets/og-image-<lang>.svg` and `assets/og-image-<lang>.png`. The English one is just `og-image.svg`/`.png` (no suffix). The Portuguese one is `og-image-ptbr.svg`/`.png`. Match the suffix to your HTML filename.

#### Steps

1. Copy `assets/og-image.svg` to `assets/og-image-<lang>.svg`.
2. Open it. There are three lines of text (`<text>` elements) that say "Oops, you pasted / the AI without / reading it." Translate those three lines. Keep the `<tspan fill="#a82820">AI</tspan>` (or your language's term for it) wrapped in the red `<tspan>` so the accent color stays. Try to balance the line lengths roughly — too long and the text overflows the canvas.
3. Don't touch the `dontpastetheai.com` text in the yellow tag at the bottom — that's the URL.
4. Render it to PNG (1200×630). The site fonts need to be installed locally for this to look right. Grab `Special Elite` (Google Fonts) and `JetBrains Mono` if you don't have them, drop the `.ttf` files in `~/.local/share/fonts/`, run `fc-cache -f`, then:

   ```bash
   rsvg-convert -w 1200 -h 630 assets/og-image-<lang>.svg -o assets/og-image-<lang>.png
   ```

   If you don't have `rsvg-convert`, Inkscape, ImageMagick, or any "SVG to PNG" web tool will do. Just make sure the output is exactly 1200×630.
5. In your HTML file, update both `og:image` and `twitter:image` meta tags to point at your PNG.

If you can't render the PNG locally for whatever reason, ship the SVG in the PR and say so and we'll render it during review.

#### Non-Latin scripts (Cyrillic, CJK, Arabic, Greek, etc.)

Heads up: `Special Elite` is a Latin-only typewriter font. It does **not** support Cyrillic, Chinese, Japanese, Korean, Arabic, Hebrew, Thai, Devanagari, or pretty much anything that isn't `A–Z`. If your language uses any of these scripts, the headings and the OG image will render as empty boxes (`□□□`) or fall back to a totally different font that breaks the typewriter vibe.

What to do:

- Pick a script-appropriate display font with a similar feel (typewriter, mono, slightly distressed). Some starting points: `Courier Prime` (which has broad coverage), `IBM Plex Mono` (Latin + Cyrillic + Greek + JP/KR), `Noto Sans Mono` (everything, including CJK and Arabic), `JetBrains Mono` (already loaded, decent Cyrillic coverage).
- In **your** HTML file only, swap the Google Fonts `<link>` and update the `--font-type` CSS variable in a `<style>` block in the `<head>`. Don't change `styles.css` — keep the override scoped to your language file.
- In your OG SVG, change `font-family="Special Elite"` to whatever font you picked. Make sure that font is installed locally before you render to PNG.
- It won't look identical to the English version, and that's fine. Aim for "same vibe in your script" over "pixel-perfect match".

If you're not sure what to pick, open a PR with the closest font you found and we'll iterate.

### Tone notes

This is satire with feelings. It's frustrated, opinionated, a bit rude on purpose. Don't sand it down into corporate-speak. If your language has natural slang for "lazy AI paste behavior", use it. The goal is that someone who gets sent this link reads it and feels mildly called out, not lectured at by HR.

Look at `ptbr.html` for an example of how loose the translation can be. It uses Brazilian Portuguese the way people actually talk to each other, not the way textbooks do.

### What if my language reads right-to-left?

Add `dir="rtl"` to the `<html>` tag. The CSS doesn't have logical properties everywhere yet, so some things might look a bit off — open the PR anyway, we can fix layout in review.

## Local dev

There's no build. Open `index.html` in a browser, or `python3 -m http.server` from the repo root if you want a local server for testing.

## Deploy

Cloudflare Workers Assets via `wrangler.jsonc`. Pushes to `main` deploy automatically.

## License

See `LICENSE`. Free to share, remix, translate.
