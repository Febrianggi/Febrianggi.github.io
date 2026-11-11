// Pembaca konten .txt: parser format "KUNCI: nilai" + loader dua bahasa.
//
// Aturan format (lihat juga README.md):
//   KUNCI: nilai             -> kunci huruf besar (A-Z, 0-9, _) di awal baris
//   baris lanjutan           -> menyambung nilai kunci sebelumnya
//   (baris kosong)           -> pemisah paragraf
//   - item                   -> jika semua baris diawali "- ", nilainya jadi daftar
//   ---                      -> pemisah entri (untuk file berisi banyak entri)
//   # komentar               -> diabaikan

const KEY_LINE = /^([A-Z][A-Z0-9_]*):[ \t]?(.*)$/;

export function parse(text) {
  const records = [];
  let record = {};
  let key = null;

  const flush = () => {
    if (Object.keys(record).length) records.push(finalize(record));
    record = {};
    key = null;
  };

  for (const raw of text.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.replace(/\s+$/, "");
    if (/^\s*#/.test(line)) continue;
    if (/^-{3,}$/.test(line.trim())) { flush(); continue; }
    const match = line.match(KEY_LINE);
    if (match) {
      key = match[1];
      record[key] = match[2] ? [match[2]] : [];
      continue;
    }
    if (key) record[key].push(line.trim());
  }
  flush();
  return records;
}

function finalize(record) {
  const out = {};
  for (const [key, lines] of Object.entries(record)) {
    while (lines.length && !lines[0]) lines.shift();
    while (lines.length && !lines[lines.length - 1]) lines.pop();
    const filled = lines.filter(Boolean);
    if (filled.length && filled.every(l => l.startsWith("- "))) {
      out[key] = filled.map(l => l.slice(2).trim());
    } else {
      // gabungkan baris menjadi paragraf, baris kosong = paragraf baru
      out[key] = lines.join("\n").split(/\n{2,}/).map(p => p.replace(/\n/g, " ").trim()).filter(Boolean).join("\n\n");
    }
  }
  return out;
}

// Gabungkan versi bahasa lain di atas versi dasar (Indonesia).
// Entri dicocokkan menurut urutan; kunci yang tidak ada di versi lain memakai versi dasar.
function merge(base, over) {
  return base.map((record, i) => {
    const extra = over[i] || {};
    const merged = { ...record };
    for (const [k, v] of Object.entries(extra)) {
      if (v !== "" && !(Array.isArray(v) && !v.length)) merged[k] = v;
    }
    return merged;
  });
}

export class ContentError extends Error {
  constructor(file, status) {
    super(`${file} (${status})`);
    this.file = file;
    this.status = status;
  }
}

async function fetchText(path) {
  let response;
  try {
    response = await fetch(path, { cache: "no-cache" });
  } catch {
    throw new ContentError(path, "network");
  }
  if (!response.ok) throw new ContentError(path, response.status);
  return response.text();
}

const cache = new Map();

/** Muat file konten. `file` relatif terhadap content/<bahasa>/, misalnya "about.txt". */
export async function load(file, lang = "id", { shared = false } = {}) {
  const id = `${lang}:${shared}:${file}`;
  if (cache.has(id)) return cache.get(id);

  const promise = (async () => {
    if (shared) return parse(await fetchText(`content/${file}`));
    const base = parse(await fetchText(`content/id/${file}`));
    if (lang === "id") return base;
    try {
      return merge(base, parse(await fetchText(`content/${lang}/${file}`)));
    } catch {
      return base; // terjemahan belum ada: tampilkan versi Indonesia
    }
  })();

  cache.set(id, promise);
  promise.catch(() => cache.delete(id));
  return promise;
}

/** Ubah "a, b, c" menjadi ["a","b","c"]. */
export const splitList = value => (Array.isArray(value) ? value : (value || "").split(","))
  .map(s => s.trim()).filter(Boolean);

/** Ubah daftar "path | alt" menjadi [{src, alt}]. */
export const parseImages = value => (Array.isArray(value) ? value : (value ? [value] : []))
  .map(item => {
    const [src, ...alt] = item.split("|");
    return { src: src.trim(), alt: alt.join("|").trim() };
  })
  .filter(img => img.src);
