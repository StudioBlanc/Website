// api/private/me.js
export const config = { runtime: 'nodejs' };

// returns: 'admin' | 'client' | null
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
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ role }));
}
