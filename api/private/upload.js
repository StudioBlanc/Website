// /api/private/upload.js
export const config = { runtime: 'edge' };
import { handleUpload } from '@vercel/blob/client';

function requireAdmin(req) {
  const header = req.headers.get('authorization') || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme !== 'Basic' || !encoded) {
    return new Response('Forbidden', { status: 403 });
  }
  try {
    const decoded = atob(encoded);
    const i = decoded.indexOf(':');
    const user = decoded.slice(0, i);
    const pass = decoded.slice(i + 1);
    const adminUser = (process.env.BASIC_AUTH_ADMIN_USER || '');
    const adminPass = (process.env.BASIC_AUTH_ADMIN_PASS || '');
    if (user !== adminUser || pass !== adminPass) {
      return new Response('Forbidden', { status: 403 });
    }
    return null;
  } catch {
    return new Response('Forbidden', { status: 403 });
  }
}


export default async function handler(request) {
  const forbidden = requireAdmin(request);
  if (forbidden) return forbidden;

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  const body = await request.json();
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => ({ addRandomSuffix: true }),
      onUploadCompleted: async ({ blob }) => { console.log('Uploaded:', blob.url); }
    });
    return new Response(JSON.stringify(json), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err?.message || err) }), {
      status: 400,
      headers: { 'content-type': 'application/json' }
    });
  }
}
