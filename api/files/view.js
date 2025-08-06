export const config = { runtime: 'nodejs' };
import { getRole } from '../_session.js';
import { list } from '@vercel/blob';

export default async function handler(req, res) {
  const role = getRole(req);
  if (!role) { res.statusCode = 401; return res.end('Unauthorized'); }

  const url = new URL(req.url, 'http://localhost');
  const pathname = url.searchParams.get('pathname') || '';
  if (!pathname.startsWith('productexamples/media/')) { res.statusCode = 400; return res.end('Bad Request'); }

  const { blobs } = await list({ prefix: pathname });
  const blob = blobs.find(b => b.pathname === pathname);
  if (!blob) { res.statusCode = 404; return res.end('Not Found'); }

  const upstream = await fetch(blob.url, { cache: 'no-store' });
  if (!upstream.ok || !upstream.body) { res.statusCode = 502; return res.end('Upstream error'); }

  res.statusCode = 200;
  res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/octet-stream');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Disposition', 'inline');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');

  const reader = upstream.body.getReader();
  function pump() {
    return reader.read().then(({ done, value }) => {
      if (done) { res.end(); return; }
      res.write(value);
      return pump();
    }).catch(() => { try { res.end(); } catch {} });
  }
  pump();
}
