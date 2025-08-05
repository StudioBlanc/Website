// /api/private/list.js
export const config = { runtime: 'edge' };
import { list, head } from '@vercel/blob';

function decodeName(name) {
  try { return decodeURIComponent(name); } catch { return name; }
}

export default async function handler(req) {
  const url = new URL(req.url);
  const includeTrashed = url.searchParams.get('trashed') === '1';

  // 1) List all blobs under vault/
  const { blobs } = await list({ prefix: 'vault/' });

  // 2) Build set of trashed pathnames by scanning marker files under trash-manifest/
  const markers = await list({ prefix: 'trash-manifest/' });
  const trashedSet = new Set();
  for (const m of markers.blobs) {
    // marker name pattern: trash-manifest/<encodedPathname>__<epoch>.json
    const fname = m.pathname.split('/').pop() || '';
    const base = fname.split('__')[0];
    if (!base) continue;
    const pathname = decodeName(base);
    trashedSet.add(pathname);
  }

  // 3) Map blobs -> items with contentType
  const detailed = await Promise.all(
    blobs.map(async b => {
      let ct;
      try {
        const meta = await head(b.url);
        ct = meta.contentType;
      } catch {}
      return { pathname: b.pathname, size: b.size, uploadedAt: b.uploadedAt, contentType: ct, trashed: trashedSet.has(b.pathname) };
    })
  );

  const items = detailed.filter(d => includeTrashed ? d.trashed : !d.trashed);

  return new Response(JSON.stringify({ items }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
  });
}
