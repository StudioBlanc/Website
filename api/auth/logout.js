// api/auth/logout.js
export const config = { runtime: 'nodejs' };
import { clearSession } from '../_session.js';

export default async function handler(req, res) {
  clearSession(res);
  res.statusCode = 302;
  res.setHeader('Location', '/login.html');
  res.end();
}
