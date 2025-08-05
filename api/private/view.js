// /api/private/view.js
export const config = { runtime: 'edge' };
import { list } from '@vercel/blob';

export default async function handler(request) {
  const { searchParams } = new URL(request.url);
  const pathname = searchParams.get('pathname') || '';

  if (!pathname.startsWith('vault/')) return new Response('Bad Request', { status: 400 });

  const { blobs } = await list({ prefix: pathname });
  const blob = blobs.find(b => b.pathname === pathname);
  if (!blob) return new Response('Not Found', { status: 404 });

  const upstream = await fetch(blob.url, { cache: 'no-store' });
  if (!upstream.ok || !upstream.body) return new Response('Upstream error', { status: 502 });

  const headers = new Headers();
  headers.set('content-type', upstream.headers.get('content-type') || 'application/octet-stream');
  headers.set('cache-control', 'no-store');
  headers.set('x-content-type-options', 'nosniff');
  headers.set('content-disposition', 'inline');
  headers.set('referrer-policy', 'no-referrer');
  headers.set('x-frame-options', 'DENY');

  return new Response(upstream.body, { status: 200, headers });
}
