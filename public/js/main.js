async function loadProfile() {
  const app = document.getElementById('app');
  try {
    const res = await fetch('/api/profile');
    if (!res.ok) throw new Error('Không lấy được dữ liệu');
    const data = await res.json();
    render(data);
  } catch (err) {
    app.innerHTML = `<p class="loading">Lỗi tải dữ liệu: ${err.message}</p>`;
  }
}

function render(data) {
  const app = document.getElementById('app');
  const tpl = document.getElementById('tpl-content');
  const node = tpl.content.cloneNode(true);

  node.getElementById('name').textContent = data.name || '';
  node.getElementById('title').textContent = data.title || '';
  node.getElementById('bio').textContent = data.bio || '';

  const avatar = node.getElementById('avatar');
  if (data.avatarUrl) {
    avatar.style.backgroundImage = `url(${data.avatarUrl})`;
  }

  const socialsEl = node.getElementById('socials');
  const socialLabels = { facebook: 'Facebook', tiktok: 'TikTok', instagram: 'Instagram' };
  Object.entries(data.socials || {}).forEach(([key, url]) => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = socialLabels[key] || key;
    socialsEl.appendChild(a);
  });

  const contactEl = node.getElementById('contact');
  const parts = [];
  if (data.phone) parts.push(`SĐT: ${data.phone}`);
  if (data.email) parts.push(`Email: ${data.email}`);
  contactEl.textContent = parts.join('  •  ');

  const scheduleBody = node.getElementById('schedule-body');
  (data.schedule || []).forEach((item) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(item.day)}</td>
      <td>${escapeHtml(item.start)} - ${escapeHtml(item.end)}</td>
      <td>${escapeHtml(item.subject)}</td>
      <td>${escapeHtml(item.room || '')}</td>
    `;
    scheduleBody.appendChild(tr);
  });

  app.innerHTML = '';
  app.appendChild(node);
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

loadProfile();
