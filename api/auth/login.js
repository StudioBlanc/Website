export const config = { runtime: 'nodejs' };
import { setSession } from '../_session.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.statusCode = 405; return res.end('Method Not Allowed'); }

  const chunks = []; for await (const c of req) chunks.push(c);
  const body = Buffer.concat(chunks).toString();
  const params = new URLSearchParams(body);

  const password = params.get('password') || '';
  const CLIENT_P = process.env.CLIENT_PASSWORD || '';

  if (password !== CLIENT_P) { res.statusCode = 401; return res.end('Invalid password'); }

  setSession(res, 'client');
  res.statusCode = 302;
  res.setHeader('Location', '/portfolio/');
  res.end();
}
