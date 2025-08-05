// /api/private/me.js
export const config = { runtime: 'edge' };

function getCookie(cookies, name) {
  const m = (`; ${cookies || ''}`).match(`;\s*${name}=([^;]+)`);
  return m ? decodeURIComponent(m[1]) : '';
}

export default async function handler(req) {
  const role = getCookie(req.headers.get('cookie'), 'sb_role') || 'client';
  return new Response(JSON.stringify({ role }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
  });
}
