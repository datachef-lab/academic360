/**
 * Federated catalog search via SRU (Search/Retrieve via URL) — the modern
 * REST-style successor to Z39.50. Targets the Library of Congress SRU
 * endpoint by default but the URL is configurable via SRU_ENDPOINT env.
 *
 * Returns importable bibliographic records (parsed loosely from the SRU
 * MARCXML / Dublin Core response) so the librarian can pick one and have it
 * create a draft `books` row via the existing POST /api/library/books.
 *
 * Network-bound — we do not cache. Calling code should debounce.
 */

const DEFAULT_SRU = process.env.SRU_ENDPOINT ?? "https://lx2.loc.gov:210/lcdb";

export type FederatedHit = {
  source: string;
  title: string;
  subTitle: string | null;
  author: string | null;
  publisher: string | null;
  publishedYear: string | null;
  isbn: string | null;
  raw: string;
};

const innerText = (
  xml: string,
  tag: string,
  startIdx = 0,
): { value: string | null; end: number } => {
  const open = xml.indexOf(`<${tag}`, startIdx);
  if (open < 0) return { value: null, end: -1 };
  const close = xml.indexOf(`</${tag}>`, open);
  if (close < 0) return { value: null, end: -1 };
  const afterAttrs = xml.indexOf(">", open);
  if (afterAttrs < 0 || afterAttrs > close) return { value: null, end: -1 };
  return {
    value: xml.slice(afterAttrs + 1, close).trim(),
    end: close + tag.length + 3,
  };
};

// MARCXML subfield extractor: <datafield tag="245"><subfield code="a">title</subfield>…</datafield>
const subfield = (record: string, tag: string, code: string): string | null => {
  const re = new RegExp(
    `<datafield[^>]+tag="${tag}"[^>]*>([\\s\\S]*?)</datafield>`,
    "i",
  );
  const m = re.exec(record);
  if (!m) return null;
  const subRe = new RegExp(
    `<subfield[^>]+code="${code}"[^>]*>([\\s\\S]*?)</subfield>`,
    "i",
  );
  const s = subRe.exec(m[1]);
  return s ? s[1].trim().replace(/[\s/:,.;]+$/, "") : null;
};

function parseMarcXmlRecords(xml: string): FederatedHit[] {
  const hits: FederatedHit[] = [];
  const recordRe = /<record[\s\S]*?<\/record>/gi;
  let m: RegExpExecArray | null;
  while ((m = recordRe.exec(xml)) !== null) {
    const r = m[0];
    const title = subfield(r, "245", "a");
    if (!title) continue;
    hits.push({
      source: "LoC SRU",
      title,
      subTitle: subfield(r, "245", "b"),
      author: subfield(r, "100", "a") ?? subfield(r, "110", "a"),
      publisher: subfield(r, "260", "b") ?? subfield(r, "264", "b"),
      publishedYear:
        (subfield(r, "260", "c") ?? subfield(r, "264", "c"))
          ?.replace(/\D+/g, "")
          .slice(0, 4) ?? null,
      isbn: subfield(r, "020", "a")?.split(/\s+/)[0] ?? null,
      raw: r,
    });
  }
  return hits;
}

export async function federatedSearch(
  query: string,
  maxRecords: number = 10,
): Promise<FederatedHit[]> {
  const q = query.trim();
  if (!q) return [];
  const url = new URL(DEFAULT_SRU);
  url.searchParams.set("version", "1.1");
  url.searchParams.set("operation", "searchRetrieve");
  url.searchParams.set("recordSchema", "marcxml");
  url.searchParams.set("maximumRecords", String(Math.min(maxRecords, 25)));
  url.searchParams.set("query", `bath.title="${q}"`);
  const res = await fetch(url.toString(), {
    headers: { Accept: "application/xml" },
  });
  if (!res.ok) {
    throw new Error(`SRU upstream returned ${res.status}`);
  }
  const xml = await res.text();
  return parseMarcXmlRecords(xml);
}
