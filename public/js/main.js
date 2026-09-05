(() => {
  'use strict';

  const page = document.getElementById('campusPage');
  if (!page) return;

  const DAY_NAMES = ['Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy', 'Chủ nhật'];
  const DAY_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const THEME = { LIGHT: 'light', DARK: 'dark' };
  const SCHEDULE_START_HOUR = 0;
  const SCHEDULE_END_HOUR = 24;
  const TRACK_HOUR_HEIGHT = 55;
  const TIMELINE_HEIGHT = (SCHEDULE_END_HOUR - SCHEDULE_START_HOUR) * TRACK_HOUR_HEIGHT;

  let lessonsByDay = [
    [{ id: 'cs204', code: 'CS204', title: 'Lập trình Web', start: '09:00', end: '11:00', room: 'A3.204', tone: 'tone-blue' }],
    [{ id: 'ux201', code: 'UX201', title: 'Thiết kế trải nghiệm', start: '13:30', end: '15:00', room: 'B2.106', tone: 'tone-lilac' }],
    [{ id: 'ds110', code: 'DS110', title: 'Cơ sở dữ liệu', start: '10:00', end: '12:00', room: 'C1.305', tone: 'tone-sky' }],
    [{ id: 'ma102', code: 'MA102', title: 'Toán rời rạc', start: '08:30', end: '10:00', room: 'A1.110', tone: 'tone-mint' }],
    [{ id: 'en205', code: 'EN205', title: 'Tiếng Anh chuyên ngành', start: '15:00', end: '17:00', room: 'D4.201', tone: 'tone-indigo' }],
    [{ id: 'it304', code: 'IT304', title: 'Phát triển ứng dụng', start: '09:00', end: '11:30', room: 'Lab 02', tone: 'tone-blue' }],
    []
  ];

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const pad = (value) => String(value).padStart(2, '0');
  const addDays = (date, amount) => {
    const result = new Date(date);
    result.setDate(result.getDate() + amount);
    return result;
  };
  const getMondayIndex = (date) => (date.getDay() + 6) % 7;
  const mondayOf = (date) => addDays(date, -getMondayIndex(date));
  const sameDate = (first, second) => first.getFullYear() === second.getFullYear() && first.getMonth() === second.getMonth() && first.getDate() === second.getDate();
  const dateParts = (date) => `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
  const formatFullDate = (date) => new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  const formatAgendaDate = (date) => `${DAY_NAMES[getMondayIndex(date)]} · ${pad(date.getDate())} tháng ${pad(date.getMonth() + 1)}`;
  const formatRange = (start, end) => {
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      return `${pad(start.getDate())} — ${pad(end.getDate())} tháng ${pad(start.getMonth() + 1)}, ${start.getFullYear()}`;
    }
    return `${pad(start.getDate())} tháng ${pad(start.getMonth() + 1)} — ${pad(end.getDate())} tháng ${pad(end.getMonth() + 1)}, ${end.getFullYear()}`;
  };
  const timeToMinutes = (time) => {
    const [hour, minute] = time.split(':').map(Number);
    return hour * 60 + minute;
  };
  const formatClock = (date) => new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[character]);

  const state = {
    now: new Date(),
    weekOffset: 0,
    selectedDay: getMondayIndex(new Date()),
    theme: THEME.LIGHT,
    timelinePositioned: false
  };

  const toneNames = ['tone-blue', 'tone-lilac', 'tone-sky', 'tone-mint', 'tone-indigo'];
  const dayIndexFromLabel = (day) => {
    const normalized = String(day || '').toLowerCase().trim();
    const number = normalized.match(/(?:thứ\s*)?([2-7])\b/);
    if (number) return Number(number[1]) - 2;
    if (normalized.includes('chủ nhật') || normalized === 'cn') return 6;
    return -1;
  };
  const initials = (name) => String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'ME';
  const socialIcon = { facebook: 'ti-brand-facebook', instagram: 'ti-brand-instagram', tiktok: 'ti-brand-tiktok' };

  function renderProfile(profile) {
    const name = profile.name || 'Trang cá nhân';
    const shortName = name.trim().split(/\s+/).slice(-2).join(' ') || name;
    const userInitials = initials(name);
    document.title = `${name} — Hồ sơ cá nhân`;
    $('.brand-initials').textContent = userInitials;
    $('.brand-name').textContent = shortName;
    $('.hero-eyebrow').textContent = profile.title || 'HỒ SƠ CÁ NHÂN';
    $('.hero-title').textContent = name;
    $('.hero-role').textContent = profile.title || '';
    $('.hero-description').textContent = profile.bio || '';
    $('.about-lead .body-copy').textContent = profile.bio || '';
    $('#avatarFallback').textContent = userInitials;
    const avatar = $('#avatarImage');
    avatar.alt = `Ảnh đại diện ${name}`;
    if (profile.avatarUrl) {
      avatar.hidden = false;
      avatar.src = profile.avatarUrl;
    } else {
      avatar.hidden = true;
      $('#avatarFallback').hidden = false;
    }

    const emailAction = $('.primary-action');
    if (profile.email) emailAction.href = `mailto:${profile.email}`;
    else emailAction.hidden = true;

    const socialGrid = $('.social-grid');
    socialGrid.replaceChildren();
    const socials = profile.socials || {};
    Object.entries(socials).forEach(([network, url]) => {
      if (!url) return;
      const link = document.createElement('a');
      link.className = 'social-link';
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.innerHTML = `<span class="social-copy"><i class="ti ${socialIcon[network] || 'ti-link'} social-icon" aria-hidden="true"></i><span><strong>${escapeHtml(network)}</strong><small>${escapeHtml(url.replace(/^https?:\/\//, ''))}</small></span></span><i class="ti ti-arrow-up-right social-arrow" aria-hidden="true"></i>`;
      socialGrid.appendChild(link);
    });
    if (profile.email) {
      const emailLink = document.createElement('a');
      emailLink.className = 'social-link email-link';
      emailLink.href = `mailto:${profile.email}`;
      emailLink.innerHTML = `<span class="social-copy"><i class="ti ti-mail social-icon social-icon-coral" aria-hidden="true"></i><span><strong>Email</strong><small>${escapeHtml(profile.email)}</small></span></span><i class="ti ti-arrow-up-right social-arrow" aria-hidden="true"></i>`;
      socialGrid.appendChild(emailLink);
    }
    if (profile.phone) {
      const phoneLink = document.createElement('a');
      phoneLink.className = 'social-link';
      phoneLink.href = `tel:${profile.phone.replace(/[^+\d]/g, '')}`;
      phoneLink.innerHTML = `<span class="social-copy"><i class="ti ti-phone social-icon" aria-hidden="true"></i><span><strong>Điện thoại</strong><small>${escapeHtml(profile.phone)}</small></span></span><i class="ti ti-arrow-up-right social-arrow" aria-hidden="true"></i>`;
      socialGrid.appendChild(phoneLink);
    }
    if (!socialGrid.children.length) socialGrid.hidden = true;

    lessonsByDay = Array.from({ length: 7 }, () => []);
    (profile.schedule || []).forEach((lesson, index) => {
      const dayIndex = dayIndexFromLabel(lesson.day);
      if (dayIndex < 0) return;
      lessonsByDay[dayIndex].push({
        id: `${dayIndex}-${index}`,
        code: `MH${String(index + 1).padStart(2, '0')}`,
        title: lesson.subject,
        start: lesson.start,
        end: lesson.end,
        room: lesson.room || 'Chưa cập nhật',
        tone: toneNames[index % toneNames.length]
      });
    });
    lessonsByDay.forEach((lessons) => lessons.sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start)));
    const todayIndex = getMondayIndex(state.now);
    const nextLesson = lessonsByDay[todayIndex].find((lesson) => timeToMinutes(lesson.end) > state.now.getHours() * 60 + state.now.getMinutes())
      || lessonsByDay.find((day) => day.length)?.[0];
    if (nextLesson) {
      const ticket = $('.next-ticket');
      $('.ticket-code strong', ticket).textContent = nextLesson.code;
      $('.ticket-detail strong', ticket).textContent = nextLesson.title;
      $('.ticket-detail span', ticket).textContent = `${nextLesson.start}–${nextLesson.end} · Phòng ${nextLesson.room}`;
      ticket.setAttribute('aria-label', `Xem ${nextLesson.title}`);
    }
    renderCalendar();
  }

  async function loadProfile() {
    try {
      const response = await fetch('/api/profile');
      if (!response.ok) throw new Error('Không thể tải hồ sơ');
      renderProfile(await response.json());
    } catch (error) {
      console.error(error);
    }
  }

  function formatCommentDate(value) {
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));
  }

  async function loadComments() {
    const list = $('#comment-list');
    if (!list) return;
    try {
      const response = await fetch('/api/comments');
      if (!response.ok) throw new Error();
      const comments = await response.json();
      list.replaceChildren();
      comments.forEach((comment) => {
        const article = document.createElement('article');
        article.className = 'comment-card';
        const heading = document.createElement('div');
        heading.className = 'comment-card-heading';
        const name = document.createElement('strong');
        name.textContent = comment.name;
        const date = document.createElement('time');
        date.dateTime = comment.createdAt;
        date.textContent = formatCommentDate(comment.createdAt);
        const message = document.createElement('p');
        message.textContent = comment.message;
        heading.append(name, date);
        article.append(heading, message);
        list.appendChild(article);
      });
    } catch {
      // Không làm gián đoạn trang cá nhân nếu phần lời nhắn tạm không tải được.
    }
  }

  function initComments() {
    const form = $('#comment-form');
    if (!form) return;
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const notice = $('#comment-form-message');
      const submit = $('button[type="submit"]', form);
      submit.disabled = true;
      try {
        const response = await fetch('/api/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name.value, message: form.message.value })
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Không thể gửi lời nhắn.');
        form.reset();
        notice.textContent = body.message;
        notice.classList.remove('is-error');
      } catch (error) {
        notice.textContent = error.message || 'Không thể gửi lời nhắn. Hãy thử lại.';
        notice.classList.add('is-error');
      } finally {
        submit.disabled = false;
      }
    });
    loadComments();
  }

  function getCurrentLesson(dayIndex, date) {
    if (!sameDate(date, state.now) || dayIndex !== getMondayIndex(date)) return null;
    const currentMinutes = state.now.getHours() * 60 + state.now.getMinutes() + state.now.getSeconds() / 60;
    return lessonsByDay[dayIndex].find((lesson) => currentMinutes >= timeToMinutes(lesson.start) && currentMinutes < timeToMinutes(lesson.end)) || null;
  }

  function getProgress(lesson, date) {
    const start = timeToMinutes(lesson.start);
    const end = timeToMinutes(lesson.end);
    const current = date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
    return Math.max(0, Math.min(100, ((current - start) / (end - start)) * 100));
  }

  function renderCurrentTimeLine(track, date, isToday) {
    if (!isToday) return;
    const minutesFromStart = date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60 - SCHEDULE_START_HOUR * 60;
    const top = Math.max(0, Math.min(TIMELINE_HEIGHT, (minutesFromStart / 60) * TRACK_HOUR_HEIGHT));
    const line = document.createElement('div');
    line.className = 'current-time-line';
    line.style.top = `${top}px`;
    line.setAttribute('aria-hidden', 'true');
    line.innerHTML = `<span>${escapeHtml(formatClock(date))}</span>`;
    track.appendChild(line);
  }

  function lessonCard(lesson, dayIndex, date) {
    const start = timeToMinutes(lesson.start);
    const end = timeToMinutes(lesson.end);
    const top = Math.max(0, ((start - SCHEDULE_START_HOUR * 60) / 60) * TRACK_HOUR_HEIGHT);
    const height = Math.max(112, ((end - start) / 60) * TRACK_HOUR_HEIGHT);
    const current = Boolean(getCurrentLesson(dayIndex, date)?.id === lesson.id);
    const progress = current ? getProgress(lesson, date) : 0;
    const article = document.createElement('article');
    article.className = `calendar-session ${lesson.tone}${current ? ' current-session' : ''}`;
    article.style.setProperty('--session-top', `${top}px`);
    article.style.setProperty('--session-height', `${height}px`);
    article.setAttribute('aria-label', `${lesson.code}, ${lesson.title}, ${lesson.start} đến ${lesson.end}, ${lesson.room}`);
    article.innerHTML = `
      <span class="session-code">${escapeHtml(lesson.code)}</span>
      ${current ? '<span class="current-label">Đang học</span>' : ''}
      <h3 class="session-title">${escapeHtml(lesson.title)}</h3>
      <p class="session-meta">${escapeHtml(lesson.start)}–${escapeHtml(lesson.end)} · ${escapeHtml(lesson.room)}</p>
      ${current ? `<div class="progress-track" aria-hidden="true"><div class="progress-bar" style="--progress:${progress}%"></div></div>` : ''}
    `;
    return article;
  }

  function renderDesktopCalendar() {
    const startOfWeek = mondayOf(addDays(state.now, state.weekOffset * 7));
    const endOfWeek = addDays(startOfWeek, 6);
    const range = $('#calendarRange');
    if (range) range.textContent = formatRange(startOfWeek, endOfWeek);

    const timeAxis = $('.calendar-time-axis');
    timeAxis.replaceChildren();
    for (let hour = SCHEDULE_START_HOUR; hour <= SCHEDULE_END_HOUR; hour += 2) {
      const label = document.createElement('span');
      label.className = 'time-label';
      label.style.setProperty('--label-top', `${(hour - SCHEDULE_START_HOUR) * TRACK_HOUR_HEIGHT}px`);
      label.textContent = `${pad(hour % 24)}:00`;
      timeAxis.appendChild(label);
    }

    $$('.calendar-day-head').forEach((head, dayIndex) => {
      const date = addDays(startOfWeek, dayIndex);
      const isToday = state.weekOffset === 0 && sameDate(date, state.now);
      $('[data-day-name]', head).textContent = DAY_NAMES[dayIndex];
      $('[data-day-date]', head).textContent = dateParts(date);
      $('.today-dot', head).hidden = !isToday;
      head.classList.toggle('is-today', isToday);
    });

    $$('.day-track').forEach((track, dayIndex) => {
      const date = addDays(startOfWeek, dayIndex);
      const isToday = state.weekOffset === 0 && sameDate(date, state.now);
      track.classList.toggle('is-today', isToday);
      track.replaceChildren();
      renderCurrentTimeLine(track, date, isToday);
      lessonsByDay[dayIndex].forEach((lesson) => track.appendChild(lessonCard(lesson, dayIndex, date)));
    });

    if (!state.timelinePositioned) {
      requestAnimationFrame(() => {
        const calendar = $('.calendar-scroll');
        if (calendar) calendar.scrollTop = Math.max(0, (Math.max(7, state.now.getHours() - 1) - SCHEDULE_START_HOUR) * TRACK_HOUR_HEIGHT);
        state.timelinePositioned = true;
      });
    }
  }

  function renderMobileAgenda() {
    const startOfWeek = mondayOf(addDays(state.now, state.weekOffset * 7));
    const selectedDate = addDays(startOfWeek, state.selectedDay);
    const agendaDate = $('#mobileAgendaDate');
    const agendaList = $('#mobileAgendaList');
    if (!agendaDate || !agendaList) return;

    agendaDate.textContent = formatAgendaDate(selectedDate);
    const selectedLessons = lessonsByDay[state.selectedDay];
    if (!selectedLessons.length) {
      agendaList.replaceChildren();
      return;
    }

    agendaList.innerHTML = selectedLessons.map((lesson) => {
      const current = Boolean(getCurrentLesson(state.selectedDay, selectedDate)?.id === lesson.id);
      const progress = current ? getProgress(lesson, state.now) : 0;
      return `
        <article class="agenda-ticket ${lesson.tone}${current ? ' current-agenda' : ''}">
          <div class="agenda-ticket-heading"><span class="session-code">${escapeHtml(lesson.code)}</span><span class="agenda-status${current ? ' current-label' : ''}">${current ? 'Đang học' : 'Sắp tới'}</span></div>
          <h3>${escapeHtml(lesson.title)}</h3>
          <p class="session-meta">${escapeHtml(lesson.start)}–${escapeHtml(lesson.end)} · ${escapeHtml(lesson.room)}</p>
          ${current ? `<div class="progress-track" aria-hidden="true"><div class="progress-bar" style="--progress:${progress}%"></div></div>` : ''}
        </article>
      `;
    }).join('');
  }

  function renderDayPicker() {
    const startOfWeek = mondayOf(addDays(state.now, state.weekOffset * 7));
    $$('.day-picker').forEach((button, dayIndex) => {
      const date = addDays(startOfWeek, dayIndex);
      const isToday = state.weekOffset === 0 && sameDate(date, state.now);
      const isSelected = dayIndex === state.selectedDay;
      $('.day-picker-label', button).textContent = DAY_SHORT[dayIndex];
      $('.day-picker-number', button).textContent = pad(date.getDate());
      button.classList.toggle('is-selected', isSelected);
      button.classList.toggle('is-today', isToday);
      button.setAttribute('aria-pressed', String(isSelected));
      button.title = `${DAY_NAMES[dayIndex]} ${dateParts(date)}`;
    });
  }

  function renderCalendar(scrollToSchedule = false) {
    renderDesktopCalendar();
    renderDayPicker();
    renderMobileAgenda();
    if (scrollToSchedule) $('#schedule')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function updateClock() {
    try {
      const current = new Date();
      if (Number.isNaN(current.getTime())) throw new Error('Không thể đọc thời gian');
      const previousDate = state.now;
      state.now = current;
      const clock = $('#liveClock');
      if (clock) clock.innerHTML = `${escapeHtml(formatClock(current))}<span>ICT</span>`;
      const date = $('#calendarCurrentDate');
      if (date) date.textContent = formatFullDate(current);
      $('#clockError').hidden = true;
      const dayChanged = !sameDate(previousDate, current);
      if (state.weekOffset === 0 || dayChanged) {
        if (dayChanged && state.weekOffset === 0) state.selectedDay = getMondayIndex(current);
        renderCalendar(false);
      }
    } catch (error) {
      const clock = $('#liveClock');
      if (clock) clock.textContent = '--:--';
      $('#clockError').hidden = false;
    }
  }

  function setTheme(theme) {
    const isDark = theme === THEME.DARK;
    state.theme = isDark ? THEME.DARK : THEME.LIGHT;
    page.classList.toggle('theme-dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    $$('.theme-control').forEach((button) => {
      button.setAttribute('aria-pressed', String(isDark));
      button.setAttribute('aria-label', isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối');
      button.title = isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối';
      const icon = $('.theme-icon', button);
      icon.className = isDark ? 'ti ti-moon theme-icon' : 'ti ti-sun theme-icon';
    });
  }

  function initTheme() {
    let savedTheme = null;
    try {
      savedTheme = localStorage.getItem('campus-theme');
    } catch (error) {
      savedTheme = null;
    }
    const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    setTheme(savedTheme || (systemDark ? THEME.DARK : THEME.LIGHT));
    $$('.theme-control').forEach((button) => button.addEventListener('click', () => {
      const nextTheme = state.theme === THEME.DARK ? THEME.LIGHT : THEME.DARK;
      try {
        localStorage.setItem('campus-theme', nextTheme);
      } catch (error) {
        // localStorage may be disabled in private or embedded contexts.
      }
      setTheme(nextTheme);
    }));
  }

  function initMenu() {
    const menuToggle = $('#menuToggle');
    const mobileMenu = $('#mobileMenu');
    if (!menuToggle || !mobileMenu) return;
    menuToggle.addEventListener('click', () => {
      const isOpen = !mobileMenu.hidden;
      mobileMenu.hidden = isOpen;
      menuToggle.setAttribute('aria-expanded', String(!isOpen));
      menuToggle.setAttribute('aria-label', isOpen ? 'Mở menu' : 'Đóng menu');
      menuToggle.title = isOpen ? 'Mở menu' : 'Đóng menu';
      $('.menu-icon', menuToggle).className = isOpen ? 'ti ti-menu-2 menu-icon' : 'ti ti-x menu-icon';
    });
    $$('#mobileMenu a').forEach((link) => link.addEventListener('click', () => {
      mobileMenu.hidden = true;
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Mở menu');
      menuToggle.title = 'Mở menu';
      $('.menu-icon', menuToggle).className = 'ti ti-menu-2 menu-icon';
    }));
  }

  function initWeekControls() {
    $$('[data-week-action]').forEach((button) => button.addEventListener('click', () => {
      const action = button.dataset.weekAction;
      if (action === 'prev') {
        state.weekOffset -= 1;
        state.selectedDay = 0;
      }
      if (action === 'next') {
        state.weekOffset += 1;
        state.selectedDay = 0;
      }
      if (action === 'today') {
        state.weekOffset = 0;
        state.selectedDay = getMondayIndex(state.now);
      }
      renderCalendar(action === 'today');
    }));

    $$('.day-picker').forEach((button) => button.addEventListener('click', () => {
      state.selectedDay = Number(button.dataset.mobileDay);
      renderDayPicker();
      renderMobileAgenda();
    }));
  }

  function initAvatarFallback() {
    const image = $('#avatarImage');
    const fallback = $('#avatarFallback');
    image?.addEventListener('error', () => {
      image.hidden = true;
      if (fallback) fallback.hidden = false;
    });
  }

  function initRetryState() {
    const retryButton = $('#retryButton');
    if (!retryButton) return;
    retryButton.addEventListener('click', () => {
      retryButton.disabled = true;
      retryButton.textContent = 'Đang thử…';
      window.setTimeout(() => {
        retryButton.disabled = false;
        retryButton.textContent = 'Thử lại';
        loadProfile();
      }, 700);
    });
  }

  initTheme();
  initMenu();
  initWeekControls();
  initAvatarFallback();
  initRetryState();
  initComments();
  renderCalendar();
  loadProfile();
  updateClock();
  window.setInterval(updateClock, 1000);
})();
