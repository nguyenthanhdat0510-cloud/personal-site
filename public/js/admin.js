let adminToken = '';

const loginBox = document.getElementById('login-box');
const adminBox = document.getElementById('admin-box');
const loginError = document.getElementById('login-error');

async function getApiError(response) {
  try {
    const body = await response.json();
    return body.detail || body.error || `Lỗi ${response.status}`;
  } catch {
    return `Lỗi ${response.status}`;
  }
}

async function tryLogin(password) {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: password })
  });
  if (res.ok) {
    adminToken = password;
    loginBox.classList.add('hidden');
    adminBox.classList.remove('hidden');
    await loadForEditing();
  } else {
    loginError.textContent = await getApiError(res);
  }
}

document.getElementById('login-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const password = document.getElementById('token-input').value;
  if (password) tryLogin(password);
});

async function loadForEditing() {
  const res = await fetch('/api/profile');
  const data = await res.json();
  const form = document.getElementById('profile-form');
  form.name.value = data.name || '';
  form.title.value = data.title || '';
  form.bio.value = data.bio || '';
  form.avatarUrl.value = data.avatarUrl || '';
  form.phone.value = data.phone || '';
  form.email.value = data.email || '';
  form.facebook.value = (data.socials || {}).facebook || '';
  form.tiktok.value = (data.socials || {}).tiktok || '';
  form.instagram.value = (data.socials || {}).instagram || '';

  renderScheduleTable(data.schedule || []);
  updateAvatarPreview(data.avatarUrl || '');
  loadPendingComments();
}

async function loadPendingComments() {
  const container = document.getElementById('pending-comments');
  const empty = document.getElementById('pending-comments-empty');
  const response = await fetch('/api/comments/pending', { headers: { 'x-admin-token': adminToken } });
  if (!response.ok) {
    empty.textContent = 'Không thể tải lời nhắn chờ duyệt.';
    return;
  }
  const comments = await response.json();
  container.replaceChildren();
  empty.hidden = comments.length > 0;
  if (!comments.length) {
    empty.textContent = 'Không có lời nhắn chờ duyệt.';
    return;
  }
  comments.forEach((comment) => {
    const card = document.createElement('article');
    card.className = 'pending-comment';
    const content = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = comment.name;
    const message = document.createElement('p');
    message.textContent = comment.message;
    content.append(name, message);
    const actions = document.createElement('div');
    const approve = document.createElement('button');
    approve.textContent = 'Duyệt';
    approve.addEventListener('click', () => moderateComment(comment._id, 'approve'));
    const remove = document.createElement('button');
    remove.className = 'delete-btn';
    remove.textContent = 'Xoá';
    remove.addEventListener('click', () => moderateComment(comment._id, 'delete'));
    actions.append(approve, remove);
    card.append(content, actions);
    container.appendChild(card);
  });
}

async function moderateComment(id, action) {
  const response = await fetch(`/api/comments/${id}${action === 'approve' ? '/approve' : ''}`, {
    method: action === 'approve' ? 'PATCH' : 'DELETE',
    headers: { 'x-admin-token': adminToken }
  });
  if (response.ok) loadPendingComments();
}

function updateAvatarPreview(url) {
  const preview = document.getElementById('avatar-preview');
  preview.hidden = !url;
  if (url) preview.src = url;
}

document.getElementById('avatar-file').addEventListener('change', (event) => {
  const [file] = event.target.files;
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    document.getElementById('save-msg').textContent = 'Ảnh cần nhỏ hơn 2 MB.';
    event.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    document.querySelector('#profile-form [name="avatarUrl"]').value = reader.result;
    updateAvatarPreview(reader.result);
  });
  reader.readAsDataURL(file);
});

document.querySelector('#profile-form [name="avatarUrl"]').addEventListener('input', (event) => {
  updateAvatarPreview(event.target.value.trim());
});

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
    avatarUrl: form.avatarUrl.value,
    phone: form.phone.value,
    email: form.email.value,
    socials: {
      facebook: form.facebook.value,
      tiktok: form.tiktok.value,
      instagram: form.instagram.value
    }
  };

  const msg = document.getElementById('save-msg');
  let res;
  try {
    res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
      body: JSON.stringify(payload)
    });
  } catch {
    msg.textContent = 'Không thể kết nối tới máy chủ. Hãy thử lại.';
    return;
  }

  if (res.ok) {
    msg.textContent = 'Đã lưu!';
  } else if (res.status === 413) {
    msg.textContent = 'Ảnh quá lớn. Hãy chọn ảnh nhỏ hơn 2 MB.';
  } else if (res.status === 401) {
    adminToken = '';
    adminBox.classList.add('hidden');
    loginBox.classList.remove('hidden');
    msg.textContent = 'Phiên đã hết hạn. Vui lòng nhập lại mật khẩu.';
  } else {
    msg.textContent = `Lưu thất bại: ${await getApiError(res)}`;
  }
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
