// /api/private/upload.js
export const config = { runtime: 'edge' };
import { handleUpload } from '@vercel/blob/client';

function requireAdmin(req) {
  const cookies = req.headers.get('cookie') || '';
  const m = (`; ${cookies}`).match(/;\s*sb_role=([^;]+)/);
  const role = m ? decodeURIComponent(m[1]) : '';
  if (role !== 'admin') {
    return new Response('Forbidden', { status: 403 });
  }
  return null;
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
      onBeforeGenerateToken: async (pathname) => {
        return { addRandomSuffix: true, tokenPayload: JSON.stringify({ when: Date.now() }) };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log('Uploaded:', blob.url);
      }
    });
    return new Response(JSON.stringify(json), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err?.message || err) }), {
      status: 400,
      headers: { 'content-type': 'application/json' }
    });
  }
}
