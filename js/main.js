import { load, splitList, parseImages, ContentError } from "./content.js";

/* ------------------------------------------------------------------
   Utilitas
------------------------------------------------------------------- */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const slotEl = name => $(`[data-slot="${name}"]`);

// Semua isi dinamis dibuat lewat DOM (textContent), tidak lewat innerHTML,
// sehingga teks dari file .txt tidak pernah dibaca sebagai HTML.
function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key === "class") el.className = value;
    else if (key === "text") el.textContent = value;
    else if (key === "dataset") { for (const [k, v] of Object.entries(value)) if (v != null) el.dataset[k] = v; }
    else if (key === "style") el.setAttribute("style", value);
    else if (key.startsWith("on")) el.addEventListener(key.slice(2), value);
    else el.setAttribute(key, value === true ? "" : value);
  }
  el.append(...children.flat().filter(c => c != null && c !== false && c !== ""));
  return el;
}

function svgIcon(d) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d);
  svg.append(path);
  return svg;
}
const ICON = {
  copy: "M9 9h10v10H9zM5 15V5h10",
  mail: "M4 6h16v12H4zM4 7l8 6 8-6",
  arrow: "M5 12h14M13 6l6 6-6 6",
  external: "M14 5h5v5M19 5l-8 8M18 14v5H5V6h5",
  github: "M9 19c-4 1.5-4-2-6-2.5M15 21v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6 0C6.8 2.8 5.8 3.1 5.8 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4.4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21",
  doc: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6",
};

const paragraphs = text => (text || "").split("\n\n").filter(Boolean).map(p => h("p", { text: p }));
const external = { target: "_blank", rel: "noopener noreferrer" };
const norm = s => s.trim().toLowerCase();
const listOf = value => (Array.isArray(value) ? value : value ? [value] : []);
const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const pad2 = n => String(n).padStart(2, "0");

const state = {
  lang: "en",
  manifest: {},
  ui: {},
  profile: {},
  contact: {},
  filter: null,
  category: null,
  certIndex: 0,
};

function t(key, vars = {}, fallback) {
  const template = state.ui[key] ?? fallback ?? key;
  return template.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? vars[name] : match));
}

/* ------------------------------------------------------------------
   State UI: memuat, gagal, kosong
------------------------------------------------------------------- */
function errorBox(error, retry) {
  const file = error instanceof ContentError ? error.file : "content";
  return h("div", { class: "state state-error", role: "alert" },
    h("p", { text: t("ERROR", { file }, `Konten gagal dimuat (${file}).`) }),
    h("button", { class: "btn btn-ghost btn-sm", type: "button", onclick: retry }, t("RETRY", {}, "Coba lagi")));
}
const emptyBox = (key = "EMPTY") => h("p", { class: "state state-empty", text: t(key, {}, "Belum ada isi di bagian ini.") });

async function fill(name, loader, render) {
  const el = slotEl(name);
  if (!el) return;
  el.setAttribute("aria-busy", "true");
  try {
    render(el, await loader());
  } catch (error) {
    console.error(error);
    el.replaceChildren(errorBox(error, () => fill(name, loader, render)));
  } finally {
    el.removeAttribute("aria-busy");
    observeReveal(el);
  }
}

const first = file => load(file, state.lang).then(records => records[0] || {});
const all = file => load(file, state.lang);

function loadList(manifestKey, folder) {
  if (!(manifestKey in state.manifest)) return Promise.reject(new ContentError("content/manifest.txt", manifestKey));
  return Promise.all(splitList(state.manifest[manifestKey]).map(slug =>
    load(`${folder}/${slug}.txt`, state.lang).then(r => ({ slug, ...(r[0] || {}) }), error => ({ slug, error }))));
}

/* ------------------------------------------------------------------
   Teks antarmuka
------------------------------------------------------------------- */
function applyUI() {
  for (const el of $$("[data-i18n]")) {
    const value = state.ui[el.dataset.i18n];
    if (value) el.textContent = value;
  }
  for (const el of $$("[data-i18n-aria]")) {
    const value = state.ui[el.dataset.i18nAria];
    if (value) el.setAttribute("aria-label", value);
  }
}

function applyFields() {
  for (const el of $$("[data-field]")) {
    const [group, key] = el.dataset.field.split(".");
    const value = state[group]?.[key];
    if (value) el.textContent = value;
  }
}

/* ------------------------------------------------------------------
   Kontak: daftar tautan dipakai di hero dan bagian kontak
------------------------------------------------------------------- */
function contactLinks(contact) {
  const handle = url => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "").split("/").pop();
  return [
    contact.LINKEDIN && { label: "LinkedIn", href: contact.LINKEDIN, icon: "linkedin.png", detail: handle(contact.LINKEDIN) },
    contact.GITHUB && { label: "GitHub", href: contact.GITHUB, icon: "github.png", detail: handle(contact.GITHUB) },
    contact.INSTAGRAM && { label: "Instagram", href: contact.INSTAGRAM, icon: "instagram.png", detail: `@${handle(contact.INSTAGRAM)}` },
    contact.WHATSAPP && { label: "WhatsApp", href: `https://wa.me/${contact.WHATSAPP.replace(/\D/g, "")}`, icon: "whatsapp.png", detail: `+${contact.WHATSAPP.replace(/\D/g, "")}` },
  ].filter(Boolean);
}

const socialList = (contact, cls) => h("ul", { class: cls }, [
  contact.EMAIL && { label: "Email", href: `mailto:${contact.EMAIL}`, icon: "email.png" },
  ...contactLinks(contact),
].filter(Boolean).map(link =>
  h("li", {}, h("a", { href: link.href, ...(link.href.startsWith("http") ? external : {}), "aria-label": link.label, title: link.label },
    h("img", { src: `assets/contact/${link.icon}`, alt: "", width: 20, height: 20 })))));

