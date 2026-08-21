// Builds the language <select> from assets/translations.json so the option
// list lives in one place. To add a language: append an entry to that JSON
// file and ship your HTML — no need to touch the <select> in every file.
//
// SEO note: <link rel="alternate" hreflang> tags stay static in each HTML
// <head> on purpose. Googlebot renders JS, but Bing / Yandex / Baidu are
// less reliable about it, and we have RU + ZH translations where that
// matters. Keep hreflang in the markup; only the user-facing dropdown is
// dynamic.
//
// HTML contract:
//   <select data-lang-select></select>   — gets populated with <option>s
(function () {
  const LANGUAGE_PREFERENCE_KEY = "dontpastetheai.language";

  // Cloudflare serves *.html at clean URLs (e.g. /it -> it.html), so the
  // pathname's last segment may be missing the extension. Normalize so the
  // value matches the "file" entries in translations.json.
  const last = location.pathname.split("/").pop() || "";
  const here = !last
    ? "index.html"
    : last.endsWith(".html")
      ? last
      : `${last}.html`;
  const isAngry = location.pathname.includes("/angry/");
  const dataUrl = (isAngry ? "../" : "") + "assets/translations.json";

  function preferredLanguage(languages) {
    try {
      const savedCode = localStorage.getItem(LANGUAGE_PREFERENCE_KEY);
      const saved = languages.find(({ code }) => code === savedCode);
      if (saved) return saved;
    } catch (_) { /* storage blocked (private mode, etc.) */ }

    // Browser locales are usually regional (for example, ko-KR), while a
    // translation can be registered as its base language (ko). Try exact
    // matches first, then only a registered base-language entry. This avoids
    // guessing between variants such as zh-CN and zh-TW.
    const browserLanguages = navigator.languages?.length
      ? navigator.languages
      : [navigator.language];
    for (const locale of browserLanguages.filter(Boolean)) {
      const normalized = locale.toLowerCase().replace(/_/g, "-");
      const exact = languages.find(({ code }) => code.toLowerCase() === normalized);
      if (exact) return exact;

      const base = normalized.split("-")[0];
      const baseLanguage = languages.find(({ code }) => code.toLowerCase() === base);
      if (baseLanguage) return baseLanguage;
    }

    // English is the default when none of the user's preferred languages has
    // a registered translation.
    return languages.find(({ code }) => code === "en");
  }

  // Variant toggle: links marked with [data-variant-toggle] flip between the
  // polite (/) and angry (/angry/) version of the *current* page, so each
  // translated file doesn't have to hardcode its counterpart href.
  const file = here === "index.html" ? "" : here;
  const toggleHref = isAngry ? `../${file}` : `angry/${file}`;
  document.querySelectorAll("[data-variant-toggle]").forEach((a) => {
    a.href = toggleHref;
  });

  fetch(dataUrl)
    .then((r) => r.json())
    .then(({ languages }) => {
      const select = document.querySelector("[data-lang-select]");
      if (!select) return;
      select.replaceChildren();

      languages.forEach(({ file, label }) => {
        const opt = document.createElement("option");
        opt.value = file;
        opt.textContent = label;
        select.appendChild(opt);
      });
      select.value = here;

      // Redirect only an initial visit to the smooth English root. Linked
      // translations and the angry variant must always keep their URL.
      const isEnglishRoot = !isAngry && (location.pathname === "/" || location.pathname === "/index.html");
      if (isEnglishRoot) {
        const preferred = preferredLanguage(languages);
        if (preferred && preferred.file !== "index.html") {
          // Use the physical file path so local static servers (such as
          // `python -m http.server`) work too. Cloudflare serves this file at
          // its clean URL in production.
          location.replace(preferred.file);
          return;
        }
      }

      select.addEventListener("change", (e) => {
        const v = e.target.value;
        const selected = languages.find(({ file }) => file === v);
        try {
          if (selected) localStorage.setItem(LANGUAGE_PREFERENCE_KEY, selected.code);
        } catch (_) {}
        if (v && v !== here) location.href = v;
      });
    })
    .catch((err) => console.error("translations: failed to load", err));
})();
