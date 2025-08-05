// /api/private/trash.js
export const config = { runtime: 'nodejs' }; // uses Node to call put()/del()
import { put, del, list } from '@vercel/blob';

function requireAdmin(req) {
  const header = req.headers.get('authorization') || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme !== 'Basic' || !encoded) {
    return new Response('Forbidden', { status: 403 });
  }
  try {
    const decoded = atob(encoded);
    const i = decoded.indexOf(':');
    const user = decoded.slice(0, i);
    const pass = decoded.slice(i + 1);
    const adminUser = (process.env.BASIC_AUTH_ADMIN_USER || '');
    const adminPass = (process.env.BASIC_AUTH_ADMIN_PASS || '');
    if (user !== adminUser || pass !== adminPass) {
      return new Response('Forbidden', { status: 403 });
    }
    return null;
  } catch {
    return new Response('Forbidden', { status: 403 });
  }
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
