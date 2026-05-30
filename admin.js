let adminPassword = '';

function buildAuthHeader() {
  return 'Basic ' + btoa('admin:' + adminPassword);
}

async function login() {
  const value = document.getElementById('adminPassword').value;
  const error = document.getElementById('loginError');
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: value })
  });

  if (!res.ok) {
    error.classList.remove('hidden');
    return;
  }

  adminPassword = value;
  document.getElementById('loginPanel').classList.add('hidden');
  document.getElementById('adminPanel').classList.remove('hidden');
  loadAdminRecords();
}

async function loadAdminRecords() {
  const res = await fetch('/api/records');
  const records = await res.json();
  const holder = document.getElementById('adminRecords');
  if (!records.length) {
    holder.innerHTML = '<p>Записей пока нет.</p>';
    return;
  }
  holder.innerHTML = records.map(r => `
    <div class="record-card">
      <div>
        <strong>${r.date}</strong>
        <p>Hb: ${r.hemoglobin || '—'} · Ferritin: ${r.ferritin || '—'} · Iron: ${r.iron || '—'} · B12: ${r.b12 || '—'} · Vit D: ${r.vitaminD || '—'} · TSH: ${r.tsh || '—'}</p>
        <small>${r.notes || ''}</small>
      </div>
      <button class="button danger" onclick="deleteRecord('${r.id}')">Удалить</button>
    </div>
  `).join('');
}

async function deleteRecord(id) {
  const res = await fetch('/api/records/' + id, {
    method: 'DELETE',
    headers: { 'Authorization': buildAuthHeader() }
  });
  if (res.ok) loadAdminRecords();
}

document.getElementById('loginBtn').addEventListener('click', login);
document.getElementById('recordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  const payload = Object.fromEntries(form.entries());
  const res = await fetch('/api/records', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': buildAuthHeader()
    },
    body: JSON.stringify(payload)
  });
  if (res.ok) {
    e.target.reset();
    loadAdminRecords();
    alert('Анализ сохранен');
  } else {
    alert('Ошибка сохранения');
  }
});
