#!/usr/bin/env node
// Regenerates the <link rel="alternate" hreflang="..."> block in every HTML
// file from assets/translations.json. On first run, replaces the existing
// contiguous block of alternate links with a marker-wrapped block. On
// subsequent runs, replaces the content between the markers.
//
// Usage:
//   node scripts/sync-hreflang.mjs           # mutate files
//   node scripts/sync-hreflang.mjs --check   # exit 1 if any file would change

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const HOST = "https://dontpastetheai.com";

const START_MARKER =
  "<!-- hreflang:start (managed by scripts/sync-hreflang.mjs — do not edit by hand) -->";
const END_MARKER = "<!-- hreflang:end -->";

function loadData() {
  const raw = readFileSync(
    join(REPO_ROOT, "assets", "translations.json"),
    "utf8",
  );
  const data = JSON.parse(raw);
  if (!Array.isArray(data.languages) || data.languages.length === 0) {
    throw new Error("translations.json: missing or empty 'languages' array");
  }
  return data;
}

// prefix is the section's URL prefix: "/" for smooth, "/angry/", "/student/".
// Each section's alternates only ever point inside that same section, so a
// French reader on the student page gets sent to the French student page.
function urlFor(lang, prefix) {
  if (lang.file === "index.html") return `${HOST}${prefix}`;
  return `${HOST}${prefix}${lang.file}`;
}

function buildBlock(languages, prefix, indent) {
  const lines = [`${indent}${START_MARKER}`];
  for (const lang of languages) {
    lines.push(
      `${indent}<link rel="alternate" hreflang="${lang.hreflang ?? lang.code}" href="${urlFor(lang, prefix)}">`,
    );
  }
  // x-default points to the English page of this section
  lines.push(
    `${indent}<link rel="alternate" hreflang="x-default" href="${HOST}${prefix}">`,
  );
  lines.push(`${indent}${END_MARKER}`);
  return lines.join("\n");
}

