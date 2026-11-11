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

function svgIcon(d) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d);
  svg.append(path);
  return svg;
}

const paragraphs = text => (text || "").split("\n\n").filter(Boolean).map(p => h("p", { text: p }));
const external = { target: "_blank", rel: "noopener noreferrer" };
const norm = s => s.trim().toLowerCase();
const listOf = value => (Array.isArray(value) ? value : value ? [value] : []);
const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

const state = {
  lang: "en",
  manifest: {},
  ui: {},
  profile: {},
  contact: {},
  filter: null,
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
   Kontak: daftar tautan dipakai di profil dan bagian kontak
------------------------------------------------------------------- */
function contactLinks(contact) {
  const handle = url => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "").split("/").pop();
  return [
    contact.WHATSAPP && { label: "WhatsApp", href: `https://wa.me/${contact.WHATSAPP.replace(/\D/g, "")}`, icon: "whatsapp.png", detail: `+${contact.WHATSAPP.replace(/\D/g, "")}` },
    contact.LINKEDIN && { label: "LinkedIn", href: contact.LINKEDIN, icon: "linkedin.png", detail: handle(contact.LINKEDIN) },
    contact.GITHUB && { label: "GitHub", href: contact.GITHUB, icon: "github.png", detail: handle(contact.GITHUB) },
    contact.INSTAGRAM && { label: "Instagram", href: contact.INSTAGRAM, icon: "instagram.png", detail: `@${handle(contact.INSTAGRAM)}` },
  ].filter(Boolean);
}

/* ------------------------------------------------------------------
   Hero: judul, profil, tentang, pendidikan, prestasi
------------------------------------------------------------------- */
function renderProfile(el, [profile, contact]) {
  state.profile = profile;
  state.contact = contact;
  applyFields();

  const [firstName, ...rest] = (profile.NAMA || "").split(" ");
  const brand = slotEl("brand");
  brand.replaceChildren(firstName, rest.length ? " " : "", rest.length ? h("span", { text: rest.join(" ") }) : "");

  slotEl("page-title").replaceChildren(profile.JUDUL_HALAMAN || profile.NAMA || "");

  const photo = h("div", { class: "photo" });
  if (profile.FOTO) {
    photo.append(h("img", { src: profile.FOTO, alt: profile.FOTO_ALT || profile.NAMA, width: 600, height: 600, fetchpriority: "high" }));
  } else {
    photo.append(h("span", { class: "photo-initials", "aria-hidden": "true", text: profile.INISIAL || "" }));
  }

  el.replaceChildren(
    photo,
    !profile.FOTO && h("p", { class: "photo-note", text: t("PHOTO_PENDING") }),
    h("p", { class: "profile-name" },
      h("span", { text: firstName }), rest.length ? h("span", { class: "accent", text: ` ${rest.join(" ")}` }) : ""),
    profile.PERAN && h("p", { class: "profile-role", text: profile.PERAN }),
    h("div", { class: "profile-actions" },
      h("a", { class: "btn btn-primary", href: "#projects" }, t("HERO_CTA")),
      contact.EMAIL && h("button", { class: "btn btn-ghost", type: "button", dataset: { copyEmail: "" } },
        svgIcon("M9 9h10v10H9zM5 15V5h10"), t("COPY_EMAIL")),
      profile.CV && h("a", { class: "btn btn-ghost", href: profile.CV, download: true }, t("CV"))),
    h("ul", { class: "profile-social" }, [
      contact.EMAIL && { label: "Email", href: `mailto:${contact.EMAIL}`, icon: "email.png" },
      ...contactLinks(contact),
    ].filter(Boolean).map(link =>
      h("li", {}, h("a", { href: link.href, ...(link.href.startsWith("http") ? external : {}), "aria-label": link.label, title: link.label },
        h("img", { src: `assets/contact/${link.icon}`, alt: "", width: 22, height: 22 }))))));
}

function renderAbout(el, about) {
  el.replaceChildren(...(about.TEKS ? paragraphs(about.TEKS) : [emptyBox()]));
}

