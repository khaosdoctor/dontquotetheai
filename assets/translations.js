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
  // Cloudflare serves *.html at clean URLs (e.g. /it -> it.html), so the
  // pathname's last segment may be missing the extension. Normalize so the
  // value matches the "file" entries in translations.json.
  const last = location.pathname.split("/").pop() || "";
  const here = !last
    ? "index.html"
    : last.endsWith(".html")
      ? last
      : `${last}.html`;
  const page = document.documentElement.dataset.page || "smooth";
  const isAngry = location.pathname.includes("/angry/");
  const dataUrl = page === "student"
    ? "/assets/translations.json"
    : (isAngry ? "../" : "") + "assets/translations.json";

  function cleanUrl(file) {
    if (page === "student") {
      return `/${file.replace(/\.html$/, "")}`;
    }
    if (isAngry) {
      return file === "index.html" ? "/angry/" : `/angry/${file.replace(/\.html$/, "")}`;
    }
    return file === "index.html" ? "/" : `/${file.replace(/\.html$/, "")}`;
  }

  function matchesCurrentRoute(file) {
    const pathname = location.pathname.replace(/\/$/, "") || "/";
    const clean = cleanUrl(file).replace(/\/$/, "") || "/";
    const physical = page === "student"
      ? `/${file}`
      : isAngry
        ? `/angry/${file}`
        : `/${file}`;
    return pathname === clean || location.pathname === physical;
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
    .then((data) => {
      const languages = page === "student"
        ? (data.pages?.student || [])
        : data.languages;
      const select = document.querySelector("[data-lang-select]");
      if (!select || !languages?.length) return;
      select.replaceChildren();

      languages.forEach(({ file, label }) => {
        const opt = document.createElement("option");
        opt.value = file;
        opt.textContent = label;
        select.appendChild(opt);
      });
      const current = languages.find(({ file }) => matchesCurrentRoute(file));
      const browserLanguages = navigator.languages || [navigator.language];
      const detected = browserLanguages
        .map((locale) => locale.toLowerCase())
        .map((locale) => languages.find(({ code }) =>
          locale === code.toLowerCase() || locale.startsWith(`${code.toLowerCase()}-`)))
        .find(Boolean);
      select.value = (current || detected || languages[0]).file;

      if (page === "smooth") {
        const studentLanguages = data.pages?.student || [];
        const currentCode = current?.code || detected?.code || "en";
        const studentLanguage = studentLanguages.find(({ code }) => code === currentCode)
          || studentLanguages.find(({ code }) => code === "en");
        if (studentLanguage) {
          document.querySelectorAll("[data-student-toggle]").forEach((link) => {
            link.href = cleanUrl(studentLanguage.file);
          });
        }
      }

      select.addEventListener("change", (e) => {
        const v = e.target.value;
        const selected = languages.find(({ file }) => file === v);
        if (selected) location.href = cleanUrl(selected.file);
      });
    })
    .catch((err) => console.error("translations: failed to load", err));
})();
