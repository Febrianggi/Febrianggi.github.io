import { load, splitList, parseImages, ContentError } from "./content.js";

/* ------------------------------------------------------------------
   Utilitas
------------------------------------------------------------------- */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const slotEl = name => $(`[data-slot="${name}"]`);

function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key === "class") el.className = value;
    else if (key === "text") el.textContent = value;
    else if (key === "dataset") Object.assign(el.dataset, value);
    else if (key.startsWith("on")) el.addEventListener(key.slice(2), value);
    else el.setAttribute(key, value === true ? "" : value);
  }
  el.append(...children.flat().filter(c => c != null && c !== false && c !== ""));
  return el;
}

const paragraphs = text => (text || "").split("\n\n").filter(Boolean).map(p => h("p", { text: p }));
const external = { target: "_blank", rel: "noopener noreferrer" };

const state = {
  lang: "id",
  manifest: {},
  ui: {},
  profile: {},
  contact: {},
  projects: [],
  tools: [],
  filter: null,
  certIndex: 0,
};

function t(key, vars = {}, fallback) {
  const template = state.ui[key] ?? fallback ?? key;
  return template.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? vars[name] : match));
}

function getStoredLang() {
  try { return localStorage.getItem("portfolio-lang"); } catch { return null; }
}
function storeLang(lang) {
  try { localStorage.setItem("portfolio-lang", lang); } catch { /* penyimpanan tidak tersedia */ }
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
const emptyBox = () => h("p", { class: "state state-empty", text: t("EMPTY", {}, "Belum ada isi di bagian ini.") });

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
  }
}

const first = file => load(file, state.lang).then(records => records[0] || {});
const all = file => load(file, state.lang);

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
   Hero, tentang, pendidikan, prestasi, kontak
------------------------------------------------------------------- */
function renderHero(el, [profile, contact]) {
  state.profile = profile;
  state.contact = contact;
  applyFields();

  const [firstName, ...rest] = (profile.NAMA || "").split(" ");
  el.replaceChildren(
    h("p", { class: "hero-role", text: profile.PERAN }),
    h("h1", { id: "hero-name", class: "hero-name" },
      h("span", { class: "accent-text", text: firstName }), rest.length ? ` ${rest.join(" ")}` : ""),
    h("div", { class: "hero-intro" }, paragraphs(profile.INTRO)));

  // foto profil atau placeholder inisial
  const portrait = slotEl("portrait");
  const frame = h("div", { class: "portrait-frame" });
  if (profile.FOTO) {
    frame.append(h("img", { src: profile.FOTO, alt: profile.FOTO_ALT || profile.NAMA, width: 800, height: 1000, fetchpriority: "high" }));
    portrait.replaceChildren(frame);
  } else {
    frame.append(h("span", { class: "portrait-initials", "aria-hidden": "true", text: profile.INISIAL || "" }));
    portrait.replaceChildren(frame, h("figcaption", { class: "portrait-note", text: t("PHOTO_PENDING") }));
  }

  const cv = slotEl("cv");
  cv.hidden = !profile.CV;
  if (profile.CV) cv.href = profile.CV;

  for (const button of $$("[data-copy-email]")) button.disabled = !contact.EMAIL;

  const links = [
    contact.GITHUB && ["GitHub", contact.GITHUB, "github.png"],
    contact.LINKEDIN && ["LinkedIn", contact.LINKEDIN, "linkedin.png"],
    contact.INSTAGRAM && ["Instagram", contact.INSTAGRAM, "instagram.png"],
    contact.WHATSAPP && ["WhatsApp", `https://wa.me/${contact.WHATSAPP.replace(/\D/g, "")}`, "whatsapp.png"],
  ].filter(Boolean);
  slotEl("social").replaceChildren(...links.map(([label, href, icon]) =>
    h("li", {}, h("a", { href, ...external },
      h("span", { class: "icon-tile icon-tile-dark" }, h("img", { src: `assets/contact/${icon}`, alt: "", width: 20, height: 20 })),
      label))));
}

function renderAbout(el, about) {
  el.replaceChildren(...(about.TEKS ? paragraphs(about.TEKS) : [emptyBox()]));
}

function renderEducation(el, entries) {
  if (!entries.length) return el.replaceChildren(emptyBox());
  el.replaceChildren(h("ul", { class: "entry-list" }, entries.map(e =>
    h("li", {},
      h("p", { class: "entry-title", text: e.INSTITUSI }),
      h("p", { text: e.PROGRAM }),
      h("p", { class: "mono muted", text: e.PERIODE }),
      e.KETERANGAN && h("p", { class: "muted", text: e.KETERANGAN })))));
}

