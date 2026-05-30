let chart;

async function loadRecords() {
  const res = await fetch('/api/records');
  const records = await res.json();
  renderSummary(records);
  renderTable(records);
  renderChart(records);
}

function renderSummary(records) {
  const summary = document.getElementById('summary');
  if (!records.length) {
    summary.innerHTML = '<p>Пока нет данных. Добавьте первую запись через раздел «Ввод данных».</p>';
    return;
  }
  const latest = records[records.length - 1];
  const cards = [
    ['Гемоглобин', latest.hemoglobin],
    ['Ферритин', latest.ferritin],
    ['Железо', latest.iron],
    ['B12', latest.b12],
    ['Vitamin D', latest.vitaminD],
    ['TSH', latest.tsh],
  ];
  summary.innerHTML = cards.map(([label, value]) => `
    <article class="metric-card">
      <span>${label}</span>
      <strong>${value || '—'}</strong>
    </article>
  `).join('');
}

function renderTable(records) {
  const body = document.getElementById('recordsTable');
  body.innerHTML = records.map(r => `
    <tr>
      <td>${r.date || '—'}</td>
      <td>${r.hemoglobin || '—'}</td>
      <td>${r.ferritin || '—'}</td>
      <td>${r.iron || '—'}</td>
      <td>${r.b12 || '—'}</td>
      <td>${r.vitaminD || '—'}</td>
      <td>${r.tsh || '—'}</td>
      <td>${r.notes || ''}</td>
    </tr>
  `).join('');
}

function renderChart(records) {
  const ctx = document.getElementById('healthChart');
  const labels = records.map(r => r.date);
  const datasets = [
    { label: 'Гемоглобин', data: records.map(r => r.hemoglobin), borderColor: '#2563eb' },
    { label: 'Ферритин', data: records.map(r => r.ferritin), borderColor: '#16a34a' },
    { label: 'Железо', data: records.map(r => r.iron), borderColor: '#dc2626' },
    { label: 'B12', data: records.map(r => r.b12), borderColor: '#7c3aed' },
    { label: 'Vitamin D', data: records.map(r => r.vitaminD), borderColor: '#f59e0b' },
    { label: 'TSH', data: records.map(r => r.tsh), borderColor: '#0891b2' }
  ].map(item => ({ ...item, tension: 0.25, fill: false }));

  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: { y: { beginAtZero: false } }
    }
  });
}

loadRecords();