function renderEducation(el, entries) {
  if (!entries.length) return el.replaceChildren(emptyBox());
  el.replaceChildren(h("ul", { class: "entry-list" }, entries.map(e =>
    h("li", { class: "education" },
      h("p", { class: "entry-title", text: e.INSTITUSI }),
      h("p", { class: "muted", text: e.PROGRAM }),
      h("p", { class: "small", text: e.PERIODE }),
      e.KETERANGAN && h("p", { class: "muted", text: e.KETERANGAN }),
      e.IPK && h("p", { class: "gpa", text: `${e.IPK} GPA` })))));
}

function renderAchievements(el, entries) {
  if (!entries.length) return el.replaceChildren(emptyBox());
  el.replaceChildren(h("ul", { class: "entry-list" }, entries.map(e =>
    h("li", {},
      h("p", { class: "entry-title", text: e.JUDUL }),
      h("p", { class: "small muted", text: [e.PENYELENGGARA, e.TAHUN].filter(Boolean).join(" · ") }),
      e.KETERANGAN && h("p", { class: "muted", text: e.KETERANGAN }),
      e.LINK && h("a", { class: "text-link", href: e.LINK, ...external }, t("EVIDENCE"))))));
}

/* ------------------------------------------------------------------
   Technical skills (ikon) + filter proyek
------------------------------------------------------------------- */
function countTools(projects) {
  const counts = new Map();
  for (const project of projects) for (const tool of splitList(project.TOOLS)) counts.set(norm(tool), (counts.get(norm(tool)) || 0) + 1);
  return counts;
}

function renderTools(el, { tools, projects, more }) {
  const list = tools.filter(tool => tool.NAMA);
  if (!list.length) return el.replaceChildren(emptyBox());
  const counts = countTools([...projects, ...more]);

  el.replaceChildren(h("ul", { class: "tech-grid" }, list.map(tool => {
    const n = counts.get(norm(tool.NAMA)) || 0;
    const icon = tool.IKON
      ? h("img", { src: tool.IKON, alt: "", width: 30, height: 30, loading: "lazy" })
      : h("span", { class: "monogram", "aria-hidden": "true", text: tool.NAMA.slice(0, 3) });
    const inner = [h("span", { class: "tech-icon" }, icon), h("span", { class: "tech-name", text: tool.NAMA }),
      n > 0 && h("span", { class: "tech-count", "aria-hidden": "true", text: n })];
    const countLabel = n === 1 ? t("TOOLS_COUNT_ONE") : t("TOOLS_COUNT", { n });
    return h("li", {}, n > 0
      ? h("button", { class: "tech-item is-used", type: "button", dataset: { tool: norm(tool.NAMA) }, "aria-label": `${tool.NAMA}, ${countLabel}`, "aria-pressed": "false", onclick: () => toggleFilter(tool.NAMA) }, inner)
      : h("div", { class: "tech-item" }, inner));
  })));
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
  const items = $$("[data-project-tools]");
  let shown = 0;
  for (const item of items) {
    const match = !key || item.dataset.projectTools.split("|").includes(key);
    item.hidden = !match;
    if (match) shown++;
    for (const chip of $$("[data-chip]", item)) chip.classList.toggle("is-match", Boolean(key) && chip.dataset.chip === key);
  }
  for (const button of $$(".tech-item[data-tool]")) button.setAttribute("aria-pressed", String(button.dataset.tool === key));

  const status = $("#filter-status");
  status.hidden = !key;
  $("#filter-text").textContent = key ? t("FILTER_STATUS_TOOL", { n: shown, total: items.length, tool: state.filter }) : "";
  for (const slot of ["projects", "more"]) {
    const el = slotEl(slot);
    const visible = $$("[data-project-tools]", el).some(item => !item.hidden);
    let empty = $(".filter-empty", el);
    if (key && !visible && $$("[data-project-tools]", el).length) {
      if (!empty) el.append(empty = h("p", { class: "state state-empty filter-empty" }));
      empty.textContent = t("FILTER_EMPTY");
    } else empty?.remove();
  }
}

