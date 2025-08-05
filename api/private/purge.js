// /api/private/purge.js
// Purge permanently deletes blobs that have a trash marker older than 7 days.
// Safe to run multiple times a day.
export const config = { runtime: 'edge' };
import { list, del } from '@vercel/blob';

function days(n) { return n * 24 * 60 * 60 * 1000; }

export default async function handler(req) {
  // Only allow POST from UI or scheduled GET/POST from Vercel Cron
  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const now = Date.now();
  const cutoff = now - days(7);

  // Load all markers
  const markers = await list({ prefix: 'trash-manifest/' });
  const toDelete = [];

  for (const m of markers.blobs) {
    const fname = m.pathname.split('/').pop() || '';
    const [encodedPath, epochWithExt] = fname.split('__');
    if (!encodedPath || !epochWithExt) continue;
    const epochStr = epochWithExt.replace('.json','');
    const trashedAt = parseInt(epochStr, 10);
    if (Number.isNaN(trashedAt) || trashedAt > cutoff) continue;

    const pathname = decodeURIComponent(encodedPath);
    toDelete.push({ pathname, markerUrl: m.url });
  }

  // For each eligible item: delete blob (if exists) and remove all markers for it
  for (const item of toDelete) {
    // delete the blob
    const { blobs } = await list({ prefix: item.pathname });
    const blob = blobs.find(b => b.pathname === item.pathname);
    if (blob) {
      await del(blob.url);
    }
    // remove all markers for this pathname
    const { blobs: markersFor } = await list({ prefix: `trash-manifest/${encodeURIComponent(item.pathname)}__` });
    await Promise.all(markersFor.map(b => del(b.url)));
  }

  return new Response(JSON.stringify({ purged: toDelete.length }), {
    headers: { 'content-type': 'application/json' }
  });
}
