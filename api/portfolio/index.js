*** Begin Patch
*** Update File: api/portfolio/index.js
@@
-<header>
-  <div class="brand">Studio Blanc — Portfolio</div>
-  <div>
-    <span class="role" id="roleLabel">Client</span>
-    <a class="btn" href="/api/auth/logout" style="margin-left:10px">Logout</a>
-  </div>
-</header>
+<header>
+  <div class="brand">Studio Blanc — Portfolio</div>
+</header>
@@
-async function load() {
-  const r = await fetch('/api/auth/me', { cache:'no-store' });
-  if (r.status === 401) { location.href = '/login.html'; return; }
-
-  const r2 = await fetch('/api/files/list', { cache:'no-store' });
-  if (!r2.ok) { showError('List failed: ' + r2.status); return; }
-  const data = await r2.json();
-  grid.innerHTML = '';
-  for (const it of (data.items || [])) grid.appendChild(cardFor(it));
-}
+async function load() {
+  // If not authenticated, redirect to login; otherwise just fetch the file list.
+  const r = await fetch('/api/auth/me', { cache:'no-store' });
+  if (r.status === 401) { location.href = '/login.html'; return; }
+  const r2 = await fetch('/api/files/list', { cache:'no-store' });
+  if (!r2.ok) { showError('List failed: ' + r2.status); return; }
+  const data = await r2.json();
+  grid.innerHTML = '';
+  for (const it of (data.items || [])) grid.appendChild(cardFor(it));
+}
*** End Patch
