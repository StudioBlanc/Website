// api/private/view.js
export const config = { runtime: 'nodejs' };
import { list } from '@vercel/blob';

function checkRole(req) {
  const header = req.headers.authorization || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme !== 'Basic' || !encoded) return null;
  const [user, pass] = Buffer.from(encoded, 'base64').toString().split(':');
  if (user === (process.env.BASIC_AUTH_ADMIN_USER || '') &&
      pass === (process.env.BASIC_AUTH_ADMIN_PASS || '')) return 'admin';
  if (user === (process.env.BASIC_AUTH_CLIENT_USER || '') &&
      pass === (process.env.BASIC_AUTH_CLIENT_PASS || '')) return 'client';
  return null;
}

export default async function handler(req, res) {
  const role = checkRole(req);
  if (!role) {
    res.statusCode = 401;
    res.setHeader('WWW-Authenticate', 'Basic realm="Studio Blanc Private"');
    res.end('Authentication required');
    return;
  }

  const url = new URL(req.url, 'http://localhost');
  const pathname = url.searchParams.get('pathname') || '';
  if (!pathname.startsWith('vault/')) {
    res.statusCode = 400; res.end('Bad Request'); return;
  }

  const { blobs } = await list({ prefix: pathname });
  const blob = blobs.find(b => b.pathname === pathname);
  if (!blob) { res.statusCode = 404; res.end('Not Found'); return; }

  const upstream = await fetch(blob.url, { cache: 'no-store' });
  if (!upstream.ok || !upstream.body) {
    res.statusCode = 502; res.end('Upstream error'); return;
  }

  // Pass through body with restrictive headers
  res.statusCode = 200;
  res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/octet-stream');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Disposition', 'inline');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');

  upstream.body.pipeTo(new WritableStream({
    write(chunk) { res.write(chunk); },
    close() { res.end(); },
    abort() { res.end(); }
  }));
}
