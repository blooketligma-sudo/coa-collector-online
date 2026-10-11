const json = (res, status, body) => { res.setHeader('Cache-Control', 'no-store'); return res.status(status).json(body); }

async function supabaseRequest(path, options = {}) {
  const base = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  return { response, data };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_PASSWORD } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ADMIN_PASSWORD) {
    return json(res, 503, { error: 'Server setup is incomplete. Configure Supabase and ADMIN_PASSWORD in Vercel.' });
  }
  const username = String(req.body?.username || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!/^[a-z0-9_]{3,20}$/.test(username)) return json(res, 400, { error: 'Use 3–20 letters, numbers or underscores for your username.' });
  if (password.length < 8 || password.length > 128) return json(res, 400, { error: 'Password must be between 8 and 128 characters.' });
  if (username === 'blobby' && password !== ADMIN_PASSWORD) return json(res, 403, { error: 'The username blobby is reserved for the administrator.' });

  try {
    const exists = await supabaseRequest(`/rest/v1/profiles?select=user_id&username=eq.${encodeURIComponent(username)}&limit=1`);
    if (!exists.response.ok) return json(res, 502, { error: 'Could not check username availability. Check the Supabase SQL setup.' });
    if (Array.isArray(exists.data) && exists.data.length) return json(res, 409, { error: 'That username is already taken. Choose another or log in.' });

    // A synthetic, verified email lets the game offer username + password without requiring players to provide an email.
    const email = `${username}@accounts.coatcollector.app`;
    const created = await supabaseRequest('/auth/v1/admin/users', {
      method: 'POST',
      body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { username } })
    });
    if (!created.response.ok || !created.data?.id) {
      const message = created.data?.msg || created.data?.message || created.data?.error_description || 'Could not create account. That username may already exist.';
      return json(res, created.response.status === 422 ? 409 : 400, { error: message });
    }

    const profile = await supabaseRequest('/rest/v1/profiles', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ user_id: created.data.id, username })
    });
    if (!profile.response.ok) {
      await supabaseRequest(`/auth/v1/admin/users/${created.data.id}`, { method: 'DELETE' });
      return json(res, 400, { error: profile.data?.message || 'Could not create your profile. Check the Supabase SQL setup.' });
    }
    return json(res, 201, { ok: true, username });
  } catch (error) {
    console.error('Registration error:', error);
    return json(res, 500, { error: 'Server error while creating account. Check Vercel function logs.' });
  }
}
