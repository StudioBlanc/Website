// api/private/index.js
export const config = { runtime: 'nodejs' };

import fs from 'node:fs/promises';
import path from 'node:path';

function checkRole(req) {
  const header = req.headers.authorization || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme !== 'Basic' || !encoded) return null;
  const [user, pass] = Buffer.from(encoded, 'base64').toString().split(':');
  const ADMIN_U  = process.env.BASIC_AUTH_ADMIN_USER  || '';
  const ADMIN_P  = process.env.BASIC_AUTH_ADMIN_PASS  || '';
  const CLIENT_U = process.env.BASIC_AUTH_CLIENT_USER || '';
  const CLIENT_P = process.env.BASIC_AUTH_CLIENT_PASS || '';
  if (user === ADMIN_U && pass === ADMIN_P) return 'admin';
  if (user === CLIENT_U && pass === CLIENT_P) return 'client';
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

  const filePath = path.join(process.cwd(), 'private', 'index.html');
  const html = await fs.readFile(filePath, 'utf8');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(html);
}
