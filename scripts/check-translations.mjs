#!/usr/bin/env node
// Validates the multilingual HTML setup for dontpastetheai.com.
// Source of truth: assets/translations.json. No external dependencies.

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const CANONICAL_HOST = "dontpastetheai.com";
const OLD_HOST = "dontquotetheai.com";
const OLD_FILENAMES = ["ptbr.html", "zhtw.html"];

// findings: Map<file, { errors: string[], warnings: string[] }>
const findings = new Map();
function record(file, kind, msg) {
  if (!findings.has(file)) findings.set(file, { errors: [], warnings: [] });
  findings.get(file)[kind].push(msg);
}
const err = (f, m) => record(f, "errors", m);
const warn = (f, m) => record(f, "warnings", m);

function read(file) {
  return readFileSync(join(REPO_ROOT, file), "utf8");
}

function smoothUrl(file) {
  return file === "index.html"
    ? `https://${CANONICAL_HOST}/`
    : `https://${CANONICAL_HOST}/${file}`;
}
function angryUrl(file) {
  return file === "index.html"
    ? `https://${CANONICAL_HOST}/angry/`
    : `https://${CANONICAL_HOST}/angry/${file}`;
}

function ogImageFor(code) {
  return code === "en"
    ? "assets/og-image.png"
    : `assets/og-image-${code}.png`;
}

// The SVG is the source of truth; CI renders the PNG on merge (sync.yml).
// So a missing PNG is only a hard error when its SVG source is also missing.
function ogSvgFor(code) {
  return code === "en"
    ? "assets/og-image.svg"
    : `assets/og-image-${code}.svg`;
}
function imageMissing(file, label, ref, code) {
  const svgExists = existsSync(join(REPO_ROOT, ogSvgFor(code)));
  if (svgExists) {
    warn(
      file,
      `${label} references missing PNG ${ref} (SVG source exists; CI renders it on merge)`
    );
  } else {
    err(file, `${label} references missing file: ${ref}`);
  }
}

// --- Load translations.json ---
const translations = JSON.parse(read("assets/translations.json"));
const languages = translations.languages;
// Standalone sections (currently just student/) register their own language
// list under pages.<name>, so the set of expected files comes from the JSON.
const sections = translations.pages ?? {};

// Quick lookup helpers
const langByFile = new Map(languages.map((l) => [l.file, l]));

// --- Check 0: alphabetical order by code ---
const codes = languages.map((l) => l.code);
const sorted = [...codes].sort();
for (let i = 0; i < codes.length; i++) {
  if (codes[i] !== sorted[i]) {
    err(
      "assets/translations.json",
      `languages not sorted by code: "${codes[i]}" at index ${i}, expected "${sorted[i]}"`
    );
    break;
  }
}

// --- Check 9: registered HTML files (no orphans) ---
const rootHtml = readdirSync(REPO_ROOT).filter(
  (f) => f.endsWith(".html") && statSync(join(REPO_ROOT, f)).isFile()
);
const angryDir = join(REPO_ROOT, "angry");
const angryHtml = existsSync(angryDir)
  ? readdirSync(angryDir).filter(
      (f) => f.endsWith(".html") && statSync(join(angryDir, f)).isFile()
    )
  : [];

