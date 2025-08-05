// api/private/purge.js
export const config = { runtime: 'nodejs' };
import { list, del } from '@vercel/blob';

const DAY = 24 * 60 * 60 * 1000;

export default async function handler(req, res) {
  // Allow GET from Vercel Cron (x-vercel-cron) and POST (manual/admin)
  const isCron = !!req.headers['x-vercel-cron'];
  if (!(req.method === 'GET' || req.method === 'POST') || (!isCron && req.method === 'GET')) {
    res.statusCode = 405; res.end('Method Not Allowed'); return;
  }

  const now = Date.now();
  const cutoff = now - 7 * DAY;

  const markers = await list({ prefix: 'trash-manifest/' });
  const toDelete = [];

  for (const m of markers.blobs) {
    const fname = m.pathname.split('/').pop() || '';
    const [encodedPath, epochWithExt] = fname.split('__');
    const epochStr = (epochWithExt || '').replace('.json', '');
    const trashedAt = parseInt(epochStr, 10);
    if (!encodedPath || Number.isNaN(trashedAt) || trashedAt > cutoff) continue;
    toDelete.push({ pathname: decodeURIComponent(encodedPath) });
  }

  for (const item of toDelete) {
    const { blobs } = await list({ prefix: item.pathname });
    const blob = blobs.find(b => b.pathname === item.pathname);
    if (blob) await del(blob.url);
    const { blobs: markersFor } = await list({ prefix: `trash-manifest/${encodeURIComponent(item.pathname)}__` });
    await Promise.all(markersFor.map(b => del(b.url)));
  }

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ purged: toDelete.length }));
}
