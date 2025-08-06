export const config = { runtime: 'nodejs' };
import { put } from '@vercel/blob';

async function getDropboxAccessToken() {
  const { DROPBOX_APP_KEY, DROPBOX_APP_SECRET, DROPBOX_REFRESH_TOKEN } = process.env;
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: DROPBOX_REFRESH_TOKEN || '',
    client_id: DROPBOX_APP_KEY || '',
    client_secret: DROPBOX_APP_SECRET || ''
  });
  const r = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body
  });
  if (!r.ok) throw new Error(`Dropbox token refresh failed: ${r.status}`);
  return (await r.json()).access_token;
}

async function listDropboxFilesRecursive(accessToken, basePath) {
  const headers = { 'content-type': 'application/json', 'authorization': `Bearer ${accessToken}` };
  const files = [];
  let r = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
    method: 'POST',
    headers,
    body: JSON.stringify({ path: basePath || '', recursive: true, include_non_downloadable_files: false })
  });
  if (!r.ok) throw new Error(`list_folder failed: ${r.status}`);
  let json = await r.json();
  const pushFiles = (entries) => { for (const e of entries || []) if (e['.tag'] === 'file') files.push(e); };
  pushFiles(json.entries);
  while (json.has_more) {
    r = await fetch('https://api.dropboxapi.com/2/files/list_folder/continue', {
      method: 'POST',
      headers,
      body: JSON.stringify({ cursor: json.cursor })
    });
    if (!r.ok) throw new Error(`list_folder/continue failed: ${r.status}`);
    json = await r.json();
    pushFiles(json.entries);
  }
  return files;
}

async function getTemporaryLink(accessToken, pathOrId) {
  const r = await fetch('https://api.dropboxapi.com/2/files/get_temporary_link', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'authorization': `Bearer ${accessToken}` },
    body: JSON.stringify({ path: pathOrId })
  });
  if (!r.ok) throw new Error(`get_temporary_link failed: ${r.status}`);
  return (await r.json()).link;
}

export default async function handler(req, res) {
  try {
    const want = process.env.SYNC_SECRET || '';
    const got = req.headers['x-sync-secret'] || new URL(req.url, 'http://x').searchParams.get('key') || '';
    if (want && String(want) !== String(got)) { res.statusCode = 401; return res.end('Unauthorized'); }

    const accessToken = await getDropboxAccessToken();

    const base = (process.env.DROPBOX_FOLDER || '').replace(/^\/+|\/+$/g, '');
    const fullBase = base ? '/' + base : '';

    const allFiles = await listDropboxFilesRecursive(accessToken, fullBase);

    const allowed = new Set(['png','jpg','jpeg','mp4']);
    const cand = allFiles.filter(f => allowed.has((f.name.split('.').pop() || '').toLowerCase()));

    const prefix = 'productexamples/media/';
    const cap = Number(process.env.SYNC_MAX_FILES || 50);
    let uploaded = 0;

    for (const f of cand.slice(0, cap)) {
      const link = await getTemporaryLink(accessToken, f.id);
      const upstream = await fetch(link);
      if (!upstream.ok || !upstream.body) throw new Error(`download failed: ${f.name}`);

      const display = f.path_display || f.path_lower || f.name;

      let rel = display.replace(/^\/+/, '');
      if (base && rel.toLowerCase().startsWith(base.toLowerCase() + '/')) {
        rel = rel.slice(base.length + 1);
      }
      rel = rel.replace(/^\/+/, '');

      await put(prefix + rel, upstream.body, {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true
      });
      uploaded++;
    }

    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ base: fullBase || '/', considered: cand.length, uploaded, cap }));
  } catch (err) {
    res.statusCode = 500;
    res.end(String(err?.message || err));
  }
}
