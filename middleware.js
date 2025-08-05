// middleware.js
// Role-aware Basic Auth with session cookie (sb_role: admin|client)
import { NextResponse } from 'next/server';

export const config = { matcher: ['/private/:path*', '/api/private/:path*'] };

function expected(u, p) {
  if (!u || !p) return '';
  return 'Basic ' + btoa(`${u}:${p}`);
}

export default function middleware(req) {
  const auth = req.headers.get('authorization') || '';
  const isAdmin = auth === expected(process.env.BASIC_AUTH_ADMIN_USER, process.env.BASIC_AUTH_ADMIN_PASS);
  const isClient = auth === expected(process.env.BASIC_AUTH_CLIENT_USER, process.env.BASIC_AUTH_CLIENT_PASS);

  if (isAdmin || isClient) {
    const res = NextResponse.next();
    // short-lived cookie (12h); server still checks Basic Auth per request at the edge
    res.cookies.set('sb_role', isAdmin ? 'admin' : 'client', {
      httpOnly: true, secure: true, sameSite: 'Strict', path: '/', maxAge: 60 * 60 * 12
    });
    return res;
  }

  return new Response('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Studio Blanc Private"' }
  });
}
