// api/private/trash.js
export const config = { runtime: 'nodejs' };
import { put, del, list } from '@vercel/blob';

function requireAdmin(req) {
  const header = req.headers.authorization || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme !== 'Basic' || !encoded) return false;
  const [user, pass] = Buffer.from(encoded, 'base64').toString().split(':');
  return user === (process.env.BASIC_AUTH_ADMIN_USER || '') &&
         pass === (process.env.BASIC_AUTH_ADMIN_PASS || '');
}

function markerPrefixFor(pathname) {
  return `trash-manifest/${encodeURIComponent(pathname)}__`;
}

export default async function handler(req, res) {
  if (!requireAdmin(req)) {
    res.statusCode = 403; res.end('Forbidden'); return;
  }

  if (req.method === 'POST') {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const { pathname } = JSON.parse(Buffer.concat(chunks).toString() || '{}');
    if (!pathname || !pathname.startsWith('vault/')) { res.statusCode = 400; res.end('Bad Request'); return; }
    const key = markerPrefixFor(pathname) + Date.now() + '.json';
    await put(key, JSON.stringify({ pathname, trashedAt: new Date().toISOString() }), { access: 'public' });
    res.statusCode = 204; res.end(); return;
  }

  if (req.method === 'DELETE') {
    const url = new URL(req.url, 'http://localhost');
    const pathname = url.searchParams.get('pathname') || '';
    if (!pathname || !pathname.startsWith('vault/')) { res.statusCode = 400; res.end('Bad Request'); return; }
    const { blobs } = await list({ prefix: markerPrefixFor(pathname) });
    await Promise.all(blobs.map(b => del(b.url)));
    res.statusCode = 204; res.end(); return;
  }

  res.statusCode = 405; res.end('Method Not Allowed');
}