/* ------------------------------------------------------------------
   Hero: teks pengantar + foto
------------------------------------------------------------------- */
function renderHero(el, [profile, contact]) {
  state.profile = profile;
  state.contact = contact;
  applyFields();

  const [firstName, ...rest] = (profile.NAMA || "").split(" ");
  slotEl("brand").replaceChildren(
    h("span", { class: "brand-mark", "aria-hidden": "true", text: (firstName || "F").charAt(0) }),
    h("span", { class: "brand-name" }, firstName, rest.length ? " " : "", rest.length ? h("span", { text: rest.join(" ") }) : ""));

  el.replaceChildren(
    h("p", { class: "eyebrow hero-step", text: profile.EYEBROW || profile.PERAN || "" }),
    h("h1", { class: "hero-title hero-step", id: "hero-title" },
      h("span", { text: firstName }), rest.length ? " " : "", rest.length ? h("span", { class: "accent", text: rest.join(" ") }) : ""),
    profile.HEADLINE && h("p", { class: "hero-headline hero-step", text: profile.HEADLINE }),
    profile.INTRO && h("p", { class: "hero-intro hero-step", text: profile.INTRO }),
    h("div", { class: "hero-actions hero-step" },
      h("a", { class: "btn btn-primary", href: "#projects" }, t("HERO_CTA"), svgIcon(ICON.arrow)),
      profile.CV
        ? h("a", { class: "btn btn-ghost", href: profile.CV, download: true }, svgIcon(ICON.doc), t("CV"))
        : h("a", { class: "btn btn-ghost", href: "#contact" }, t("HERO_CONTACT"))),
    h("div", { class: "hero-meta hero-step" }, socialList(contact, "social-row")));

  renderPhoto(slotEl("profile"), profile);
}

function renderPhoto(el, profile) {
  const photo = h("div", { class: profile.FOTO ? "photo has-img" : "photo" });
  if (profile.FOTO) {
    photo.append(
      h("span", { class: "photo-grid", "aria-hidden": "true" }),
      h("span", { class: "photo-ring", "aria-hidden": "true" }),
      h("span", { class: "photo-arch", "aria-hidden": "true" }),
      h("img", { src: profile.FOTO, alt: profile.FOTO_ALT || profile.NAMA, width: 720, height: 720, fetchpriority: "high", decoding: "async" }),
      h("span", { class: "photo-line", "aria-hidden": "true" }));
    // Kedalaman halus: lapisan bergeser beberapa piksel mengikuti mouse (hanya mouse, mati jika gerak dikurangi)
    if (matchMedia("(hover: hover) and (pointer: fine)").matches && !reducedMotion()) {
      const hero = $(".hero") || document.body;
      let raf = 0;
      hero.addEventListener("pointermove", e => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const r = photo.getBoundingClientRect();
          const dx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width * 1.5)));
          const dy = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height * 1.5)));
          photo.style.setProperty("--px", `${(dx * 6).toFixed(1)}px`);
          photo.style.setProperty("--py", `${(dy * 4).toFixed(1)}px`);
        });
      });
      hero.addEventListener("pointerleave", () => { photo.style.setProperty("--px", "0px"); photo.style.setProperty("--py", "0px"); });
    }
  } else {
    photo.append(h("span", { class: "photo-initials", "aria-hidden": "true", text: profile.INISIAL || "" }));
  }
  el.replaceChildren(photo, profile.FOTO ? "" : h("p", { class: "photo-note", text: t("PHOTO_PENDING") }));
}

function renderAbout(el, about) {
  el.replaceChildren(...(about.TEKS ? paragraphs(about.TEKS) : [emptyBox()]));
}

function renderEducation(el, entries) {
  if (!entries.length) return el.replaceChildren(emptyBox());
  el.replaceChildren(h("ul", { class: "edu-list" }, entries.map(e =>
    h("li", { class: "edu" },
      h("span", { class: "edu-mark", "aria-hidden": "true" }),
      h("div", {},
        h("p", { class: "entry-title", text: e.INSTITUSI }),
        h("p", { class: "muted", text: e.PROGRAM }),
        h("p", { class: "meta", text: e.PERIODE }),
        e.KETERANGAN && h("p", { class: "muted", text: e.KETERANGAN }),
        e.IPK && h("p", { class: "gpa", text: `${e.IPK} GPA` }))))));
}

const proofLink = e => e.LINK && h("a", { class: "text-link small-link", href: e.LINK, ...(e.LINK.startsWith("#") ? {} : external) }, t("EVIDENCE"));

function renderAchievementsPreview(el, entries) {
  if (!entries.length) return el.replaceChildren(emptyBox());
  el.replaceChildren(h("ul", { class: "highlight-list" }, entries.slice(0, 3).map(e =>
    h("li", {},
      h("p", { class: "entry-title", text: e.JUDUL }),
      h("p", { class: "meta", text: [e.PENYELENGGARA, e.TAHUN].filter(Boolean).join(" · ") })))));
}

function renderAchievements(el, entries) {
  if (!entries.length) return el.replaceChildren(emptyBox());
  el.replaceChildren(h("ol", { class: "timeline" }, entries.map(e =>
    h("li", { class: "timeline-item reveal" },
      e.TAHUN && h("p", { class: "timeline-year", text: e.TAHUN }),
      h("p", { class: "entry-title", text: e.JUDUL }),
      e.PENYELENGGARA && h("p", { class: "muted", text: e.PENYELENGGARA }),
      e.KETERANGAN && h("p", { class: "timeline-note", text: e.KETERANGAN }),
      proofLink(e)))));
}

/* ------------------------------------------------------------------
   Technical skills (berkelompok) + filter proyek
------------------------------------------------------------------- */
function countTools(projects) {
  const counts = new Map();
  for (const project of projects) {
    if (project.error) continue;
    for (const tool of new Set(splitList(project.TOOLS).map(norm))) counts.set(tool, (counts.get(tool) || 0) + 1);
  }
  return counts;
}