function renderAchievements(el, entries) {
  if (!entries.length) return el.replaceChildren(emptyBox());
  el.replaceChildren(h("ul", { class: "entry-list" }, entries.map(e =>
    h("li", {},
      h("p", { class: "entry-title", text: e.JUDUL }),
      h("p", { class: "mono muted", text: [e.PENYELENGGARA, e.TAHUN].filter(Boolean).join(" · ") }),
      e.KETERANGAN && h("p", { text: e.KETERANGAN }),
      e.LINK && h("a", { class: "text-link", href: e.LINK, ...external }, t("EVIDENCE"))))));
}

function renderContact(el, contact) {
  const email = contact.EMAIL;
  el.replaceChildren(
    h("div", { class: "contact-lead" }, paragraphs(contact.AJAKAN)),
    email && h("div", { class: "contact-email" },
      h("a", { class: "email-link", href: `mailto:${email}`, text: email }),
      h("button", { class: "btn btn-primary", type: "button", dataset: { copyEmail: "" } }, t("COPY_EMAIL"))),
    h("ul", { class: "contact-links" }, [
      contact.GITHUB && ["GitHub", contact.GITHUB],
      contact.LINKEDIN && ["LinkedIn", contact.LINKEDIN],
      contact.INSTAGRAM && ["Instagram", contact.INSTAGRAM],
      contact.WHATSAPP && ["WhatsApp", `https://wa.me/${contact.WHATSAPP.replace(/\D/g, "")}`],
    ].filter(Boolean).map(([label, href]) =>
      h("li", {}, h("a", { href, ...external }, h("span", { text: label }), h("span", { class: "mono muted", text: href.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "") }))))));
}

