// /api/private/trash.js
// POST -> move to trash (create marker). DELETE -> restore (remove marker).
// Node runtime to use @vercel/blob put()/del()
export const config = { runtime: 'nodejs' };
import { put, del, list } from '@vercel/blob';

function requireAdmin(req) {
  const cookies = req.headers.get('cookie') || '';
  const m = (`; ${cookies}`).match(/;\s*sb_role=([^;]+)/);
  const role = m ? decodeURIComponent(m[1]) : '';
  if (role !== 'admin') {
    return new Response('Forbidden', { status: 403 });
  }
  return null;
}

function markerPrefixFor(pathname) {
  return `trash-manifest/${encodeURIComponent(pathname)}__`;
}

export default async function handler(req) {
  const forbidden = requireAdmin(req);
  if (forbidden) return forbidden;

  if (req.method === 'POST') {
    const { pathname } = await req.json();
    if (!pathname || !pathname.startsWith('vault/')) return new Response('Bad Request', { status: 400 });
    const key = markerPrefixFor(pathname) + Date.now() + '.json';
    await put(key, JSON.stringify({ pathname, trashedAt: new Date().toISOString() }), { access: 'public' });
    return new Response(null, { status: 204 });
  }

  if (req.method === 'DELETE') {
    const url = new URL(req.url);
    const pathname = url.searchParams.get('pathname') || '';
    if (!pathname || !pathname.startsWith('vault/')) return new Response('Bad Request', { status: 400 });
    const prefix = markerPrefixFor(pathname);
    const { blobs } = await list({ prefix });
    await Promise.all(blobs.map(b => del(b.url)));
    return new Response(null, { status: 204 });
  }

  return new Response('Method Not Allowed', { status: 405 });
}