const GROUP_ORDER = ["komputasi", "perangkat-statistik", "analitik", "pengembangan", "produktivitas", "lainnya"];
const groupLabel = key => t(`SKILL_GROUP_${key.toUpperCase().replace(/-/g, "_")}`, {}, key);

function renderTools(el, { tools, projects, more }) {
  const list = tools.filter(tool => tool.NAMA);
  if (!list.length) return el.replaceChildren(emptyBox());
  const counts = countTools([...projects, ...more]);

  const groups = new Map();
  for (const tool of list) {
    const key = norm(tool.GRUP || "") || "lainnya";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(tool);
  }
  const keys = [...groups.keys()].sort((a, b) => {
    const ia = GROUP_ORDER.indexOf(a), ib = GROUP_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });

  const item = tool => {
    const n = counts.get(norm(tool.NAMA)) || 0;
    const icon = tool.IKON
      ? h("img", { src: tool.IKON, alt: "", width: 28, height: 28, loading: "lazy" })
      : h("span", { class: "monogram", "aria-hidden": "true", text: tool.NAMA.slice(0, 3) });
    const inner = [h("span", { class: "tech-icon" }, icon), h("span", { class: "tech-name", text: tool.NAMA }),
      n > 0 && h("span", { class: "tech-count", "aria-hidden": "true", text: n })];
    const countLabel = n === 1 ? t("TOOLS_COUNT_ONE") : t("TOOLS_COUNT", { n });
    return h("li", {}, n > 0
      ? h("button", { class: "tech-item is-used", type: "button", dataset: { tool: norm(tool.NAMA) }, "aria-label": `${tool.NAMA}, ${countLabel}`, "aria-pressed": "false", onclick: () => toggleFilter(tool.NAMA) }, inner)
      : h("div", { class: "tech-item" }, inner));
  };

  el.replaceChildren(h("div", { class: "skill-groups", role: "group", "aria-label": t("SKILLS_FILTER_LABEL") }, keys.map(key =>
    h("div", { class: "skill-group" },
      h("p", { class: "skill-group-title", text: groupLabel(key) }),
      h("ul", { class: "tech-grid" }, groups.get(key).map(item))))));
  applyFilter();
}

function toggleFilter(name) {
  const same = state.filter && norm(state.filter) === norm(name);
  state.filter = same ? null : name;
  applyFilter();
  if (!same) $("#projects").scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
}

function applyFilter() {
  const key = state.filter ? norm(state.filter) : null;
  const cat = state.category;
  const items = $$("[data-project-tools]");
  let shown = 0;
  for (const item of items) {
    const toolMatch = !key || item.dataset.projectTools.split("|").includes(key);
    const catMatch = !cat || !item.dataset.category || item.dataset.category === cat;
    const match = toolMatch && catMatch;
    const wasHidden = item.hidden;
    item.hidden = !match;
    if (match) {
      shown++;
      if (wasHidden && !reducedMotion()) { item.classList.remove("is-filtered-in"); void item.offsetWidth; item.classList.add("is-filtered-in"); }
    }
    for (const chip of $$("[data-chip]", item)) chip.classList.toggle("is-match", Boolean(key) && chip.dataset.chip === key);
  }
  for (const button of $$(".tech-item[data-tool]")) button.setAttribute("aria-pressed", String(button.dataset.tool === key));
  for (const button of $$("[data-category-filter]")) button.setAttribute("aria-pressed", String((button.dataset.categoryFilter || null) === (cat || null)));

  const status = $("#filter-status");
  status.hidden = !key;
  const toolItems = items.filter(i => !i.dataset.category || !cat || i.dataset.category === cat);
  $("#filter-text").textContent = key ? t("FILTER_STATUS_TOOL", { n: shown, total: toolItems.length, tool: state.filter }) : "";
  for (const slot of ["projects", "more"]) {
    const el = slotEl(slot);
    const own = $$("[data-project-tools]", el);
    const visible = own.some(item => !item.hidden);
    let empty = $(".filter-empty", el);
    if ((key || cat) && !visible && own.length) {
      if (!empty) el.append(empty = h("p", { class: "state state-empty filter-empty" }));
      empty.textContent = t("FILTER_EMPTY");
    } else empty?.remove();
  }
}

/* ------------------------------------------------------------------
   Media proyek: gambar utama + galeri kecil, dan lightbox
------------------------------------------------------------------- */
function mediaPlaceholder() {
  return h("div", { class: "media media-empty" }, h("div", { class: "media-placeholder" }, h("span", { text: t("IMAGE_PENDING") })));
}

// Gambar utama besar (rasio asli dijaga dengan object-fit: contain) + thumbnail bila gambar > 1.
function mediaGallery(images, { lazy = true } = {}) {
  if (!images.length) return mediaPlaceholder();
  const items = images.map(img => ({ type: "image", src: img.src, alt: img.alt }));
  let current = 0;
  const mainImg = h("img", { src: images[0].src, alt: images[0].alt, loading: lazy ? "lazy" : null, decoding: "async" });
  const main = h("button", {
    class: "media-main", type: "button", "aria-label": `${t("IMAGE_ZOOM")}: ${images[0].alt}`,
    onclick: e => openLightbox(items, current, e.currentTarget),
  }, mainImg, h("span", { class: "media-zoom", "aria-hidden": "true" }, svgIcon("M15 3h6v6M21 3l-7 7M9 21H3v-6M3 21l7-7")));
  const thumbs = images.length > 1 && h("div", { class: "media-thumbs", role: "group" }, images.map((img, i) =>
    h("button", {
      class: "media-thumb", type: "button", "aria-label": t("IMAGE_SHOW", { i: i + 1 }), "aria-pressed": String(i === 0),
      onclick: () => {
        current = i;
        mainImg.src = img.src; mainImg.alt = img.alt;
        main.setAttribute("aria-label", `${t("IMAGE_ZOOM")}: ${img.alt}`);
        $$(".media-thumb", thumbs).forEach((b, k) => b.setAttribute("aria-pressed", String(k === i)));
      },
    }, h("img", { src: img.src, alt: "", loading: "lazy", decoding: "async" }))));
  return h("div", { class: "media" }, main, thumbs);
}