/* ------------------------------------------------------------------
   Media proyek (grid 2x2) dan lightbox
------------------------------------------------------------------- */
function mediaGrid(images, { large = false } = {}) {
  if (!images.length) {
    return h("div", { class: "media media-empty" },
      h("div", { class: "media-placeholder" },
        h("span", { text: t("IMAGE_PENDING") })));
  }
  const shown = images.slice(0, 4);
  const items = shown.map(img => ({ type: "image", src: img.src, alt: img.alt }));
  return h("div", { class: `media${large ? " media-large" : ""}`, dataset: { count: shown.length } },
    shown.map((img, i) => h("button", {
      class: "media-item", type: "button",
      "aria-label": `${t("IMAGE_ZOOM")}: ${img.alt}`,
      onclick: event => openLightbox(items, i, event.currentTarget),
    }, h("img", { src: img.src, alt: img.alt, loading: "lazy", decoding: "async" }))));
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
  button.setAttribute("aria-label", t(on ? "ZOOM_OUT" : "ZOOM_IN"));
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
   Proyek + filter tools
------------------------------------------------------------------- */
const norm = s => s.trim().toLowerCase();

async function loadProjects() {
  const slugs = splitList(state.manifest.PROYEK);
  if (!state.manifest.PROYEK) throw new ContentError("content/manifest.txt", "PROYEK");
  const [tools, ...results] = await Promise.all([
    all("tools.txt"),
    ...slugs.map(slug => load(`projects/${slug}.txt`, state.lang)
      .then(r => ({ slug, ...(r[0] || {}) }), error => ({ slug, error }))),
  ]);
  return { tools, projects: results };
}

function projectCard(project) {
  if (project.error) {
    return h("article", { class: "card project-card", dataset: { tools: "" } },
      errorBox(project.error, () => renderAllContent()));
  }
  const tools = splitList(project.TOOLS);
  const images = parseImages(project.GAMBAR);
  return h("article", { class: "card project-card", dataset: { tools: tools.map(norm).join("|") }, "aria-labelledby": `p-${project.slug}` },
    mediaGrid(images),
    h("div", { class: "card-body" },
      project.TAHUN && h("p", { class: "mono muted", text: project.TAHUN }),
      h("h3", { id: `p-${project.slug}`, text: project.JUDUL }),
      project.SUBJUDUL && h("p", { class: "subtitle", text: project.SUBJUDUL }),
      project.RINGKASAN && h("p", { class: "summary", text: project.RINGKASAN.split("\n\n")[0] }),
      tools.length > 0 && h("ul", { class: "chips", "aria-label": t("PROJECT_TOOLS") }, tools.map(tool => h("li", { dataset: { tool: norm(tool) }, text: tool }))),
      h("div", { class: "card-actions" },
        h("button", { class: "btn btn-primary btn-sm", type: "button", onclick: e => openProject(project, e.currentTarget) }, t("PROJECT_DETAIL")),
        project.LINK_REPO && h("a", { class: "btn btn-ghost btn-sm", href: project.LINK_REPO, ...external }, t("PROJECT_REPO")),
        project.LINK_DEMO && h("a", { class: "btn btn-ghost btn-sm", href: project.LINK_DEMO, ...external }, t("PROJECT_DEMO")))));
}

function renderProjects(el, { tools, projects }) {
  state.tools = tools;
  state.projects = projects;

  if (!projects.length) el.replaceChildren(emptyBox());
  else el.replaceChildren(...projects.map(projectCard));

  // tombol filter: hanya tools yang benar-benar dipakai proyek
  const used = new Set(projects.flatMap(p => splitList(p.TOOLS).map(norm)));
  const filterTools = tools.map(tool => tool.NAMA).filter(name => name && used.has(norm(name)));
  for (const name of used) if (!filterTools.some(n => norm(n) === name)) filterTools.push(projects.flatMap(p => splitList(p.TOOLS)).find(n => norm(n) === name));

  const bar = slotEl("filters");
  bar.replaceChildren($("#filter-label", bar) || h("span", { id: "filter-label", class: "filter-label" }),
    h("button", { class: "chip-btn", type: "button", dataset: { filter: "" }, onclick: () => setFilter(null) }, t("FILTER_ALL")),
    ...filterTools.map(name => h("button", { class: "chip-btn", type: "button", dataset: { filter: norm(name) }, onclick: () => setFilter(name) }, name)));
  $("#filter-label").textContent = t("FILTER_LABEL");

  applyFilter();
}

function setFilter(name) {
  state.filter = name;
  applyFilter();
}

function applyFilter() {
  const key = state.filter ? norm(state.filter) : null;
  const cards = $$(".project-card", slotEl("projects"));
  let shown = 0;
  for (const card of cards) {
    const match = !key || card.dataset.tools.split("|").includes(key);
    card.hidden = !match;
    if (match) shown++;
    for (const chip of $$(".chips li", card)) chip.classList.toggle("is-match", Boolean(key) && chip.dataset.tool === key);
  }
  for (const button of $$("[data-filter]", slotEl("filters"))) {
    button.setAttribute("aria-pressed", String(button.dataset.filter === (key || "")));
  }
  const status = $("#filter-status");
  status.textContent = key
    ? t("FILTER_STATUS_TOOL", { n: shown, total: cards.length, tool: state.filter })
    : t("FILTER_STATUS", { n: shown, total: cards.length });
  let empty = $(".filter-empty", slotEl("projects"));
  if (key && !shown) {
    if (!empty) slotEl("projects").append(empty = h("p", { class: "state state-empty filter-empty" }));
    empty.textContent = t("FILTER_EMPTY");
  } else empty?.remove();
}

function openProject(project, trigger) {
  const dialog = $("#project-dialog");
  const tools = splitList(project.TOOLS);
  const results = Array.isArray(project.HASIL) ? project.HASIL : splitList(project.HASIL ? [project.HASIL] : []);
  const pending = () => h("p", { class: "muted", text: t("PROJECT_PENDING") });

  $("#project-dialog-kicker").textContent = [project.SUBJUDUL, project.TAHUN].filter(Boolean).join(" · ");
  $("#project-dialog-title").textContent = project.JUDUL;
  $("#project-dialog-body").replaceChildren(
    mediaGrid(parseImages(project.GAMBAR), { large: true }),
    h("section", {}, h("h3", { text: t("PROJECT_SUMMARY") }), ...(project.RINGKASAN ? paragraphs(project.RINGKASAN) : [pending()])),
    h("section", {}, h("h3", { text: t("PROJECT_METHOD") }), ...(project.METODE ? paragraphs(project.METODE) : [pending()])),
    h("section", {}, h("h3", { text: t("PROJECT_RESULTS") }),
      results.length ? h("ul", { class: "result-list" }, results.map(r => h("li", { text: r }))) : pending()),
    project.KONTRIBUSI && h("section", {}, h("h3", { text: t("PROJECT_CONTRIBUTION") }), ...paragraphs(project.KONTRIBUSI)),
    tools.length > 0 && h("section", {}, h("h3", { text: t("PROJECT_TOOLS") }), h("ul", { class: "chips" }, tools.map(tool => h("li", { text: tool })))),
    (project.LINK_REPO || project.LINK_DEMO) && h("div", { class: "card-actions" },
      project.LINK_DEMO && h("a", { class: "btn btn-primary", href: project.LINK_DEMO, ...external }, t("PROJECT_DEMO")),
      project.LINK_REPO && h("a", { class: "btn btn-ghost", href: project.LINK_REPO, ...external }, t("PROJECT_REPO"))));
  openDialog(dialog, trigger);
  dialog.scrollTop = 0;
}

/* ------------------------------------------------------------------
   Tools
------------------------------------------------------------------- */
function renderTools(el, { tools: toolList, projects }) {
  if (!toolList.length) return el.replaceChildren(emptyBox());
  const counts = new Map();
  for (const project of projects) for (const tool of splitList(project.TOOLS)) counts.set(norm(tool), (counts.get(norm(tool)) || 0) + 1);

  const groups = new Map();
  for (const tool of toolList) {
    if (!tool.NAMA) continue;
    const group = tool.GRUP || "";
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(tool);
  }

  el.replaceChildren(...[...groups].map(([group, tools]) => h("section", { class: "tool-group" },
    group && h("h3", { text: group }),
    h("ul", { class: "tool-list" }, tools.map(tool => {
      const n = counts.get(norm(tool.NAMA)) || 0;
      const icon = tool.IKON
        ? h("img", { src: tool.IKON, alt: "", width: 28, height: 28, loading: "lazy" })
        : h("span", { class: "monogram", "aria-hidden": "true", text: tool.NAMA.slice(0, 3) });
      const label = [h("span", { class: "icon-tile" }, icon), h("span", { class: "tool-name", text: tool.NAMA }),
        h("span", { class: "tool-count", text: n ? (n === 1 ? t("TOOLS_COUNT_ONE", {}, t("TOOLS_COUNT", { n })) : t("TOOLS_COUNT", { n })) : t("TOOLS_NONE") })];
      return h("li", {}, n
        ? h("button", { class: "tool", type: "button", onclick: () => showProjectsFor(tool.NAMA) }, label)
        : h("div", { class: "tool is-idle" }, label));
    })))));
}

function showProjectsFor(name) {
  setFilter(name);
  activateTab($("#tab-projects"));
  $("#portfolio").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  $("#tab-projects").focus({ preventScroll: true });
}

/* ------------------------------------------------------------------
   Publikasi
------------------------------------------------------------------- */
async function loadPublications() {
  if (!state.manifest.PUBLIKASI) throw new ContentError("content/manifest.txt", "PUBLIKASI");
  return Promise.all(splitList(state.manifest.PUBLIKASI).map(slug =>
    load(`publications/${slug}.txt`, state.lang).then(r => ({ slug, ...(r[0] || {}) }), error => ({ slug, error }))));
}

function renderPublications(el, pubs) {
  if (!pubs.length) return el.replaceChildren(emptyBox());
  const me = norm((state.profile.NAMA || "Febrianggi").split(" ")[0]);
  el.replaceChildren(...pubs.map(pub => {
    if (pub.error) return h("article", { class: "card pub" }, errorBox(pub.error, () => renderAllContent()));
    const published = norm(pub.STATUS || "terbit") !== "proses";
    const isBook = norm(pub.JENIS || "").startsWith("buku") || norm(pub.JENIS || "") === "book";
    const authors = splitList(pub.PENULIS).map((name, i, list) => [
      norm(name).includes(me) ? h("strong", { text: name }) : name, i < list.length - 1 ? ", " : ""]);
    return h("article", { class: `card pub${pub.SAMPUL ? " pub-with-cover" : ""}`, "aria-labelledby": `pub-${pub.slug}` },
      pub.SAMPUL && h("button", {
        class: "pub-cover", type: "button", "aria-label": `${t("IMAGE_ZOOM")}: ${pub.SAMPUL_ALT || pub.JUDUL}`,
        onclick: e => openLightbox([{ type: "image", src: pub.SAMPUL, alt: pub.SAMPUL_ALT || pub.JUDUL }], 0, e.currentTarget),
      }, h("img", { src: pub.SAMPUL, alt: pub.SAMPUL_ALT || pub.JUDUL, loading: "lazy", width: 700, height: 990 })),
      h("div", { class: "pub-body" },
        h("p", { class: "pub-meta" },
          h("span", { class: `status ${published ? "is-published" : "is-progress"}`, text: t(published ? "PUB_PUBLISHED" : "PUB_IN_PROGRESS") }),
          h("span", { class: "mono muted", text: [pub.JENIS, pub.TANGGAL].filter(Boolean).join(" · ") })),
        h("h3", { id: `pub-${pub.slug}`, text: pub.JUDUL }),
        authors.length > 0 && h("p", { class: "authors" }, authors.flat()),
        pub.WADAH && h("p", { class: "mono muted venue", text: pub.WADAH }),
        pub.RINGKASAN && h("p", { class: "summary", text: pub.RINGKASAN }),
        h("div", { class: "card-actions" },
          pub.LINK && h("a", { class: "btn btn-ghost btn-sm", href: pub.LINK, ...external }, t(isBook ? "PUB_BOOK" : "PUB_READ")),
          pub.DOI && h("a", { class: "text-link mono", href: `https://doi.org/${pub.DOI}`, ...external }, `DOI ${pub.DOI}`))));
  }));
}

/* ------------------------------------------------------------------
   Sertifikat: carousel 3D
------------------------------------------------------------------- */
function renderCertificates(el, certs) {
  if (!certs.length) return el.replaceChildren(emptyBox());
  state.certIndex = Math.min(state.certIndex, certs.length - 1);

  const cards = certs.map((cert, i) => {
    const media = cert.GAMBAR
      ? h("button", {
        class: "cert-media", type: "button", "aria-label": `${t("IMAGE_ZOOM")}: ${cert.JUDUL}`,
        onclick: e => openLightbox([{ type: "image", src: cert.GAMBAR, alt: cert.JUDUL }], 0, e.currentTarget),
      }, h("img", { src: cert.GAMBAR, alt: cert.JUDUL, loading: "lazy" }))
      : h("div", { class: "cert-media cert-placeholder" },
        h("span", { class: "cert-seal", "aria-hidden": "true" }),
        h("span", { text: t("CERT_PENDING") }));
    return h("article", { class: "cert-card", dataset: { index: i }, "aria-roledescription": "slide", "aria-label": t("CERT_COUNTER", { i: i + 1, n: certs.length }) },
      media,
      h("div", { class: "cert-info" },
        h("h3", { text: cert.JUDUL }),
        h("p", { class: "mono muted", text: [cert.PENERBIT, cert.TAHUN].filter(Boolean).join(" · ") }),
        h("div", { class: "card-actions" },
          cert.LINK && h("a", { class: "btn btn-ghost btn-sm", href: cert.LINK, ...external }, t("CERT_VIEW")),
          cert.PDF && h("button", { class: "btn btn-ghost btn-sm", type: "button", onclick: e => openLightbox([{ type: "pdf", src: cert.PDF, alt: cert.JUDUL }], 0, e.currentTarget) }, t("CERT_PDF")))));
  });

  const multiple = certs.length > 1;
  const carousel = h("div", {
    class: "cert-carousel", role: "region", "aria-roledescription": "carousel", "aria-label": t("TAB_CERTIFICATES"), tabindex: multiple ? "0" : null,
    onkeydown: e => {
      if (e.key === "ArrowRight") { e.preventDefault(); selectCert(state.certIndex + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); selectCert(state.certIndex - 1); }
    },
  }, h("div", { class: "cert-stage" }, cards),
  multiple && h("div", { class: "cert-controls" },
    h("button", { class: "icon-btn", type: "button", "aria-label": t("CERT_PREV"), onclick: () => selectCert(state.certIndex - 1) },
      svgIcon("M15 5l-7 7 7 7")),
    h("div", { class: "cert-dots" }, certs.map((_, i) =>
      h("button", { type: "button", class: "dot", "aria-label": t("CERT_PICK", { i: i + 1 }), onclick: () => selectCert(i) }))),
    h("span", { class: "mono muted cert-count", "aria-live": "polite" }),
    h("button", { class: "icon-btn", type: "button", "aria-label": t("CERT_NEXT"), onclick: () => selectCert(state.certIndex + 1) },
      svgIcon("M9 5l7 7-7 7"))));

  // geser dengan jari / mouse
  let startX = null;
  carousel.addEventListener("pointerdown", e => { startX = e.clientX; });
  carousel.addEventListener("pointerup", e => {
    if (startX == null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 48) selectCert(state.certIndex + (dx < 0 ? 1 : -1));
  });

  el.replaceChildren(carousel);
  selectCert(state.certIndex);
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

function selectCert(index) {
  const cards = $$(".cert-card");
  if (!cards.length) return;
  const n = cards.length;
  state.certIndex = (index + n) % n;
  cards.forEach((card, i) => {
    let offset = i - state.certIndex;
    if (n > 2) { if (offset > n / 2) offset -= n; if (offset < -n / 2) offset += n; }
    card.dataset.pos = offset === 0 ? "center" : offset === -1 ? "left" : offset === 1 ? "right" : "hidden";
    card.inert = offset !== 0;
  });
  $$(".cert-dots .dot").forEach((dot, i) => dot.setAttribute("aria-current", String(i === state.certIndex)));
  const counter = $(".cert-count");
  if (counter) counter.textContent = t("CERT_COUNTER", { i: state.certIndex + 1, n });
}

/* ------------------------------------------------------------------
   Render semua konten (dipanggil saat awal & ganti bahasa)
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
    fill("achievements", () => all("achievements.txt"), renderAchievements),
    fill("contact", () => first("contact.txt"), renderContact),
    fill("projects", loadProjects, renderProjects),
    fill("tools", loadProjects, renderTools),
    fill("publications", loadPublications, renderPublications),
    fill("certificates", () => all("certificates.txt"), renderCertificates),
  ]);
  if (state.profile.NAMA) document.title = `${state.profile.NAMA} · ${t("PORTFOLIO_TITLE")}`;
}

/* ------------------------------------------------------------------
   Tab portofolio (ARIA tabs + navigasi keyboard)
------------------------------------------------------------------- */
const tabs = $$('[role="tab"]');

function activateTab(tab, updateHash = true) {
  for (const item of tabs) {
    const selected = item === tab;
    item.setAttribute("aria-selected", String(selected));
    item.tabIndex = selected ? 0 : -1;
    $(`#${item.getAttribute("aria-controls")}`).hidden = !selected;
  }
  if (updateHash) history.replaceState(null, "", `#${tab.id.replace("tab-", "")}`);
}

function setupTabs() {
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activateTab(tab));
    tab.addEventListener("keydown", event => {
      const keys = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 };
      if (!(event.key in keys)) return;
      event.preventDefault();
      const next = tabs[(keys[event.key] + tabs.length) % tabs.length];
      activateTab(next);
      next.focus();
    });
  });
  const fromHash = tabs.find(tab => `#${tab.id.replace("tab-", "")}` === location.hash);
  if (fromHash) {
    activateTab(fromHash, false);
    requestAnimationFrame(() => $("#portfolio").scrollIntoView());
  }
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
   Cahaya biru pengikut kursor (lerp + requestAnimationFrame)
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
    glow.style.transform = `translate3d(${pos.x - 300}px, ${pos.y - 300}px, 0)`;
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
   Menu mobile + ganti bahasa
