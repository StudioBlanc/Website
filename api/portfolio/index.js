export const config = { runtime: 'nodejs' };
import { getRole } from '..//_session.js';

const HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Studio Blanc — Portfolio</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex,nofollow" />
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               img-src 'self' blob: data: https:;
               media-src 'self' blob: https:;
               style-src 'self' 'unsafe-inline';
               script-src 'self' 'unsafe-inline';
               connect-src 'self';
               frame-ancestors 'none';
               upgrade-insecure-requests">
<style>
:root { --bg:#F6F3EC; --fg:#222; --muted:#888; --card:#ffffff; }
html,body{ margin:0; padding:0; background:var(--bg); color:var(--fg); font-family: system-ui, Arial, sans-serif; }
header{ display:flex; align-items:center; justify-content:space-between; padding:14px 18px; border-bottom:1px solid #eaeaea; }
.brand{ font-weight:700; letter-spacing:.4px; }
.role{ color: var(--muted); font-size:.9rem; }
main{ padding:18px; max-width:1200px; margin:0 auto; }
.grid{ display:grid; grid-template-columns: repeat(auto-fill, minmax(240px,1fr)); gap:16px; }
.card{ background:var(--card); border:1px solid #eaeaea; border-radius:12px; padding:10px; position:relative; box-shadow:0 1px 2px rgba(0,0,0,.04); cursor:pointer; }
.thumb{ width:100%; height:180px; object-fit:cover; border-radius:8px; background:#f4f4f4; }
.muted{ color:var(--muted); }
.error{ background:#ffecec; border:1px solid #ffb6b6; color:#a40000; padding:10px; border-radius:8px; margin:12px 0; display:none; }
.lightbox{ position:fixed; inset:0; background:rgba(0,0,0,.9); display:none; align-items:center; justify-content:center; z-index:100; }
.lightbox.visible{ display:flex; }
.lightbox-content{ max-width:92vw; max-height:92vh; }
.lightbox-close{ position:absolute; top:18px; right:18px; background:#fff; border-radius:8px; padding:8px 10px; cursor:pointer; }
button,.btn{ border:1px solid #ccc; background:#fff; padding:8px 10px; border-radius:8px; cursor:pointer; }
</style>
</head>
<body>
<header>
  <div class="brand">Studio Blanc — Portfolio</div>
  <div>
    <span class="role" id="roleLabel">Client</span>
    <a class="btn" href="/api/auth/logout" style="margin-left:10px">Logout</a>
  </div>
</header>

<main>
  <div id="err" class="error"></div>
  <div id="grid" class="grid"></div>
</main>

<div id="lightbox" class="lightbox" role="dialog" aria-modal="true">
  <button id="lbClose" class="lightbox-close">Close</button>
  <div id="lbContent" class="lightbox-content"></div>
</div>

<script>
const grid = document.getElementById('grid');
const errBox = document.getElementById('err');
const lb = document.getElementById('lightbox');
const lbC = document.getElementById('lbContent');
const lbClose = document.getElementById('lbClose');

document.addEventListener('contextmenu', (e) => e.preventDefault());
function showError(msg){ errBox.textContent = msg; errBox.style.display = 'block'; }
function openLightbox(node){ lbC.innerHTML=''; lbC.appendChild(node); lb.classList.add('visible'); }
lbClose.addEventListener('click', ()=> lb.classList.remove('visible'));
lb.addEventListener('click', (e)=> { if (e.target === lb) lb.classList.remove('visible'); });

function cardFor(item) {
  const card = document.createElement('div'); card.className='card';
  const label = document.createElement('div'); label.className='muted'; label.style.fontSize='.85rem';
  label.textContent = item.pathname.split('/').pop(); card.appendChild(label);

  const src = '/api/files/view?pathname=' + encodeURIComponent(item.pathname);
  const ct = (item.contentType || '').toLowerCase();
  if (ct.startsWith('image/')) {
    const img = document.createElement('img'); img.src = src; img.alt = item.pathname; img.className='thumb';
    img.addEventListener('click', ()=> { const big = new Image(); big.src = src; big.style.maxWidth='100%'; big.style.maxHeight='100%'; openLightbox(big); });
    card.appendChild(img);
  } else if (ct.startsWith('video/')) {
    const vid = document.createElement('video'); vid.src = src; vid.className='thumb'; vid.controls=true; vid.controlsList='nodownload noremoteplayback'; vid.disablePictureInPicture=true;
    vid.addEventListener('click', ()=> { const v = document.createElement('video'); v.src = src; v.controls=true; v.autoplay=true; v.style.maxWidth='100%'; v.style.maxHeight='100%'; openLightbox(v); });
    card.appendChild(vid);
  } else {
    const a = document.createElement('a'); a.href = src; a.target='_blank'; a.textContent='Open'; card.appendChild(a);
  }
  return card;
}

async function load() {
  const r = await fetch('/api/auth/me', { cache:'no-store' });
  if (r.status === 401) { location.href = '/login.html'; return; }

  const r2 = await fetch('/api/files/list', { cache:'no-store' });
  if (!r2.ok) { showError('List failed: ' + r2.status); return; }
  const data = await r2.json();
  grid.innerHTML = '';
  for (const it of (data.items || [])) grid.appendChild(cardFor(it));
}

load();
</script>
</body>
</html>`;

export default async function handler(req, res) {
  const role = getRole(req);
  if (!role) { res.statusCode = 302; res.setHeader('Location','/login.html'); return res.end(); }
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(HTML);
}