/* ------------------------------------------------------------------
   Media proyek (grid 2x2) dan lightbox
------------------------------------------------------------------- */
function mediaGrid(images, { large = false } = {}) {
  if (!images.length) {
    return h("div", { class: "media media-empty" },
      h("div", { class: "media-placeholder" }, h("span", { text: t("IMAGE_PENDING") })));
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
   Proyek unggulan
------------------------------------------------------------------- */
async function loadProjects() {
  const [tools, projects, more] = await Promise.all([all("tools.txt"), loadList("PROYEK", "projects"), loadList("PROYEK_LAINNYA", "more-projects")]);
  return { tools, projects, more };
}

const toolChips = tools => tools.length > 0 &&
  h("ul", { class: "chips" }, tools.map(tool => h("li", { dataset: { chip: norm(tool) }, text: tool })));

function featureRow(project) {
  if (project.error) {
    return h("article", { class: "feature", dataset: { projectTools: "" } }, errorBox(project.error, () => renderAllContent()));
  }
  const tools = splitList(project.TOOLS);
  const meta = [
    project.TUJUAN && [t("PROJECT_GOAL"), project.TUJUAN],
    project.TEKNIK && [t("PROJECT_TECHNIQUE"), project.TEKNIK],
  ].filter(Boolean);

  return h("article", { class: "feature", dataset: { projectTools: tools.map(norm).join("|") }, "aria-labelledby": `p-${project.slug}` },
    mediaGrid(parseImages(project.GAMBAR)),
    h("div", { class: "feature-body" },
      h("h3", { id: `p-${project.slug}`, class: "feature-title", text: project.JUDUL }),
      h("p", { class: "feature-subtitle", text: [project.TAHUN, project.SUBJUDUL].filter(Boolean).join(" • ") }),
      project.RINGKASAN && h("p", { class: "feature-desc", text: project.RINGKASAN.split("\n\n")[0] }),
      (meta.length > 0 || tools.length > 0) && h("dl", { class: "meta-grid" },
        meta.map(([label, value]) => h("div", {}, h("dt", { text: label }), h("dd", { text: value }))),
        tools.length > 0 && h("div", {}, h("dt", { text: t("PROJECT_TOOLS") }), h("dd", {}, toolChips(tools)))),
      h("div", { class: "actions" },
        h("button", { class: "btn btn-primary btn-sm", type: "button", onclick: e => openProject(project, e.currentTarget) }, t("PROJECT_DETAIL"))),
      (project.LINK_DEMO || project.LINK_REPO) && h("div", { class: "feature-links" },
        project.LINK_DEMO && h("a", { class: "text-link", href: project.LINK_DEMO, ...external }, project.LABEL_DEMO || t("PROJECT_DEMO")),
        project.LINK_REPO && h("a", { class: "text-link", href: project.LINK_REPO, ...external }, t("PROJECT_REPO")))));
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

  $("#project-dialog-kicker").textContent = [project.TAHUN, project.SUBJUDUL].filter(Boolean).join(" • ");
  $("#project-dialog-title").textContent = project.JUDUL;
  $("#project-dialog-body").replaceChildren(
    mediaGrid(parseImages(project.GAMBAR), { large: true }),
    h("section", {}, h("h3", { text: t("PROJECT_SUMMARY") }), ...(project.RINGKASAN ? paragraphs(project.RINGKASAN) : [pending()])),
    h("section", {}, h("h3", { text: t("PROJECT_METHOD") }), ...(project.METODE ? paragraphs(project.METODE) : [pending()])),
    h("section", {}, h("h3", { text: t("PROJECT_RESULTS") }),
      results.length ? h("ul", { class: "result-list" }, results.map(r => h("li", { text: r }))) : pending()),
    project.KONTRIBUSI && h("section", {}, h("h3", { text: t("PROJECT_CONTRIBUTION") }), ...paragraphs(project.KONTRIBUSI)),
    tools.length > 0 && h("section", {}, h("h3", { text: t("PROJECT_TOOLS") }), toolChips(tools)),
    (project.LINK_REPO || project.LINK_DEMO) && h("div", { class: "actions" },
      project.LINK_DEMO && h("a", { class: "btn btn-primary", href: project.LINK_DEMO, ...external }, project.LABEL_DEMO || t("PROJECT_DEMO")),
      project.LINK_REPO && h("a", { class: "btn btn-ghost", href: project.LINK_REPO, ...external }, t("PROJECT_REPO"))));
  openDialog(dialog, trigger);
  dialog.scrollTop = 0;
}

/* ------------------------------------------------------------------
   Proyek lainnya (kartu ringkas)
------------------------------------------------------------------- */
function renderMore(el, { more }) {
  if (!more.length) {
    el.replaceChildren(h("div", { class: "more-empty" }, h("span", { class: "more-empty-mark", "aria-hidden": "true" }), h("p", { text: t("MORE_EMPTY") })));
    return;
  }
  el.replaceChildren(...more.map(project => {
    if (project.error) return h("article", { class: "more-card", dataset: { projectTools: "" } }, errorBox(project.error, () => renderAllContent()));
    const tools = splitList(project.TOOLS);
    const links = [
      project.LINK_REPO && [t("PROJECT_REPO"), project.LINK_REPO],
      project.LINK_DEMO && [project.LABEL_DEMO || t("PROJECT_DEMO"), project.LINK_DEMO],
      project.LINK_LAPORAN && [t("PROJECT_REPORT"), project.LINK_LAPORAN],
    ].filter(Boolean);
    return h("article", { class: "more-card", dataset: { projectTools: tools.map(norm).join("|") } },
      h("div", { class: "more-body" },
        h("h3", { text: project.JUDUL }),
        listOf(project.HASIL).length > 0 && h("ul", { class: "result-list" }, listOf(project.HASIL).map(r => h("li", { text: r }))),
        (tools.length > 0 || project.KATEGORI) && h("p", { class: "more-tools" }, [tools.join(", "), project.KATEGORI].filter(Boolean).join(" | "))),
      (project.TEKNIK || links.length > 0) && h("div", { class: "more-foot" },
        project.TEKNIK && h("p", {}, h("strong", { text: `${t("PROJECT_TECHNIQUE")}: ` }), project.TEKNIK),
        links.length > 0 && h("div", { class: "more-links" }, links.map(([label, href]) => h("a", { class: "text-link", href, ...external }, label)))));
  }));
  applyFilter();
}

/* ------------------------------------------------------------------
   Publikasi
------------------------------------------------------------------- */
function renderPublications(el, pubs) {
  if (!pubs.length) return el.replaceChildren(emptyBox());
  const me = norm((state.profile.NAMA || "Febrianggi").split(" ")[0]);
  el.replaceChildren(...pubs.map(pub => {
    if (pub.error) return h("article", { class: "pub" }, errorBox(pub.error, () => renderAllContent()));
    const published = norm(pub.STATUS || "terbit") !== "proses";
    const type = norm(pub.JENIS || "");
    const isBook = type.startsWith("buku") || type === "book";
    const authors = splitList(pub.PENULIS).map((name, i, list) => [
      norm(name).includes(me) ? h("strong", { text: name }) : name, i < list.length - 1 ? ", " : ""]);
    return h("article", { class: `pub${pub.SAMPUL ? " pub-with-cover" : ""}`, "aria-labelledby": `pub-${pub.slug}` },
      pub.SAMPUL && h("button", {
        class: "pub-cover", type: "button", "aria-label": `${t("IMAGE_ZOOM")}: ${pub.SAMPUL_ALT || pub.JUDUL}`,
        onclick: e => openLightbox([{ type: "image", src: pub.SAMPUL, alt: pub.SAMPUL_ALT || pub.JUDUL }], 0, e.currentTarget),
      }, h("img", { src: pub.SAMPUL, alt: pub.SAMPUL_ALT || pub.JUDUL, loading: "lazy", width: 700, height: 990 })),
      h("div", { class: "pub-main" },
        h("div", { class: "pub-body" },
          h("p", { class: "pub-meta" },
            h("span", { class: `status ${published ? "is-published" : "is-progress"}`, text: t(published ? "PUB_PUBLISHED" : "PUB_IN_PROGRESS") }),
            h("span", { class: "muted", text: [pub.JENIS, pub.TANGGAL].filter(Boolean).join(" · ") })),
          h("h3", { id: `pub-${pub.slug}`, text: pub.JUDUL }),
          pub.WADAH && h("p", { class: "venue", text: pub.WADAH }),
          authors.length > 0 && h("p", { class: "authors" }, authors.flat()),
          pub.RINGKASAN && h("p", { class: "summary", text: pub.RINGKASAN })),
        (pub.LINK || pub.DOI) && h("div", { class: "pub-foot" },
          pub.LINK && h("a", { class: "text-link", href: pub.LINK, ...external }, t(isBook ? "PUB_BOOK" : "PUB_READ")),
          pub.DOI && h("a", { class: "text-link", href: `https://doi.org/${pub.DOI}`, ...external }, `doi.org/${pub.DOI}`))));
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
        h("p", { class: "small muted", text: [cert.PENERBIT, cert.TAHUN].filter(Boolean).join(" · ") }),
        h("div", { class: "actions" },
          cert.LINK && h("a", { class: "btn btn-ghost btn-sm", href: cert.LINK, ...external }, t("CERT_VIEW")),
          cert.PDF && h("button", { class: "btn btn-ghost btn-sm", type: "button", onclick: e => openLightbox([{ type: "pdf", src: cert.PDF, alt: cert.JUDUL }], 0, e.currentTarget) }, t("CERT_PDF")))));
  });

  const multiple = certs.length > 1;
  const carousel = h("div", {
    class: "cert-carousel", role: "region", "aria-roledescription": "carousel", "aria-label": t("CERTIFICATES_TITLE"), tabindex: multiple ? "0" : null,
    onkeydown: e => {
      if (e.key === "ArrowRight") { e.preventDefault(); selectCert(state.certIndex + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); selectCert(state.certIndex - 1); }
    },
  }, h("div", { class: "cert-stage" }, cards),
  multiple && h("div", { class: "cert-controls" },
    h("button", { class: "icon-btn", type: "button", "aria-label": t("CERT_PREV"), onclick: () => selectCert(state.certIndex - 1) }, svgIcon("M15 5l-7 7 7 7")),
    h("div", { class: "cert-dots" }, certs.map((_, i) =>
      h("button", { type: "button", class: "dot", "aria-label": t("CERT_PICK", { i: i + 1 }), onclick: () => selectCert(i) }))),
    h("span", { class: "small muted cert-count", "aria-live": "polite" }),
    h("button", { class: "icon-btn", type: "button", "aria-label": t("CERT_NEXT"), onclick: () => selectCert(state.certIndex + 1) }, svgIcon("M9 5l7 7-7 7"))));

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
   Kontak
------------------------------------------------------------------- */
function renderContact(el, contact) {
  const email = contact.EMAIL;
  el.replaceChildren(
    h("div", { class: "contact-lead" }, paragraphs(contact.AJAKAN)),
    h("ul", { class: "contact-grid" },
      email && h("li", { class: "contact-card" },
        h("img", { src: "assets/contact/email.png", alt: "", width: 40, height: 40 }),
        h("div", {},
          h("p", { class: "contact-label", text: "Email" }),
          h("a", { class: "contact-detail", href: `mailto:${email}`, text: email })),
        h("button", { class: "icon-btn copy-btn", type: "button", dataset: { copyEmail: "" }, "aria-label": t("COPY_EMAIL"), title: t("COPY_EMAIL") },
          svgIcon("M9 9h10v10H9zM5 15V5h10"))),
      contactLinks(contact).map(link => h("li", {},
        h("a", { class: "contact-card", href: link.href, ...external },
          h("img", { src: `assets/contact/${link.icon}`, alt: "", width: 40, height: 40 }),
          h("div", {},
            h("p", { class: "contact-label", text: link.label }),
            h("p", { class: "contact-detail", text: link.detail })))))));
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
    fill("profile", () => Promise.all([first("profile.txt"), first("contact.txt")]), renderProfile),
    fill("about", () => first("about.txt"), renderAbout),
    fill("education", () => all("education.txt"), renderEducation),
    fill("achievements", () => all("achievements.txt"), renderAchievements),
    fill("projects", loadProjects, renderProjects),
    fill("more", loadProjects, renderMore),
    fill("tools", loadProjects, renderTools),
    fill("publications", () => loadList("PUBLIKASI", "publications"), renderPublications),
    fill("certificates", () => all("certificates.txt"), renderCertificates),
    fill("contact", () => first("contact.txt"), renderContact),
  ]);
  applyFilter();
  if (state.profile.NAMA) document.title = `${state.profile.NAMA} · ${state.profile.JUDUL_HALAMAN || ""}`.replace(/ · $/, "");
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
  matchMedia("(min-width: 64rem)").addEventListener("change", () => setOpen(false));

}

/* ------------------------------------------------------------------
   Mulai
------------------------------------------------------------------- */
async function boot() {
  $("[data-year]").textContent = new Date().getFullYear();

  setupHeader();
  setupDialogs();
  setupCursorGlow();
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
  state.lang = "en";
  await renderAllContent();
}

boot();
