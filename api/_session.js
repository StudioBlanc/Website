// api/_session.js
import crypto from 'node:crypto';
const COOKIE = 'sb_sess';
const MAX_AGE = 60 * 60 * 12; // 12h

function sign(v) {
  const h = crypto.createHmac('sha256', process.env.SESSION_SECRET || 'change-me');
  h.update(v);
  return h.digest('hex');
}

export function setSession(res, role) {
  const val = `${role}.${sign(role)}`;
  res.setHeader('Set-Cookie', `${COOKIE}=${val}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${MAX_AGE}`);
}

export function clearSession(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`);
}

export function getRole(req) {
  const raw = req.headers.cookie || '';
  const m = raw.match(/sb_sess=([^;]+)/);
  if (!m) return null;
  const [role, sig] = decodeURIComponent(m[1]).split('.');
  if (!role || !sig) return null;
  if (sign(role) !== sig) return null;
  return role === 'admin' ? 'admin' : 'client';
}
