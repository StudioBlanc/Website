// api/auth/login.js
export const config = { runtime: 'nodejs' };
import { setSession } from '../_session.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.statusCode = 405; return res.end('Method Not Allowed'); }

  // Parse form
  const chunks = []; for await (const c of req) chunks.push(c);
  const body = Buffer.concat(chunks).toString();
  const params = new URLSearchParams(body);

  const password = params.get('password') || '';
  const roleReq = (params.get('role') || 'client').toLowerCase();

  const ADMIN_P = process.env.ADMIN_PASSWORD || '';
  const CLIENT_P = process.env.CLIENT_PASSWORD || '';

  let role = null;
  if (roleReq === 'admin' && password === ADMIN_P) role = 'admin';
  if (roleReq === 'client' && password === CLIENT_P) role = 'client';
  if (!role) { res.statusCode = 401; return res.end('Invalid password'); }

  setSession(res, role);
  res.statusCode = 302;
  res.setHeader('Location', '/portfolio/');
  res.end();
}
