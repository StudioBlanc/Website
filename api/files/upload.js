export const config = { runtime: 'nodejs' };
import { getRole } from '../_session.js';
import { handleUpload } from '@vercel/blob/client';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204; res.setHeader('Allow', 'POST, OPTIONS'); return res.end();
  }

  const role = getRole(req);
  if (role !== 'admin') { res.statusCode = 403; return res.end('Forbidden'); }

  if (req.method !== 'POST') {
    res.statusCode = 405; res.setHeader('Allow', 'POST, OPTIONS'); return res.end('Method Not Allowed');
  }

  const chunks = []; for await (const c of req) chunks.push(c);
  let body = {};
  try { body = JSON.parse(Buffer.concat(chunks).toString() || '{}'); }
  catch { res.statusCode = 400; return res.end('Invalid JSON'); }

  const request = new Request('https://example.com/api/files/upload', {
    method: 'POST',
    headers: { 'content-type': req.headers['content-type'] || 'application/json' }
  });

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith('productexamples/media/')) throw new Error('Invalid path');
        const ext = (pathname.split('.').pop() || '').toLowerCase();
        if (!['png','jpg','jpeg','mp4'].includes(ext)) throw new Error('Only PNG, JPG, MP4 allowed');
        return { addRandomSuffix: true };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log('Uploaded:', blob.url');
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