// Matches a contiguous block of <link rel="alternate" hreflang="..."> tags,
// tolerating both single-line and multi-line forms. The block is detected by
// finding the first such <link> and then greedily consuming consecutive ones
// (allowing only whitespace between them).
function findExistingBlock(content) {
  // First, look for marker-wrapped block.
  const markerRe = new RegExp(
    `([ \\t]*)${escapeRegex(START_MARKER)}[\\s\\S]*?${escapeRegex(END_MARKER)}`,
  );
  const markerMatch = content.match(markerRe);
  if (markerMatch) {
    return {
      kind: "marker",
      start: markerMatch.index,
      end: markerMatch.index + markerMatch[0].length,
      indent: markerMatch[1] ?? "",
    };
  }

  // Otherwise, find a contiguous run of <link rel="alternate" hreflang="..."> tags.
  // Each <link> can span multiple lines; we accept any whitespace inside the tag.
  // Pattern for a single link tag:
  const linkPattern =
    /[ \t]*<link\b[^>]*\brel="alternate"[^>]*\bhreflang="[^"]+"[^>]*>\s*/;
  // Multi-line variant (rel/hreflang on separate lines):
  // We use a broader match: <link ... > or <link ... />, possibly multi-line,
  // containing rel="alternate" and hreflang="...".
  const broadLinkRe =
    /([ \t]*)<link\b[^>]*?\brel="alternate"[^>]*?\bhreflang="[^"]+"[^>]*?\/?>\s*/gs;

  const matches = [];
  let m;
  while ((m = broadLinkRe.exec(content)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length, indent: m[1] });
  }
  if (matches.length === 0) {
    return null;
  }

  // Group contiguous matches (each next must start where previous ended, allowing only whitespace).
  // Since our regex consumes trailing whitespace, contiguous means next.start === prev.end.
  // Take the first group.
  const groups = [];
  let current = [matches[0]];
  for (let i = 1; i < matches.length; i++) {
    if (matches[i].start === current[current.length - 1].end) {
      current.push(matches[i]);
    } else {
      groups.push(current);
      current = [matches[i]];
    }
  }
  groups.push(current);

  // Pick the largest contiguous group (should be the hreflang block).
  groups.sort((a, b) => b.length - a.length);
  const group = groups[0];
  const first = group[0];
  const last = group[group.length - 1];
  // Trim trailing whitespace from end so we don't eat the newline before next element.
  let end = last.end;
  // Step back over trailing whitespace but keep one trailing newline if present
  // so the structure stays consistent.
  // Actually we want to replace the entire run including the trailing newline that
  // came with the last link, because our new block ends without a trailing newline.
  // The surrounding file content provides the next line's leading newline.
  // Simpler: keep end as-is (it includes trailing whitespace via \s* in regex),
  // and our replacement will be the new block followed by nothing. The next char
  // in the file is whatever followed the original block (often a newline+indent
  // for the next tag). But if the regex consumed that newline, we lose the
  // separator. To be safe, trim the consumed trailing whitespace back to but
  // not including the final newline.
  // Find last newline within [first.start, end) - we want to keep newline+indent
  // for the following tag.
  // Approach: re-detect the tight end by trimming trailing whitespace.
  while (end > first.start && /\s/.test(content[end - 1])) end--;
  // Now content[end] is the char right after the last '>' of the final link tag.
  // The block's leading indent is taken from the first match.
  return {
    kind: "bare",
    start: first.start,
    end,
    indent: first.indent ?? "",
  };
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function syncFile(filePath, languages, prefix, check) {
  const original = readFileSync(filePath, "utf8");
  const existing = findExistingBlock(original);
  if (!existing) {
    return { changed: false, missing: true };
  }
  const newBlock = buildBlock(languages, prefix, existing.indent);
  // The existing.start is at the indent's start (since regex captured indent),
  // existing.end is just after last '>'. Replace [start, end) with newBlock.
  const before = original.slice(0, existing.start);
  const after = original.slice(existing.end);
  const updated = before + newBlock + after;
  if (updated === original) {
    return { changed: false };
  }
  if (!check) {
    writeFileSync(filePath, updated, "utf8");
  }
  return { changed: true };
}

function main() {
  const check = process.argv.includes("--check");
  const data = loadData();
  const languages = data.languages;

  const targets = [];
  for (const lang of languages) {
    targets.push({
      path: join(REPO_ROOT, lang.file),
      list: languages,
      prefix: "/",
    });
    targets.push({
      path: join(REPO_ROOT, "angry", lang.file),
      list: languages,
      prefix: "/angry/",
    });
  }
  // Standalone sections (student/) carry their own language list under
  // pages.<name>, so their alternates come from that list, not from languages.
  for (const [name, entries] of Object.entries(data.pages ?? {})) {
    for (const entry of entries) {
      targets.push({
        path: join(REPO_ROOT, name, entry.file),
        list: entries,
        prefix: `/${name}/`,
      });
    }
  }

  const changed = [];
  const missing = [];
  for (const t of targets) {
    let res;
    try {
      res = syncFile(t.path, t.list, t.prefix, check);
    } catch (err) {
      if (err.code === "ENOENT") {
        missing.push(t.path);
        continue;
      }
      throw err;
    }
    if (res.missing) {
      console.warn(
        `warn: no hreflang block found in ${t.path} (file unchanged)`,
      );
      continue;
    }
    if (res.changed) changed.push(t.path);
  }

  if (missing.length > 0) {
    for (const p of missing) console.warn(`warn: file not found: ${p}`);
  }

  const total = targets.length - missing.length;
  if (check) {
    if (changed.length > 0) {
      console.log(`Out of sync: ${changed.length} file(s) would change:`);
      for (const p of changed) console.log(`  ${p}`);
      process.exit(1);
    }
    console.log(`All ${total} files in sync`);
    process.exit(0);
  }

  if (changed.length === 0) {
    console.log(`All ${total} files in sync`);
  } else {
    console.log(`Updated ${changed.length} file(s):`);
    for (const p of changed) console.log(`  ${p}`);
  }
}

main();