const lightbox = { items: [], index: 0 };

function openLightbox(items, index, trigger) {
  lightbox.items = items;
  lightbox.index = index;
  renderLightbox();
  openDialog($("#lightbox"), trigger);
}

function setZoom(on) {
  const stage = $("#lightbox-stage");
  const button = $("#lightbox-zoom");
  stage.classList.toggle("is-zoomed", on);
  button.setAttribute("aria-pressed", String(on));
  button.setAttribute("aria-label", t(on ? "ZOOM_OUT" : "ZOOM_IN", {}, on ? "Perkecil" : "Perbesar"));
}

function renderLightbox() {
  const item = lightbox.items[lightbox.index];
  const stage = $("#lightbox-stage");
  const many = lightbox.items.length > 1;
  stage.replaceChildren(item.type === "pdf"
    ? h("iframe", { src: item.src, title: item.alt })
    : h("img", { src: item.src, alt: item.alt, onclick: () => setZoom(!stage.classList.contains("is-zoomed")) }));
  setZoom(false);
  $("#lightbox-caption").textContent = item.alt;
  $("#lightbox-count").textContent = many ? `${lightbox.index + 1} / ${lightbox.items.length}` : "";
  $("#lightbox-zoom").hidden = item.type === "pdf";
  $("#lightbox-prev").hidden = !many;
  $("#lightbox-next").hidden = !many;
}

function stepLightbox(delta) {
  if (lightbox.items.length < 2) return;
  lightbox.index = (lightbox.index + delta + lightbox.items.length) % lightbox.items.length;
  renderLightbox();
}

/* ------------------------------------------------------------------
   Proyek unggulan: studi kasus editorial
------------------------------------------------------------------- */
async function loadProjects() {
  const [tools, projects, more] = await Promise.all([all("tools.txt"), loadList("PROYEK", "projects"), loadList("PROYEK_LAINNYA", "more-projects")]);
  return { tools, projects, more };
}

const toolChips = tools => tools.length > 0 &&
  h("ul", { class: "chips" }, tools.map(tool => h("li", { dataset: { chip: norm(tool) }, text: tool })));

function projectActions(project, { detail = true } = {}) {
  return h("div", { class: "actions" },
    detail && h("button", { class: "btn btn-primary btn-sm", type: "button", onclick: e => openProject(project, e.currentTarget) }, svgIcon(ICON.doc), t("PROJECT_DETAIL")),
    project.LINK_DEMO && h("a", { class: "btn btn-ghost btn-sm", href: project.LINK_DEMO, ...external }, project.LABEL_DEMO || t("PROJECT_DEMO"), svgIcon(ICON.external)),
    project.LINK_REPO && h("a", { class: "text-link", href: project.LINK_REPO, ...external }, svgIcon(ICON.github), t("PROJECT_REPO")),
    project.LINK_LAPORAN && h("a", { class: "text-link", href: project.LINK_LAPORAN, ...external }, t("PROJECT_REPORT")));
}

function featureRow(project, index) {
  if (project.error) {
    return h("article", { class: "feature", dataset: { projectTools: "" } }, errorBox(project.error, () => renderAllContent()));
  }
  const tools = splitList(project.TOOLS);
  const results = listOf(project.HASIL);
  const meta = [
    project.TUJUAN && [t("PROJECT_GOAL"), project.TUJUAN],
    project.TEKNIK && [t("PROJECT_TECHNIQUE"), project.TEKNIK],
  ].filter(Boolean);

  return h("article", { class: "feature reveal", dataset: { projectTools: tools.map(norm).join("|") }, "aria-labelledby": `p-${project.slug}` },
    h("div", { class: "feature-media" }, mediaGallery(parseImages(project.GAMBAR))),
    h("div", { class: "feature-body" },
      h("p", { class: "feature-kicker" },
        h("span", { class: "feature-num", text: pad2(index + 1) }),
        h("span", { text: [project.SUBJUDUL, project.TAHUN].filter(Boolean).join(" · ") })),
      h("h3", { id: `p-${project.slug}`, class: "feature-title", text: project.JUDUL }),
      project.RINGKASAN && h("p", { class: "feature-desc", text: project.RINGKASAN.split("\n\n")[0] }),
      (meta.length > 0 || tools.length > 0) && h("dl", { class: "meta-list" },
        meta.map(([label, value]) => h("div", {}, h("dt", { text: label }), h("dd", { text: value }))),
        tools.length > 0 && h("div", {}, h("dt", { text: t("PROJECT_TOOLS") }), h("dd", {}, toolChips(tools)))),
      results.length > 0 && h("div", { class: "feature-results" },
        h("p", { class: "label", text: t("PROJECT_HIGHLIGHTS") }),
        h("ul", { class: "result-list" }, results.slice(0, 2).map(r => h("li", { text: r })))),
      projectActions(project)));
}

function renderProjects(el, { projects }) {
  el.replaceChildren(...(projects.length ? projects.map(featureRow) : [emptyBox()]));
  applyFilter();
}

