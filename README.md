# Hidden Portfolio Patch

This zip contains the files you asked to add.

- If your repo already has `package.json`, merge in the `@vercel/blob` dependency.
- If your repo already has `vercel.json`, merge the `rewrites` into your existing array.
- Otherwise, you can drop these files at the repo root as-is.

## After pushing

- Set `ADMIN_PASSWORD`, `CLIENT_PASSWORD`, and `SESSION_SECRET` in Vercel → Settings → Environment Variables.
- Enable **Blob** in Vercel → Storage.
- Redeploy, then visit `/login.html` to sign in and you’ll be redirected to `/portfolio/`.