------------------------------------------------------------------- */
function setupHeader() {
  const toggle = $(".menu-toggle");
  const nav = $("#site-nav");
  const setOpen = open => {
    toggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
  };
  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
  nav.addEventListener("click", event => { if (event.target.closest("a")) setOpen(false); });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && nav.classList.contains("is-open")) { setOpen(false); toggle.focus(); }
  });
  matchMedia("(min-width: 48rem)").addEventListener("change", () => setOpen(false));

  $("#lang-toggle").addEventListener("click", async () => {
    state.lang = state.lang === "id" ? "en" : "id";
    storeLang(state.lang);
    await renderAllContent();
  });
}

/* ------------------------------------------------------------------
   Mulai
------------------------------------------------------------------- */
async function boot() {
  if (location.protocol === "file:") $("#file-banner").hidden = false;
  $("[data-year]").textContent = new Date().getFullYear();

  setupHeader();
  setupTabs();
  setupDialogs();
  setupCursorGlow();
  document.addEventListener("click", event => {
    if (event.target.closest("[data-copy-email]")) copyEmail();
  });

  try {
    state.manifest = (await load("manifest.txt", "id", { shared: true }))[0] || {};
  } catch (error) {
    console.error(error);
  }
  state.lang = getStoredLang() || state.manifest.BAHASA_DEFAULT || "id";
  await renderAllContent();
}

boot();