function openProject(project, trigger) {
  const dialog = $("#project-dialog");
  const tools = splitList(project.TOOLS);
  const results = listOf(project.HASIL);
  const pending = () => h("p", { class: "muted", text: t("PROJECT_PENDING") });

  $("#project-dialog-kicker").textContent = [project.SUBJUDUL, project.TAHUN].filter(Boolean).join(" · ");
  $("#project-dialog-title").textContent = project.JUDUL;
  $("#project-dialog-body").replaceChildren(
    mediaGallery(parseImages(project.GAMBAR)),
    (project.TEKNIK || tools.length > 0) && h("dl", { class: "meta-list sheet-meta" },
      project.TEKNIK && h("div", {}, h("dt", { text: t("PROJECT_TECHNIQUE") }), h("dd", { text: project.TEKNIK })),
      tools.length > 0 && h("div", {}, h("dt", { text: t("PROJECT_TOOLS") }), h("dd", {}, toolChips(tools)))),
    h("section", {}, h("h3", { text: t("PROJECT_SUMMARY") }), ...(project.RINGKASAN ? paragraphs(project.RINGKASAN) : [pending()])),
    h("section", {}, h("h3", { text: t("PROJECT_METHOD") }), ...(project.METODE ? paragraphs(project.METODE) : [pending()])),
    h("section", {}, h("h3", { text: t("PROJECT_RESULTS") }),
      results.length ? h("ul", { class: "result-list" }, results.map(r => h("li", { text: r }))) : pending()),
    project.KONTRIBUSI && h("section", {}, h("h3", { text: t("PROJECT_CONTRIBUTION") }), ...paragraphs(project.KONTRIBUSI)),
    (project.LINK_REPO || project.LINK_DEMO) && projectActions(project, { detail: false }));
  openDialog(dialog, trigger);
  dialog.scrollTop = 0;
}

/* ------------------------------------------------------------------
   Proyek lainnya: galeri kartu + filter kategori
------------------------------------------------------------------- */
function moreCard(project) {
  if (project.error) return h("article", { class: "more-card", dataset: { projectTools: "" } }, errorBox(project.error, () => renderAllContent()));
  const tools = splitList(project.TOOLS);
  const images = parseImages(project.THUMBNAIL || project.GAMBAR);
  const cat = project.KATEGORI ? norm(project.KATEGORI) : "";
  const results = listOf(project.HASIL);
  return h("article", { class: "more-card reveal", dataset: { projectTools: tools.map(norm).join("|"), category: cat || null }, "aria-labelledby": `m-${project.slug}` },
    images.length
      ? h("button", { class: "more-thumb", type: "button", "aria-label": `${t("IMAGE_ZOOM")}: ${images[0].alt || project.JUDUL}`,
        onclick: e => openLightbox(images.map(i => ({ type: "image", src: i.src, alt: i.alt || project.JUDUL })), 0, e.currentTarget) },
      h("img", { src: images[0].src, alt: images[0].alt || "", loading: "lazy", decoding: "async" }))
      : h("div", { class: "more-thumb more-thumb-empty", "aria-hidden": "true" }, h("span", { text: (project.JUDUL || "?").slice(0, 2) })),
    h("div", { class: "more-body" },
      (project.KATEGORI || project.TAHUN) && h("p", { class: "meta", text: [project.KATEGORI, project.TAHUN].filter(Boolean).join(" · ") }),
      h("h3", { id: `m-${project.slug}`, text: project.JUDUL }),
      project.RINGKASAN
        ? h("p", { class: "more-desc", text: project.RINGKASAN.split("\n\n")[0] })
        : results.length > 0 && h("ul", { class: "result-list" }, results.slice(0, 2).map(r => h("li", { text: r }))),
      project.TEKNIK && h("p", { class: "more-method" }, h("strong", { text: `${t("PROJECT_TECHNIQUE")}: ` }), project.TEKNIK),
      toolChips(tools)),
    (project.LINK_REPO || project.LINK_DEMO || project.LINK_LAPORAN) && h("div", { class: "more-foot" }, projectActions(project, { detail: false })));
}

function renderMore(el, { more }) {
  const filters = slotEl("more-filters");
  if (!more.length) {
    filters.hidden = true;
    el.replaceChildren(h("div", { class: "more-empty" },
      h("span", { class: "more-empty-mark", "aria-hidden": "true" }),
      h("p", { text: t("MORE_EMPTY") })));
    return;
  }
  // Tombol kategori hanya muncul jika data proyek benar-benar punya 2+ kategori.
  const cats = [...new Map(more.filter(p => p.KATEGORI).map(p => [norm(p.KATEGORI), p.KATEGORI.trim()])).entries()];
  if (cats.length > 1) {
    filters.hidden = false;
    filters.replaceChildren(h("div", { class: "seg", role: "group", "aria-label": t("MORE_FILTER_LABEL") },
      h("button", { type: "button", dataset: { categoryFilter: "" }, "aria-pressed": "true", onclick: () => { state.category = null; applyFilter(); } }, t("FILTER_ALL")),
      cats.map(([key, label]) => h("button", { type: "button", dataset: { categoryFilter: key }, "aria-pressed": "false",
        onclick: () => { state.category = key; applyFilter(); } },
      label, h("span", { class: "seg-count", text: more.filter(p => p.KATEGORI && norm(p.KATEGORI) === key).length })))));
  } else {
    filters.hidden = true;
  }
  el.replaceChildren(...more.map(moreCard));
  applyFilter();
}

