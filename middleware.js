// middleware.js (framework-agnostic Routing Middleware)
export const config = {
  matcher: ['/private/:path*', '/api/private/:path*'],
  runtime: 'edge',
};

function parseBasicAuth(header) {
  if (!header) return null;
  const [scheme, encoded] = header.split(' ');
  if (scheme !== 'Basic' || !encoded) return null;
  try {
    const decoded = atob(encoded);
    const idx = decoded.indexOf(':');
    if (idx === -1) return null;
    return { user: decoded.slice(0, idx), pass: decoded.slice(idx + 1) };
  } catch {
    return null;
  }
}

export default function middleware(request) {
  const auth = parseBasicAuth(request.headers.get('authorization') || '');
  const adminUser = (process.env.BASIC_AUTH_ADMIN_USER || '');
  const adminPass = (process.env.BASIC_AUTH_ADMIN_PASS || '');
  const clientUser = (process.env.BASIC_AUTH_CLIENT_USER || '');
  const clientPass = (process.env.BASIC_AUTH_CLIENT_PASS || '');

  const ok =
    auth &&
    ((auth.user === adminUser && auth.pass === adminPass) ||
     (auth.user === clientUser && auth.pass === clientPass));

  if (ok) {
    return; // continue
  }

  return new Response('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Studio Blanc Private"' }
  });
}
