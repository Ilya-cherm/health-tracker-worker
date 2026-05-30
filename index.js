function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyAdmin(request, env) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Basic ')) return false;
  const decoded = atob(auth.slice(6));
  const parts = decoded.split(':');
  const password = parts.slice(1).join(':');
  return password === env.ADMIN_PASSWORD;
}

async function getAllRecords(env) {
  const raw = await env.HEALTH_DATA.get('records');
  return raw ? JSON.parse(raw) : [];
}

async function saveAllRecords(env, records) {
  await env.HEALTH_DATA.put('records', JSON.stringify(records));
}

function normalizeRecord(body) {
  return {
    id: body.id || crypto.randomUUID(),
    date: body.date || '',
    hemoglobin: Number(body.hemoglobin || 0),
    ferritin: Number(body.ferritin || 0),
    iron: Number(body.iron || 0),
    b12: Number(body.b12 || 0),
    vitaminD: Number(body.vitaminD || 0),
    tsh: Number(body.tsh || 0),
    notes: String(body.notes || '').slice(0, 1000),
    createdAt: new Date().toISOString()
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/records' && request.method === 'GET') {
      const records = await getAllRecords(env);
      records.sort((a, b) => a.date.localeCompare(b.date));
      return json(records);
    }

    if (url.pathname === '/api/login' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const ok = body.password === env.ADMIN_PASSWORD;
      return json({ ok }, ok ? 200 : 401);
    }

    if (url.pathname === '/api/records' && request.method === 'POST') {
      const body = await request.json().catch(() => null);
      const authOk = await verifyAdmin(request, env);
      if (!authOk) return json({ error: 'Unauthorized' }, 401);
      if (!body) return json({ error: 'Invalid JSON' }, 400);

      const records = await getAllRecords(env);
      const record = normalizeRecord(body);
      records.push(record);
      records.sort((a, b) => a.date.localeCompare(b.date));
      await saveAllRecords(env, records);
      return json({ ok: true, record });
    }

    if (url.pathname.startsWith('/api/records/') && request.method === 'DELETE') {
      const authOk = await verifyAdmin(request, env);
      if (!authOk) return json({ error: 'Unauthorized' }, 401);
      const id = url.pathname.split('/').pop();
      const records = await getAllRecords(env);
      const next = records.filter(r => r.id !== id);
      await saveAllRecords(env, next);
      return json({ ok: true });
    }

    if (url.pathname === '/admin') {
      const assetUrl = new URL('/admin.html', url.origin);
      return env.ASSETS.fetch(new Request(assetUrl, request));
    }

    if (url.pathname === '/' || url.pathname === '/index.html') {
      return env.ASSETS.fetch(request);
    }

    return env.ASSETS.fetch(request);
  }
};