/* ------------------------------------------------------------------
   Riset & publikasi: daftar bernomor
------------------------------------------------------------------- */
function renderPublications(el, pubs) {
  if (!pubs.length) return el.replaceChildren(emptyBox());
  const me = norm((state.profile.NAMA || "Febrianggi").split(" ")[0]);
  el.replaceChildren(h("ol", { class: "pub-items" }, pubs.map((pub, index) => {
    if (pub.error) return h("li", { class: "pub" }, errorBox(pub.error, () => renderAllContent()));
    const published = norm(pub.STATUS || "terbit") !== "proses";
    const type = norm(pub.JENIS || "");
    const isBook = type.startsWith("buku") || type === "book";
    const authors = splitList(pub.PENULIS).map((name, i, list) => [
      norm(name).includes(me) ? h("strong", { text: name }) : name, i < list.length - 1 ? ", " : ""]);
    return h("li", { class: `pub reveal${pub.SAMPUL ? " pub-with-cover" : ""}` },
      h("p", { class: "pub-num", "aria-hidden": "true", text: pad2(index + 1) }),
      h("article", { class: "pub-main", "aria-labelledby": `pub-${pub.slug}` },
        h("p", { class: "pub-meta" },
          h("span", { class: `status ${published ? "is-published" : "is-progress"}`, text: t(published ? "PUB_PUBLISHED" : "PUB_IN_PROGRESS") }),
          [pub.JENIS, pub.TANGGAL].filter(Boolean).map(v => h("span", { class: "muted", text: v }))),
        h("h3", { id: `pub-${pub.slug}`, text: pub.JUDUL }),
        authors.length > 0 && h("p", { class: "authors" }, authors.flat()),
        pub.WADAH && h("p", { class: "venue", text: pub.WADAH }),
        pub.RINGKASAN && h("p", { class: "summary", text: pub.RINGKASAN }),
        (pub.LINK || pub.DOI) && h("div", { class: "actions" },
          pub.LINK && h("a", { class: "text-link", href: pub.LINK, ...external }, t(isBook ? "PUB_BOOK" : "PUB_READ"), svgIcon(ICON.external)),
          pub.DOI && h("a", { class: "text-link", href: `https://doi.org/${pub.DOI}`, ...external }, `doi.org/${pub.DOI}`))),
      pub.SAMPUL && h("button", {
        class: "pub-cover", type: "button", "aria-label": `${t("IMAGE_ZOOM")}: ${pub.SAMPUL_ALT || pub.JUDUL}`,
        onclick: e => openLightbox([{ type: "image", src: pub.SAMPUL, alt: pub.SAMPUL_ALT || pub.JUDUL }], 0, e.currentTarget),
      }, h("img", { src: pub.SAMPUL, alt: pub.SAMPUL_ALT || pub.JUDUL, loading: "lazy", width: 700, height: 990 })));
  })));
}

