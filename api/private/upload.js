// api/private/upload.js
export const config = { runtime: 'nodejs' };
import { handleUpload } from '@vercel/blob/client';

function requireAdmin(req) {
  const header = req.headers.authorization || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme !== 'Basic' || !encoded) return false;
  const [user, pass] = Buffer.from(encoded, 'base64').toString().split(':');
  return user === (process.env.BASIC_AUTH_ADMIN_USER || '') &&
         pass === (process.env.BASIC_AUTH_ADMIN_PASS || '');
}

export default async function handler(req, res) {
  if (!requireAdmin(req)) {
    res.statusCode = 403; res.end('Forbidden'); return;
  }
  if (req.method !== 'POST') {
    res.statusCode = 405; res.end('Method Not Allowed'); return;
  }

  // Read raw body and create a Fetch Request compatible with handleUpload
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const bodyStr = Buffer.concat(chunks).toString() || '{}';
  const body = JSON.parse(bodyStr);

  const request = new Request('https://example.com/api/private/upload', {
    method: 'POST',
    headers: { 'content-type': req.headers['content-type'] || 'application/json' }
  });

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname /*, clientPayload */) => ({
        // allow any type, add random suffix server-side too
        addRandomSuffix: true,
        tokenPayload: JSON.stringify({ when: Date.now() }),
      }),
      onUploadCompleted: async ({ blob }) => {
        console.log('Uploaded:', blob.url);
      }
    });

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(json));
  } catch (err) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: String(err?.message || err) }));
  }
}
