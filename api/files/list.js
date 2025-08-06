// api/files/list.js
export const config = { runtime: 'nodejs' };
import { getRole } from '../_session.js';
import { list, head } from '@vercel/blob';

export default async function handler(req, res) {
  const role = getRole(req);
  if (!role) { res.statusCode = 401; return res.end('Unauthorized'); }

  const prefix = 'productexamples/media/';
  const { blobs } = await list({ prefix });

  const items = [];
  for (const b of blobs) {
    let ct = '';
    try { ct = (await head(b.url)).contentType || ''; } catch {}
    items.push({ pathname: b.pathname, size: b.size, uploadedAt: b.uploadedAt, contentType: ct });
  }

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ items }));
}