/* ------------------------------------------------------------------
   Sertifikat: carousel 3D (tanpa autoplay)
------------------------------------------------------------------- */
function renderCertificates(el, certs) {
  if (!certs.length) return el.replaceChildren(emptyBox());
  state.certIndex = Math.min(state.certIndex, certs.length - 1);

  const cards = certs.map((cert, i) => {
    const media = cert.GAMBAR
      ? h("button", {
        class: "cert-media", type: "button", "aria-label": `${t("IMAGE_ZOOM")}: ${cert.JUDUL}`,
        onclick: e => openLightbox([{ type: "image", src: cert.GAMBAR, alt: cert.JUDUL }], 0, e.currentTarget),
      }, h("img", { src: cert.GAMBAR, alt: cert.JUDUL, loading: "lazy", draggable: "false" }))
      : h("div", { class: "cert-media cert-placeholder" },
        h("span", { class: "cert-seal", "aria-hidden": "true" }),
        h("span", { text: t("CERT_PENDING") }));
    return h("article", { class: "cert-card", dataset: { index: i }, "aria-roledescription": "slide", "aria-label": t("CERT_COUNTER", { i: i + 1, n: certs.length }) },
      media,
      h("div", { class: "cert-info" },
        h("h4", { text: cert.JUDUL }),
        h("p", { class: "meta", text: [cert.PENERBIT, cert.TAHUN].filter(Boolean).join(" · ") }),
        (cert.LINK || cert.PDF) && h("div", { class: "actions" },
          cert.LINK && h("a", { class: "btn btn-ghost btn-sm", href: cert.LINK, ...external }, t("CERT_VIEW")),
          cert.PDF && h("button", { class: "btn btn-ghost btn-sm", type: "button", onclick: e => openLightbox([{ type: "pdf", src: cert.PDF, alt: cert.JUDUL }], 0, e.currentTarget) }, t("CERT_PDF")))));
  });

  const multiple = certs.length > 1;
  const carousel = h("div", {
    class: "cert-carousel", role: "region", "aria-roledescription": "carousel", "aria-label": t("CERTIFICATES_TITLE"), tabindex: multiple ? "0" : null,
    onkeydown: e => {
      if (e.target.closest(".cert-card") && e.target !== e.currentTarget && e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      if (e.key === "ArrowRight") { e.preventDefault(); selectCert(state.certIndex + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); selectCert(state.certIndex - 1); }
    },
  }, h("div", { class: "cert-stage" }, cards),
  multiple && h("div", { class: "cert-controls" },
    h("button", { class: "icon-btn", type: "button", "aria-label": t("CERT_PREV"), onclick: () => selectCert(state.certIndex - 1) }, svgIcon("M15 5l-7 7 7 7")),
    h("span", { class: "cert-count", "aria-live": "polite" }),
    h("button", { class: "icon-btn", type: "button", "aria-label": t("CERT_NEXT"), onclick: () => selectCert(state.certIndex + 1) }, svgIcon("M9 5l7 7-7 7"))),
  multiple && h("div", { class: "cert-dots" }, certs.map((_, i) =>
    h("button", { type: "button", class: "dot", "aria-label": t("CERT_PICK", { i: i + 1 }), onclick: () => selectCert(i) }))));

  // Geser (swipe/drag) di area kartu; klik tetap membuka pratinjau
  let startX = null;
  const stage = $(".cert-stage", carousel);
  stage.addEventListener("pointerdown", e => { startX = e.clientX; });
  stage.addEventListener("pointerup", e => {
    if (startX == null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 48) selectCert(state.certIndex + (dx < 0 ? 1 : -1));
  });
  stage.addEventListener("click", e => {
    const card = e.target.closest(".cert-card");
    if (card && card.dataset.pos !== "center") { e.preventDefault(); e.stopPropagation(); selectCert(Number(card.dataset.index)); }
  }, true);

  el.replaceChildren(carousel);
  selectCert(state.certIndex);
}

function selectCert(index) {
  const cards = $$(".cert-card");
  if (!cards.length) return;
  const n = cards.length;
  state.certIndex = (index + n) % n;
  cards.forEach((card, i) => {
    let offset = i - state.certIndex;
    if (n > 2) { if (offset > n / 2) offset -= n; if (offset < -n / 2) offset += n; }
    card.dataset.pos = offset === 0 ? "center" : offset === -1 ? "left" : offset === 1 ? "right" : "hidden";
    // Kartu samping tetap bisa diklik untuk memilihnya, tetapi isinya tidak bisa difokus
    for (const f of $$("button, a", card)) f.tabIndex = offset === 0 ? 0 : -1;
    card.setAttribute("aria-hidden", String(offset !== 0));
  });
  $$(".cert-dots .dot").forEach((dot, i) => dot.setAttribute("aria-current", String(i === state.certIndex)));
  const counter = $(".cert-count");
  if (counter) counter.textContent = t("CERT_COUNTER", { i: state.certIndex + 1, n });
}

/* ------------------------------------------------------------------
   Kontak
------------------------------------------------------------------- */
function renderContact(el, contact) {
  const email = contact.EMAIL;
  el.replaceChildren(
    h("div", { class: "contact-lead" }, paragraphs(contact.AJAKAN)),
    email && h("div", { class: "contact-email" },
      h("a", { class: "btn btn-primary btn-lg", href: `mailto:${email}` }, svgIcon(ICON.mail), t("EMAIL_ME")),
      h("button", { class: "btn btn-ghost btn-lg", type: "button", dataset: { copyEmail: "" } }, svgIcon(ICON.copy), t("COPY_EMAIL")),
      h("p", { class: "contact-address", text: email })),
    h("ul", { class: "contact-links" }, contactLinks(contact).map(link => h("li", {},
      h("a", { class: "contact-link", href: link.href, ...external },
        h("img", { src: `assets/contact/${link.icon}`, alt: "", width: 24, height: 24 }),
        h("span", {}, h("span", { class: "contact-label", text: link.label }), h("span", { class: "contact-detail", text: link.detail })))))));
}

/* ------------------------------------------------------------------
   Render semua konten
------------------------------------------------------------------- */
async function renderAllContent() {
  document.documentElement.lang = state.lang;
  state.ui = await first("ui.txt").catch(() => ({}));
  applyUI();
  setZoom(false);

  await Promise.all([
    fill("hero", () => Promise.all([first("profile.txt"), first("contact.txt")]), renderHero),
    fill("about", () => first("about.txt"), renderAbout),
    fill("education", () => all("education.txt"), renderEducation),
    fill("achievements-preview", () => all("achievements.txt"), renderAchievementsPreview),
    fill("achievements", () => all("achievements.txt"), renderAchievements),
    fill("projects", loadProjects, renderProjects),
    fill("more", loadProjects, renderMore),
    fill("tools", loadProjects, renderTools),
    fill("publications", () => loadList("PUBLIKASI", "publications"), renderPublications),
    fill("certificates", () => all("certificates.txt"), renderCertificates),
    fill("contact", () => first("contact.txt"), renderContact),
  ]);
  slotEl("profile")?.removeAttribute("aria-busy");
  applyFilter();
  if (state.profile.NAMA) document.title = `${state.profile.NAMA} · ${state.profile.JUDUL_HALAMAN || ""}`.replace(/ · $/, "");
  document.documentElement.classList.add("is-loaded");
}

/* ------------------------------------------------------------------
   Dialog (detail proyek + lightbox)
------------------------------------------------------------------- */
const triggers = new WeakMap();

function openDialog(dialog, trigger) {
  triggers.set(dialog, trigger);
  if (!dialog.open) dialog.showModal();
}

function setupDialogs() {
  for (const dialog of $$("dialog")) {
    dialog.addEventListener("close", () => {
      if (dialog.id === "lightbox") $("#lightbox-stage").replaceChildren(); // hentikan iframe PDF
      const trigger = triggers.get(dialog);
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    });
    dialog.addEventListener("click", event => {
      if (event.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      const outside = event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom;
      if (outside || dialog.id === "lightbox") dialog.close();
    });
    for (const button of $$("[data-close]", dialog)) button.addEventListener("click", () => dialog.close());
  }

  $("#lightbox-prev").addEventListener("click", () => stepLightbox(-1));
  $("#lightbox-next").addEventListener("click", () => stepLightbox(1));
  $("#lightbox-zoom").addEventListener("click", () => setZoom(!$("#lightbox-stage").classList.contains("is-zoomed")));
  $("#lightbox").addEventListener("keydown", event => {
    if (event.key === "ArrowLeft") stepLightbox(-1);
    if (event.key === "ArrowRight") stepLightbox(1);
  });
}

/* ------------------------------------------------------------------
   Salin email + toast
------------------------------------------------------------------- */
let toastTimer;
function toast(message, duration = 2600) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-visible"), duration);
}

function legacyCopy(text) {
  const area = h("textarea", { readonly: true, style: "position:fixed;opacity:0;pointer-events:none" });
  area.value = text;
  document.body.append(area);
  area.select();
  let ok = false;
  try { ok = document.execCommand("copy"); } catch { ok = false; }
  area.remove();
  return ok;
}

async function copyEmail() {
  const email = state.contact.EMAIL;
  if (!email) return;
  try {
    await navigator.clipboard.writeText(email);
    toast(t("TOAST_COPIED", {}, "Email berhasil disalin!"));
  } catch {
    if (legacyCopy(email)) toast(t("TOAST_COPIED", {}, "Email berhasil disalin!"));
    else toast(t("TOAST_COPY_FAIL", { email }), 6000);
  }
}

/* ------------------------------------------------------------------
   Cahaya teal pengikut kursor (lerp + requestAnimationFrame)
------------------------------------------------------------------- */
function setupCursorGlow() {
  const glow = $(".cursor-glow");
  const capable = matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
  const target = { x: 0, y: 0 };
  const pos = { x: 0, y: 0 };
  let frame = 0;
  let visible = false;

  const tick = () => {
    pos.x += (target.x - pos.x) * 0.12;
    pos.y += (target.y - pos.y) * 0.12;
    glow.style.transform = `translate3d(${pos.x - 260}px, ${pos.y - 260}px, 0)`;
    frame = Math.abs(target.x - pos.x) + Math.abs(target.y - pos.y) > 0.5 ? requestAnimationFrame(tick) : 0;
  };
  const onMove = event => {
    if (event.pointerType && event.pointerType !== "mouse") return;
    target.x = event.clientX;
    target.y = event.clientY;
    if (!visible) {
      pos.x = target.x; pos.y = target.y;
      visible = true;
      glow.classList.add("is-visible");
    }
    if (!frame) frame = requestAnimationFrame(tick);
  };
  const onLeave = event => {
    if (event.relatedTarget) return;
    visible = false;
    glow.classList.remove("is-visible");
  };
  const sync = () => {
    if (capable.matches) {
      addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("mouseout", onLeave);
    } else {
      removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseout", onLeave);
      cancelAnimationFrame(frame);
      frame = 0;
      visible = false;
      glow.classList.remove("is-visible");
    }
  };
  capable.addEventListener("change", sync);
  sync();
}

/* ------------------------------------------------------------------
   Header: menu mobile, bagian aktif, status setelah scroll, tombol ke atas
------------------------------------------------------------------- */
function setupHeader() {
  const header = $(".site-header");
  const toggle = $(".menu-toggle");
  const nav = $("#site-nav");
  const setOpen = open => {
    toggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
    header.classList.toggle("menu-open", open);
  };
  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
  nav.addEventListener("click", event => { if (event.target.closest("a")) setOpen(false); });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && nav.classList.contains("is-open")) { setOpen(false); toggle.focus(); }
  });
  document.addEventListener("click", event => {
    if (nav.classList.contains("is-open") && !header.contains(event.target)) setOpen(false);
  });
  matchMedia("(min-width: 64rem)").addEventListener("change", () => setOpen(false));

  const toTop = $(".to-top");
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle("is-scrolled", y > 12);
    toTop.hidden = y < innerHeight * 1.2;
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Penanda bagian aktif: bagian yang paling banyak menempati area atas layar
  const links = $$("a[href^='#']", nav);
  const sections = links.map(a => $(a.getAttribute("href"))).filter(Boolean);
  if (!("IntersectionObserver" in window) || !sections.length) return;
  const visible = new Map();
  const io = new IntersectionObserver(entries => {
    for (const entry of entries) visible.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
    let best = null, ratio = 0;
    for (const s of sections) { const r = visible.get(s.id) || 0; if (r > ratio) { ratio = r; best = s.id; } }
    for (const a of links) {
      const on = best && a.getAttribute("href") === `#${best}`;
      a.classList.toggle("is-active", Boolean(on));
      if (on) a.setAttribute("aria-current", "location"); else a.removeAttribute("aria-current");
    }
  }, { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.01, 0.25, 0.5, 1] });
  sections.forEach(s => io.observe(s));
}

