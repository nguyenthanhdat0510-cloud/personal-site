let adminToken = sessionStorage.getItem('adminToken') || '';

const loginBox = document.getElementById('login-box');
const adminBox = document.getElementById('admin-box');
const loginError = document.getElementById('login-error');

async function tryLogin(token) {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
  if (res.ok) {
    adminToken = token;
    sessionStorage.setItem('adminToken', token);
    loginBox.classList.add('hidden');
    adminBox.classList.remove('hidden');
    await loadForEditing();
  } else {
    loginError.textContent = 'Token không đúng, thử lại.';
  }
}

document.getElementById('login-btn').addEventListener('click', () => {
  const token = document.getElementById('token-input').value.trim();
  if (token) tryLogin(token);
});

async function loadForEditing() {
  const res = await fetch('/api/profile');
  const data = await res.json();
  const form = document.getElementById('profile-form');
  form.name.value = data.name || '';
  form.title.value = data.title || '';
  form.bio.value = data.bio || '';
  form.phone.value = data.phone || '';
  form.email.value = data.email || '';
  form.facebook.value = (data.socials || {}).facebook || '';
  form.tiktok.value = (data.socials || {}).tiktok || '';
  form.instagram.value = (data.socials || {}).instagram || '';

  renderScheduleTable(data.schedule || []);
}

function renderScheduleTable(schedule) {
  const body = document.getElementById('admin-schedule-body');
  body.innerHTML = '';
  schedule.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.day}</td>
      <td>${item.start}</td>
      <td>${item.end}</td>
      <td>${item.subject}</td>
      <td>${item.room || ''}</td>
      <td><button data-index="${index}" class="delete-btn">Xoá</button></td>
    `;
    body.appendChild(tr);
  });

  document.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const idx = e.target.getAttribute('data-index');
      await fetch(`/api/profile/schedule/${idx}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': adminToken }
      });
      loadForEditing();
    });
  });
}

document.getElementById('profile-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const payload = {
    name: form.name.value,
    title: form.title.value,
    bio: form.bio.value,
    phone: form.phone.value,
    email: form.email.value,
    socials: {
      facebook: form.facebook.value,
      tiktok: form.tiktok.value,
      instagram: form.instagram.value
    }
  };

  const res = await fetch('/api/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
    body: JSON.stringify(payload)
  });

  const msg = document.getElementById('save-msg');
  msg.textContent = res.ok ? 'Đã lưu!' : 'Lưu thất bại.';
  setTimeout(() => (msg.textContent = ''), 2500);
});

document.getElementById('add-schedule-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const payload = {
    day: form.day.value,
    start: form.start.value,
    end: form.end.value,
    subject: form.subject.value,
    room: form.room.value
  };

  await fetch('/api/profile/schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
    body: JSON.stringify(payload)
  });

  form.reset();
  loadForEditing();
});

// Nếu đã có token lưu sẵn trong phiên làm việc, tự động đăng nhập lại
if (adminToken) {
  tryLogin(adminToken);
}
