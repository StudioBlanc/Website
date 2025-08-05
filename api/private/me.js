// /api/private/me.js
export const config = { runtime: 'edge' };

function parseBasicAuth(header) {
  if (!header) return null;
  const [scheme, encoded] = header.split(' ');
  if (scheme !== 'Basic' || !encoded) return null;
  try {
    const decoded = atob(encoded);
    const i = decoded.indexOf(':');
    if (i === -1) return null;
    return { user: decoded.slice(0, i), pass: decoded.slice(i + 1) };
  } catch { return null; }
}

export default async function handler(req) {
  const creds = parseBasicAuth(req.headers.get('authorization') || '');
  const adminUser = (process.env.BASIC_AUTH_ADMIN_USER || '');
  const adminPass = (process.env.BASIC_AUTH_ADMIN_PASS || '');
  const clientUser = (process.env.BASIC_AUTH_CLIENT_USER || '');
  const clientPass = (process.env.BASIC_AUTH_CLIENT_PASS || '');

  let role = 'client';
  if (creds && creds.user === adminUser && creds.pass === adminPass) role = 'admin';
  if (creds && creds.user === clientUser && creds.pass === clientPass) role = 'client';

  return new Response(JSON.stringify({ role }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
  });
}