const registered = new Set(languages.map((l) => l.file));
for (const f of rootHtml) {
  if (!registered.has(f)) err(f, `Orphan: not registered in translations.json`);
}
for (const [name, entries] of Object.entries(sections)) {
  const dir = join(REPO_ROOT, name);
  if (!existsSync(dir)) continue;
  const expected = new Set(entries.map((e) => e.file));
  const found = readdirSync(dir).filter(
    (f) => f.endsWith(".html") && statSync(join(dir, f)).isFile()
  );
  for (const f of found) {
    if (!expected.has(f))
      err(`${name}/${f}`, `Orphan: not registered under pages.${name}`);
  }
  // Same head checks the language pages get, so a broken canonical or a
  // wrong <html lang> on a section page fails CI instead of shipping.
  for (const entry of entries) {
    const path = `${name}/${entry.file}`;
    if (!existsSync(join(REPO_ROOT, path))) {
      err(path, `Missing file referenced under pages.${name}`);
      continue;
    }
    const html = read(path);
    const url =
      entry.file === "index.html"
        ? `https://${CANONICAL_HOST}/${name}/`
        : `https://${CANONICAL_HOST}/${name}/${entry.file.replace(/\.html$/, "")}`;
    const lang = html.match(/<html[^>]*\blang\s*=\s*"([^"]+)"/i);
    if (!lang) err(path, `Missing <html lang="..."> attribute`);
    else if (lang[1].toLowerCase() !== entry.code.toLowerCase())
      err(path, `<html lang="${lang[1]}"> expected "${entry.code}"`);
    const canonical = html.match(
      /<link[^>]*\brel\s*=\s*"canonical"[^>]*\bhref\s*=\s*"([^"]+)"/i
    );
    if (!canonical) err(path, `Missing <link rel="canonical">`);
    else if (canonical[1] !== url)
      err(path, `canonical href="${canonical[1]}" expected "${url}"`);
    const ogUrl = html.match(
      /<meta[^>]*\bproperty\s*=\s*"og:url"[^>]*\bcontent\s*=\s*"([^"]+)"/i
    );
    if (!ogUrl) err(path, `Missing <meta property="og:url">`);
    else if (ogUrl[1] !== url)
      err(path, `og:url content="${ogUrl[1]}" expected "${url}"`);
    if (!html.includes(entry.label))
      err(path, `<select data-lang-select> missing <option> with label "${entry.label}"`);
  }
}
for (const f of angryHtml) {
  if (!registered.has(f))
    err(`angry/${f}`, `Orphan: not registered in translations.json`);
}

