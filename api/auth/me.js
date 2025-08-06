// api/auth/me.js
export const config = { runtime: 'nodejs' };
import { getRole } from '../_session.js';

export default async function handler(req, res) {
  const role = getRole(req);
  if (!role) { res.statusCode = 401; return res.end('Unauthorized'); }
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ role }));
}
