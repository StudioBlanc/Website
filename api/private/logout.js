// api/private/logout.js
export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  // Change the realm to try to shake cached credentials in most browsers
  const realm = `Studio Blanc Private (logout ${Date.now()})`;

  res.statusCode = 401;
  res.setHeader('WWW-Authenticate', `Basic realm="${realm}"`);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  // Simple page so the user isn't stuck with a blank 401
  res.end(`<!doctype html>
<meta name="robots" content="noindex,nofollow">
<title>Logged out</title>
<style>
  body{font-family:system-ui,Arial,sans-serif;padding:24px}
  a,button{display:inline-block;margin-top:14px;padding:8px 12px;border:1px solid #ccc;border-radius:8px;text-decoration:none;color:#111}
</style>
<h1>You're logged out</h1>
<p>If you return to the private area, your browser will ask for the password again.</p>
<p><a href="/">Go to homepage</a> <a href="/private/">Return to private area</a></p>
<p style="color:#666">Tip: closing this tab fully clears saved credentials in all browsers.</p>
`);
}