// --- Per-language checks ---
for (const lang of languages) {
  const { code, hreflang, label, file } = lang;
  const smoothPath = file;
  const angryPath = `angry/${file}`;
  const smoothExists = existsSync(join(REPO_ROOT, smoothPath));
  const angryExists = existsSync(join(REPO_ROOT, angryPath));

  // 1 & 2: files exist
  if (!smoothExists) {
    err(smoothPath, `Missing file referenced in translations.json`);
  }
  if (!angryExists) {
    err(angryPath, `Missing file referenced in translations.json`);
  }

  const variants = [
    {
      path: smoothPath,
      exists: smoothExists,
      kind: "smooth",
      canonical: smoothUrl(file),
      urlFor: (f) => smoothUrl(f),
    },
    {
      path: angryPath,
      exists: angryExists,
      kind: "angry",
      canonical: angryUrl(file),
      urlFor: (f) => angryUrl(f),
    },
  ];

  for (const v of variants) {
    if (!v.exists) continue;
    const html = read(v.path);

    // 3: <html lang="...">
    const htmlLangMatch = html.match(/<html[^>]*\blang\s*=\s*"([^"]+)"/i);
    if (!htmlLangMatch) {
      err(v.path, `Missing <html lang="..."> attribute`);
    } else if (htmlLangMatch[1] !== hreflang) {
      err(
        v.path,
        `<html lang="${htmlLangMatch[1]}"> expected "${hreflang}"`
      );
    }

    // 4: canonical
    const canonicalRe =
      /<link[^>]*\brel\s*=\s*"canonical"[^>]*\bhref\s*=\s*"([^"]+)"/i;
    const canonicalAltRe =
      /<link[^>]*\bhref\s*=\s*"([^"]+)"[^>]*\brel\s*=\s*"canonical"/i;
    const canonical =
      html.match(canonicalRe) || html.match(canonicalAltRe);
    if (!canonical) {
      err(v.path, `Missing <link rel="canonical">`);
    } else if (canonical[1] !== v.canonical) {
      err(
        v.path,
        `canonical href="${canonical[1]}" expected "${v.canonical}"`
      );
    }

    // 5: og:url + twitter url
    const ogUrlRe =
      /<meta[^>]*\bproperty\s*=\s*"og:url"[^>]*\bcontent\s*=\s*"([^"]+)"/i;
    const ogUrlAltRe =
      /<meta[^>]*\bcontent\s*=\s*"([^"]+)"[^>]*\bproperty\s*=\s*"og:url"/i;
    const ogUrl = html.match(ogUrlRe) || html.match(ogUrlAltRe);
    if (!ogUrl) {
      err(v.path, `Missing <meta property="og:url">`);
    } else if (ogUrl[1] !== v.canonical) {
      err(
        v.path,
        `og:url content="${ogUrl[1]}" expected "${v.canonical}"`
      );
    }

    // 6: hreflang block is fully owned by scripts/sync-hreflang.mjs — not checked here.

    // 7: og:image / twitter:image exist on disk
    const expectedOg = ogImageFor(code);
    const ogImageRe =
      /<meta[^>]*\bproperty\s*=\s*"og:image"[^>]*\bcontent\s*=\s*"([^"]+)"/i;
    const ogImageAltRe =
      /<meta[^>]*\bcontent\s*=\s*"([^"]+)"[^>]*\bproperty\s*=\s*"og:image"/i;
    const ogImage = html.match(ogImageRe) || html.match(ogImageAltRe);
    if (!ogImage) {
      err(v.path, `Missing <meta property="og:image">`);
    } else {
      const ref = ogImage[1].replace(/^https?:\/\/[^/]+\//, "");
      if (!existsSync(join(REPO_ROOT, ref))) {
        imageMissing(v.path, "og:image", ref, code);
      }
      if (ref !== expectedOg && !ref.endsWith(expectedOg)) {
        warn(
          v.path,
          `og:image="${ref}" expected to point at "${expectedOg}"`
        );
      }
    }

    const twImageRe =
      /<meta[^>]*\bname\s*=\s*"twitter:image"[^>]*\bcontent\s*=\s*"([^"]+)"/i;
    const twImageAltRe =
      /<meta[^>]*\bcontent\s*=\s*"([^"]+)"[^>]*\bname\s*=\s*"twitter:image"/i;
    const twImage = html.match(twImageRe) || html.match(twImageAltRe);
    if (!twImage) {
      err(v.path, `Missing <meta name="twitter:image">`);
    } else {
      const ref = twImage[1].replace(/^https?:\/\/[^/]+\//, "");
      if (!existsSync(join(REPO_ROOT, ref))) {
        imageMissing(v.path, "twitter:image", ref, code);
      }
    }

    // 8: fallback <option> in <select data-lang-select> contains entry's label
    const selectMatch = html.match(
      /<select[^>]*\bdata-lang-select\b[^>]*>([\s\S]*?)<\/select>/i
    );
    if (!selectMatch) {
      err(v.path, `Missing <select data-lang-select>`);
    } else {
      const inner = selectMatch[1];
      // Look for the option matching this language's label
      if (!inner.includes(label)) {
        err(
          v.path,
          `<select data-lang-select> missing <option> with label "${label}"`
        );
      }
    }

    // 10: no old hostname in head meta tags / canonical / og / hreflang
    const headMatch = html.match(/<head[\s\S]*?<\/head>/i);
    const headHtml = headMatch ? headMatch[0] : html;
    if (headHtml.includes(OLD_HOST)) {
      err(v.path, `Old hostname "${OLD_HOST}" found in <head>`);
    }
    // Warn on body occurrences
    const bodyHtml = headMatch ? html.slice(headMatch[0].length) : "";
    if (bodyHtml.includes(OLD_HOST)) {
      warn(v.path, `Old hostname "${OLD_HOST}" found in <body>`);
    }

    // 11: no old filenames referenced
    for (const old of OLD_FILENAMES) {
      if (html.includes(old)) {
        err(v.path, `References old filename "${old}"`);
      }
    }
  }
}

// --- Report ---
let totalErrors = 0;
let totalWarnings = 0;
const fileCount = findings.size;

const sortedFiles = [...findings.keys()].sort();
for (const file of sortedFiles) {
  const { errors, warnings } = findings.get(file);
  if (errors.length === 0 && warnings.length === 0) continue;
  console.log(`\n${file}`);
  for (const e of errors) {
    console.log(`  ❌ ${e}`);
    totalErrors++;
  }
  for (const w of warnings) {
    console.log(`  ⚠️  ${w}`);
    totalWarnings++;
  }
}

console.log(
  `\n${totalErrors} errors, ${totalWarnings} warnings across ${fileCount} files`
);
process.exit(totalErrors > 0 ? 1 : 0);
