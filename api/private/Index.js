// api/private/index.js
export const config = { runtime: 'nodejs' };

import fs from 'node:fs/promises';
import path from 'node:path';

// Basic Auth check: returns 'admin' | 'client' | null
function checkAuth(req) {
  const header = req.headers?.authorization || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme !== 'Basic' || !encoded) return null;
  const [user, pass] = Buffer.from(encoded, 'base64').toString().split(':');
  const adminU  = process.env.BASIC_AUTH_ADMIN_USER  || '';
  const adminP  = process.env.BASIC_AUTH_ADMIN_PASS  || '';
  const clientU = process.env.BASIC_AUTH_CLIENT_USER || '';
  const clientP = process.env.BASIC_AUTH_CLIENT_PASS || '';
  if (user === adminU && pass === adminP) return 'admin';
  if (user === clientU && pass === clientP) return 'client';
  return null;
}

export default async function handler(req, res) {
  const role = checkAuth(req);
  if (!role) {
    res.statusCode = 401;
    res.setHeader('WWW-Authenticate', 'Basic realm="Studio Blanc Private"');
    res.end('Authentication required');
    return;
  }

  // Serve the existing HTML file
  const filePath = path.join(process.cwd(), 'private', 'index.html');
  const html = await fs.readFile(filePath, 'utf8');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(html);
}
