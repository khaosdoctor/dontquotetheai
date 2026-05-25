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
  const here = location.pathname.split("/").pop() || "index.html";
  const isAngry = location.pathname.includes("/angry/");
  const dataUrl = (isAngry ? "../" : "") + "assets/translations.json";

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

      select.addEventListener("change", (e) => {
        const v = e.target.value;
        if (v && v !== here) location.href = v;
      });
    })
    .catch((err) => console.error("translations: failed to load", err));
})();
