// api/private/list.js
export const config = { runtime: 'nodejs' };
import { list, head } from '@vercel/blob';

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

  const url = new URL(req.url, 'http://localhost'); // base for parsing
  const includeTrashed = url.searchParams.get('trashed') === '1';

  const { blobs } = await list({ prefix: 'vault/' });

  // Build trashed set from markers: trash-manifest/<encodedPath>__<epoch>.json
  const markers = await list({ prefix: 'trash-manifest/' });
  const trashedSet = new Set(
    markers.blobs
      .map(b => b.pathname.split('/').pop() || '')
      .map(name => name.split('__')[0])
      .filter(Boolean)
      .map(enc => decodeURIComponent(enc))
  );

  const items = [];
  for (const b of blobs) {
    let ct;
    try { ct = (await head(b.url)).contentType; } catch {}
    const trashed = trashedSet.has(b.pathname);
    if (includeTrashed ? !trashed : trashed) continue;
    items.push({ pathname: b.pathname, size: b.size, uploadedAt: b.uploadedAt, contentType: ct, trashed });
  }

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ items }));
}