/* ------------------------------------------------------------------
   Animasi muncul saat scroll. Konten SELALU terlihat tanpa JS, saat
   gerak dikurangi, atau jika IntersectionObserver tidak tersedia;
   kelas "reveal-ready" baru dipasang setelah observer siap.
------------------------------------------------------------------- */
let revealObserver = null;
function setupReveal() {
  if (reducedMotion() || !("IntersectionObserver" in window)) return;
  revealObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-in");
      revealObserver.unobserve(entry.target);
    }
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  document.documentElement.classList.add("reveal-ready");
  observeReveal(document);
  // Pengaman: apa pun yang belum muncul setelah 4 detik ditampilkan
  setTimeout(() => $$(".reveal:not(.is-in)").forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) el.classList.add("is-in");
  }), 4000);
}

function observeReveal(root) {
  if (!revealObserver) return;
  const items = root.matches?.(".reveal") ? [root] : [];
  items.push(...$$(".reveal:not(.is-in)", root));
  // jeda bertahap untuk elemen bersaudara
  const groups = new Map();
  for (const el of items) {
    const parent = el.parentElement;
    const i = groups.get(parent) || 0;
    groups.set(parent, i + 1);
    el.style.setProperty("--stagger", `${Math.min(i, 5) * 70}ms`);
    revealObserver.observe(el);
  }
}

/* ------------------------------------------------------------------
   Mulai
------------------------------------------------------------------- */
async function boot() {
  $("[data-year]").textContent = new Date().getFullYear();

  setupHeader();
  setupDialogs();
  setupCursorGlow();
  setupReveal();
  $("#filter-clear").addEventListener("click", () => {
    const pressed = $('.tech-item[aria-pressed="true"]');
    state.filter = null;
    applyFilter();
    pressed?.focus({ preventScroll: true });
  });
  document.addEventListener("click", event => {
    if (event.target.closest("[data-copy-email]")) copyEmail();
  });

  try {
    state.manifest = (await load("manifest.txt", "id", { shared: true }))[0] || {};
  } catch (error) {
    console.error(error);
  }
  state.lang = state.manifest.BAHASA_DEFAULT === "id" ? "id" : "en";
  await renderAllContent();
}

boot();
