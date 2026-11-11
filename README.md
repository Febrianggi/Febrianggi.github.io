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

## Sections

| Section | Contents |
|---|---|
| **About** | Page title, About Me, Education, Technical Skills, Achievements, profile photo and links |
| **Featured Projects** | Main projects with a 2×2 screenshot grid, methods, tools, and a method-notes dialog |
| **More Projects** | Compact cards for smaller projects |
| **Publications** | Journal articles and books, with status (published / in progress) |
| **Certificates** | 3D carousel with image or PDF preview |
| **Contact** | Email (one-click copy), LinkedIn, GitHub, Instagram |

## Features

- **Content in `.txt` files**, loaded at runtime with `fetch()` and a small parser. Each section shows a loading skeleton, an error message with a retry button, and an empty state.
- **English site, layered content.** Base files live in `content/id/`; `content/en/` holds the English text and overrides matching keys. Any key missing in English falls back to the base file.
- **Skill-based filtering.** Selecting a technical-skill icon shows only the projects that use that tool.
- **Lightbox** for screenshots, book covers, and certificates, with zoom and keyboard navigation. PDFs are previewed in place.
- **Cursor glow** that follows the mouse using `requestAnimationFrame` and linear interpolation. It turns off on touch screens and when reduced motion is requested.
- **Accessibility:** semantic HTML, native `<dialog>`, visible focus states, a skip link, 44 px touch targets, and WCAG AA contrast.

## Tech stack

| Area | Choice |
|---|---|
| Markup | Semantic HTML5 |
| Styling | CSS custom properties, Grid, Flexbox, `backdrop-filter` |
| Scripting | Vanilla JavaScript (ES modules) |
| Typography | [Plus Jakarta Sans](https://github.com/tokotype/PlusJakartaSans), self-hosted (SIL OFL 1.1) |
| Hosting | GitHub Pages |

## Project structure

```
.
├── index.html
├── css/styles.css
├── js/
│   ├── content.js          # .txt parser and content loader
│   └── main.js             # rendering, filter, dialogs, lightbox, carousel
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
    ├── contact/   tools/   fonts/
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
- An empty value (for example `LINK_DEMO:`) hides that button or block.
- Names in a project's `TOOLS:` must match `NAMA:` in `tools.txt` for the skill filter to work.

### Adding a featured project

1. Copy any file in `content/id/projects/` and rename it, for example `new-project.txt`.
2. Put up to four screenshots in `assets/projects/new-project/` (16:10, about 1600×1000 px).
3. Add `- new-project` under `PROYEK:` in `content/manifest.txt`.
4. Add `content/en/projects/new-project.txt` with the English text for the keys shown on the site.

### Adding a smaller project or a publication

Copy `_template.txt` in `content/id/more-projects/` or `content/id/publications/`, fill it in, then list the new file name under `PROYEK_LAINNYA:` or `PUBLIKASI:` in `content/manifest.txt`.

### Photo, CV, and certificates

| Item | Location | Then set |
|---|---|---|
| Profile photo (square or 4:5, at least 800 px) | `assets/personal/` | `FOTO:` in `content/id/profile.txt` |
| CV (PDF) | `assets/documents/` | `CV:` in `content/id/profile.txt` |
| Certificate image / PDF | `assets/certificates/` | `GAMBAR:`, `PDF:`, `LINK:` in `content/id/certificates.txt` |

## Deployment

The site is published with GitHub Pages from the `main` branch root (**Settings → Pages → Deploy from a branch**). Every push to `main` updates [febrianggi.github.io](https://febrianggi.github.io) within a minute or two.

## Credits

- Layout and section order follow the portfolio of **Humaira Zeanova**.
- Tool and contact icons are reused from the reference portfolios this site is based on.
- Plus Jakarta Sans © The Plus Jakarta Sans Project Authors, licensed under the SIL Open Font License 1.1.

## Contact

- Email: [febrianggicaesarimmanuel@gmail.com](mailto:febrianggicaesarimmanuel@gmail.com)
- LinkedIn: [in/febrianggi](https://www.linkedin.com/in/febrianggi/)
- GitHub: [Febrianggi](https://github.com/Febrianggi)
- Instagram: [@febri.immanuel_](https://www.instagram.com/febri.immanuel_/)

---

<div align="center">© 2026 Febrianggi Caesar Immanuel</div>
