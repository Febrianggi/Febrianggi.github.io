<div align="center">

# Febrianggi Caesar Immanuel · Portfolio

Statistics student at Universitas Padjadjaran · Data analysis with R, Python, and Excel

**English** · [Bahasa Indonesia](README.id.md)

[**febrianggi.github.io**](https://febrianggi.github.io)

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2020-F7DF1E?logo=javascript&logoColor=black)
![GitHub Pages](https://img.shields.io/badge/Hosted%20on-GitHub%20Pages-222?logo=github&logoColor=white)

</div>

---

## Overview

An English-language personal portfolio built with plain HTML, CSS, and JavaScript. It has no framework and no build step. Every piece of text about me lives in plain `.txt` files under `content/`, so the site can be updated without touching the code.

## Design system: Teal Scientific

A dark editorial layout with a scientific accent. Tokens live at the top of `css/styles.css`.

| Token | Value | Used for |
|---|---|---|
| Background | `#101517` | Page |
| Surface / elevated | `#182124` / `#1A292D` | Panels, cards, dialogs |
| Accent / hover | `#56C6CF` / `#79DCE3` | Section numbers, links, active states, primary buttons |
| Accent tint | `rgba(86,198,207,0.12)` | Selected filters, badges |
| Text / secondary / muted | `#ECF9FA` / `#B4C5C9` / `#95A9AE` | Body copy and metadata |
| Border | `rgba(236,249,250,0.10)` | Separators |

- **Type:** Plus Jakarta Sans with a fluid scale from `clamp()`: hero 42 to 72 px, section titles 32 to 44 px, project titles 26 to 36 px, card titles 18 to 22 px, body 15 to 17 px, metadata 13 to 14 px.
- **Spacing:** 4 px steps (`--s1` to `--s9`), content width 1280 px, section gap 72 to 120 px.
- **Radius:** 6 px chips, 10 px buttons, 16 px cards and images.
- **Contrast:** every text and background pair is at least 6:1 (WCAG AA).

## Sections

| # | Section | Contents |
|---|---|---|
| | **Hero** | Eyebrow, name, positioning line, short intro, Explore my work / Contact me, social links, profile photo |
| 01 | **About & Core Competencies** | About Me, Education, achievement highlights, technical skills in groups that filter the projects |
| 02 | **Selected Projects** | One case study per row with a large screenshot (sides alternate on desktop), methods, tools, key results, links, and method notes |
| 03 | **More Projects** | Card gallery (3 / 2 / 1 columns) with optional category filter; tidy empty state while the list is empty |
| 04 | **Research & Publications** | Numbered list with status, type, date, authors, venue, abstract, DOI or link, and book cover |
| 05 | **Achievements & Certificates** | Achievement timeline with proof links, and a certificate carousel |
| 06 | **Contact** | Email as the main action, one-click copy, LinkedIn, GitHub, Instagram |

## Features

- **Content in `.txt` files**, loaded at runtime with `fetch()` and a small parser. Each section shows a loading skeleton, an error message with a retry button, and an empty state. All text is inserted with `textContent`, never as HTML.
- **English site, layered content.** Base files live in `content/id/`; `content/en/` holds the English text and overrides matching keys. Any key missing in English falls back to the base file. Setting `BAHASA_DEFAULT: id` in `manifest.txt` shows the Indonesian text.
- **Skill filter.** Tools that appear in projects show a count. Selecting one filters both project sections, highlights the matching tool chips, shows "Showing n of N" with a reset button, and shows an empty message if a section has no match.
- **Category filter** in More Projects, built from the `KATEGORI` values. It only appears when the projects use two or more categories.
- **Project media:** a large screenshot shown whole (no cropping), thumbnails when a project has several images, and a lightbox with zoom and arrow-key navigation. PDFs open in place.
- **Navigation:** sticky header that turns solid after scrolling, an underline on the section in view, an accessible mobile menu (closes on link, Escape, or outside click), and a back-to-top button.
- **Motion (moderate):** staggered hero entrance, scroll reveal with `IntersectionObserver`, a slowly floating profile photo, hover lifts on cards, and a subtle cursor glow. Everything stops when the device asks for reduced motion, and content is never hidden if the observer is missing or fails.
- **SEO and sharing:** description, canonical URL, Open Graph and Twitter cards with `assets/social/og-image.png`, `Person` structured data, and an SVG favicon.
- **Accessibility:** semantic landmarks, one `h1`, native `<dialog>` with focus return, a skip link, visible focus rings, 44 px touch targets, `aria-pressed` on filters, and a keyboard-operable carousel (arrow keys, no autoplay).

## Tech stack

| Area | Choice |
|---|---|
| Markup | Semantic HTML5 |
| Styling | CSS custom properties, Grid, Flexbox |
| Scripting | Vanilla JavaScript (ES modules), no dependencies |
| Typography | [Plus Jakarta Sans](https://github.com/tokotype/PlusJakartaSans), self-hosted (SIL OFL 1.1) |
| Hosting | GitHub Pages |

## Project structure

```
.
├── index.html
├── css/styles.css          # design tokens + all components
├── js/
│   ├── content.js          # .txt parser and content loader
│   └── main.js             # rendering, filters, dialogs, lightbox, carousel, motion
├── content/
│   ├── manifest.txt        # which projects and publications appear, in order
│   ├── id/                 # Indonesian text (primary, complete)
│   │   ├── profile.txt  about.txt  education.txt  achievements.txt
│   │   ├── tools.txt  certificates.txt  contact.txt  ui.txt
│   │   ├── projects/       # featured projects, one file each
│   │   ├── more-projects/  # smaller projects (see _template.txt)
│   │   └── publications/   # one file per publication (see _template.txt)
│   └── en/                 # English translations (translated keys only)
└── assets/
    ├── personal/  projects/<slug>/  publications/  certificates/  documents/
    ├── contact/   tools/   fonts/   social/
```

## Running locally

The site loads its text with `fetch()`, which browsers block for pages opened straight from disk (`file://`). Serve the folder instead:

```bash
# Option 1: VS Code
#   Install "Live Server", right-click index.html, choose "Open with Live Server".

# Option 2: Python
python -m http.server 8000
# then open http://localhost:8000
```

## Editing content

Content files use a simple `KEY: value` format:

```text
# Lines starting with # are comments
JUDUL: Single-line value
RINGKASAN: A long value can continue
on the next line.

A blank line starts a new paragraph.
HASIL:
- first point
- second point
TOOLS: R, Python, Excel
---
JUDUL: Next entry (entries are separated by ---)
```

- Keys are uppercase and come first on the line.
- An empty value (for example `LINK_DEMO:`) hides that button or block. No dead buttons are rendered.
- Names in a project's `TOOLS:` must match `NAMA:` in `tools.txt` for the skill filter to work.
- Interface text (buttons, headings, messages) is in `ui.txt`, in both `content/id/` and `content/en/`.

### Hero text

`content/id/profile.txt` (and `content/en/profile.txt` for English) has three optional keys: `EYEBROW` (small line above the name), `HEADLINE` (positioning line), and `INTRO` (one short paragraph).

### Skill groups

Each tool in `content/id/tools.txt` has a `GRUP:` value: `komputasi`, `perangkat-statistik`, `analitik`, `pengembangan`, or `produktivitas`. A tool without `GRUP` goes into "Other Tools". Group names are in `ui.txt` (`SKILL_GROUP_...`).

### Adding a featured project

1. Copy any file in `content/id/projects/` and rename it, for example `new-project.txt`.
2. Put screenshots in `assets/projects/new-project/` (16:10, about 1600×1000 px). List them under `GAMBAR:`; the first is the main image and the rest become thumbnails.
3. Add `- new-project` under `PROYEK:` in `content/manifest.txt`. The order there is the order on the page, and rows alternate sides automatically.
4. Add `content/en/projects/new-project.txt` with the English text for the keys shown on the site.

Optional keys: `TUJUAN` (goal), `TEKNIK` (methods), `HASIL` (the first two points appear on the page, all of them in method notes), `KONTRIBUSI`, `LINK_DEMO`, `LABEL_DEMO`, `LINK_REPO`.

### Adding a smaller project

1. Copy `content/id/more-projects/_template.txt` to a new file, for example `my-analysis.txt`, and fill it in.
2. Optional: add a screenshot in `assets/projects/my-analysis/` and list it under `GAMBAR:` (or `THUMBNAIL:`).
3. List `- my-analysis` under `PROYEK_LAINNYA:` in `content/manifest.txt`.

`KATEGORI` (for example `Dashboard` or `Research`) drives the category filter, which appears once at least two categories exist. While `PROYEK_LAINNYA:` is empty, the section shows a short "more projects are on the way" note.

### Adding a publication

Copy `content/id/publications/_template.txt`, fill it in, and list the file name under `PUBLIKASI:` in `content/manifest.txt`. `STATUS: proses` shows "In progress"; anything else shows "Published".

### Photo, CV, and certificates

| Item | Location | Then set |
|---|---|---|
| Profile photo (transparent background, square, at least 720 px) | `assets/personal/` | `FOTO:` in `content/id/profile.txt` |
| CV (PDF) | `assets/documents/` | `CV:` in `content/id/profile.txt`; a Download CV button then replaces Contact me in the hero |
| Certificate image / PDF | `assets/certificates/` | `GAMBAR:`, `PDF:`, `LINK:` in `content/id/certificates.txt` |
| Social preview (1200×630) | `assets/social/og-image.png` | Referenced in `index.html` |

## Deployment

The site is published with GitHub Pages from the `main` branch root (**Settings → Pages → Deploy from a branch**). Every push to `main` updates [febrianggi.github.io](https://febrianggi.github.io) within a minute or two. There is nothing to build.

## Credits

- The layered profile-photo frame was inspired by the portfolio of **Humaira Zeanova**.
- Tool and contact icons are reused from the reference portfolios this site is based on.
- Plus Jakarta Sans © The Plus Jakarta Sans Project Authors, licensed under the SIL Open Font License 1.1.

## Contact

- Email: [febrianggicaesarimmanuel@gmail.com](mailto:febrianggicaesarimmanuel@gmail.com)
- LinkedIn: [in/febrianggi](https://www.linkedin.com/in/febrianggi/)
- GitHub: [Febrianggi](https://github.com/Febrianggi)
- Instagram: [@febri.immanuel_](https://www.instagram.com/febri.immanuel_/)

---

<div align="center">© 2026 Febrianggi Caesar Immanuel</div>
