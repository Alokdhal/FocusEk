// ── State ──────────────────────────────────────────────────────────────
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let selectedDate = null;
let isOnTime = true;
let allTasks = {}; // { 'YYYY-MM-DD': [{id, text, done, addedAt}] }
let ENV_MODE = 'dev'; // 'dev' or 'prod'
try {
  const saved = localStorage.getItem('focusflow_tasks');
  if (saved) allTasks = JSON.parse(saved);
} catch (e) { }

function saveTasks() {
  try { localStorage.setItem('focusflow_tasks', JSON.stringify(allTasks)); } catch (e) { }
}

// ── Helpers ────────────────────────────────────────────────────────────
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function dateKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// ── Clock ──────────────────────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  let h = now.getHours();
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  document.getElementById('clock').textContent = `${String(h).padStart(2, '0')}:${m}:${s} ${ampm}`;
}
setInterval(updateClock, 1000);
updateClock();

// ── Demo time mode ─────────────────────────────────────────────────────
function setTimeMode(mode) {
  isOnTime = (mode === 'on');
  document.getElementById('btn-on').classList.toggle('active', isOnTime);
  document.getElementById('btn-off').classList.toggle('active', !isOnTime);
  updateTimeUI();
  if (selectedDate) renderDay(selectedDate);
}
function setEnv(mode) {
  ENV_MODE = mode;

  const btn = document.getElementById('env-toggle-btn');

  btn.textContent = mode.toUpperCase();
  btn.classList.remove('dev', 'prod');
  btn.classList.add(mode);

  localStorage.setItem('env_mode', ENV_MODE);
  document.getElementById('locked-msg').classList.remove('show');
}
function updateTimeUI() {
  const badge = document.getElementById('time-badge');
  const badgeText = document.getElementById('time-badge-text');
  const inputWrap = document.getElementById('input-wrap');
  const lockedMsg = document.getElementById('locked-msg');
  const isLocked = (ENV_MODE === 'prod' && !isOnTime);

  if (!isLocked) {
    badge.className = 'time-window-badge open';
    badgeText.textContent = 'Planning window open';
    inputWrap.classList.remove('locked');
    lockedMsg.classList.remove('show');
  } else {
    badge.className = 'time-window-badge closed';
    badgeText.textContent = 'Window closed · after 7:30 AM';
    inputWrap.classList.add('locked');
  }
  const addBtn = document.querySelector('.add-btn');

  if (isLocked) {
    addBtn.style.opacity = '0.5';
  } else {
    addBtn.style.opacity = '1';
  }
}

// ── Countdown to 7:30 AM ───────────────────────────────────────────────
function updateCountdown() {
  const now = new Date();
  const target = new Date();
  target.setHours(7, 30, 0, 0);

  const diff = target - now;

  if (diff <= 0) {
    document.getElementById('countdown').textContent = 'Planning closed';

    // ONLY lock in PROD
    if (ENV_MODE === 'prod') {
      isOnTime = false;
      setTimeMode('off');
    }

    return;
  }

  const totalSec = Math.floor(diff / 1000);

  const hrs = Math.floor(totalSec / 3600);
  const min = Math.floor((totalSec % 3600) / 60);
  const sec = totalSec % 60;

  document.getElementById('countdown').textContent =
    `Window closes in ${hrs}h ${min}m ${sec}s`;
}
setInterval(updateCountdown, 1000);
updateCountdown();

// ── Calendar ───────────────────────────────────────────────────────────
function renderCalendar() {
  document.getElementById('month-label').textContent = `${MONTH_NAMES[currentMonth]} ${currentYear}`;

  const grid = document.getElementById('calendar-grid');
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const today = new Date();
  grid.innerHTML = '';

  // Empty leading cells
  for (let i = 0; i < firstDay; i++) {
    const el = document.createElement('div');
    el.className = 'cal-day empty';
    grid.appendChild(el);
  }

  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const key = dateKey(currentYear, currentMonth, d);
    const tasks = allTasks[key] || [];
    let status = '';

    if (tasks.length === 0) {
      status = 'no-entry';   // 👈 NEW
    } else {
      const allDone = tasks.every(t => t.done);
      status = allDone ? 'all-done' : 'not-done';
    }
    const isToday = today.getDate() === d && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
    const isSelected = selectedDate === key;

    const el = document.createElement('div');
    el.className = 'cal-day' +
      (isToday ? ' today' : '') +
      (isSelected ? ' selected' : '') +
      (status ? ' ' + status : '');
    el.textContent = d;
    el.onclick = () => selectDay(currentYear, currentMonth, d);
    grid.appendChild(el);
  }
}

function changeMonth(delta) {
  currentMonth += delta;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  renderCalendar();
}

function selectDay(y, m, d) {
  selectedDate = dateKey(y, m, d);
  renderCalendar();
  renderDay(selectedDate);
  document.getElementById('day-content').style.display = 'block';
}

// ── Day panel ──────────────────────────────────────────────────────────
function renderDay(key) {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();

  document.getElementById('day-title').textContent = isToday
    ? `Today — ${DAY_NAMES[date.getDay()]}`
    : `${DAY_NAMES[date.getDay()]}, ${MONTH_SHORT[m - 1]} ${d}`;

  const tasks = allTasks[key] || [];
  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : null;

  document.getElementById('day-subtitle').textContent = total === 0
    ? 'No tasks planned yet'
    : `${done}/${total} tasks done${pct !== null ? ` · ${pct}% complete` : ''}`;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-done').textContent = done;
  document.getElementById('stat-pct').textContent = pct !== null ? `${pct}%` : '—';

  updateTimeUI();
  renderTaskLists(key, tasks);
  updateProgress(tasks);
}

function renderTaskLists(key, tasks) {
  const pending = tasks.filter(t => !t.done);
  const completed = tasks.filter(t => t.done);

  document.getElementById('pending-count').textContent = pending.length;
  document.getElementById('completed-count').textContent = completed.length;

  const pendingList = document.getElementById('pending-list');
  pendingList.innerHTML = '';
  if (pending.length === 0) {
    pendingList.style.display = 'none';
  } else {
    pendingList.style.display = 'flex';
    pending.forEach(task => pendingList.appendChild(createTaskEl(task, key)));
  }

  const completedList = document.getElementById('completed-list');
  completedList.innerHTML = '';
  if (completed.length === 0) {
    completedList.innerHTML = `<div class="empty-state"><div class="empty-text" style="font-size:12px">Click a task above to mark it done</div></div>`;
  } else {
    completed.forEach(task => completedList.appendChild(createTaskEl(task, key)));
  }
}

function createTaskEl(task, key) {
  const el = document.createElement('div');
  el.className = 'task-item' + (task.done ? ' completed' : '');
  el.onclick = () => toggleTask(key, task.id);

  const checkbox = document.createElement('div');
  checkbox.className = 'task-checkbox';

  const text = document.createElement('div');
  text.className = 'task-text';
  text.textContent = task.text;

  const timeEl = document.createElement('div');
  timeEl.className = 'task-time';
  timeEl.textContent = task.addedAt || '';

  const del = document.createElement('button');
  del.className = 'task-delete';
  del.innerHTML = '×';
  del.onclick = (e) => { e.stopPropagation(); deleteTask(key, task.id); };

  el.appendChild(checkbox);
  el.appendChild(text);
  el.appendChild(timeEl);
  el.appendChild(del);
  return el;
}

// ── Task operations ────────────────────────────────────────────────────
function addTask() {
  if (ENV_MODE === 'prod' && !isOnTime) {
    const msg = document.getElementById('locked-msg');
    msg.classList.add('show');

    setTimeout(() => {
      msg.classList.remove('show');
    }, 2500);
    return;
  }

  if (!selectedDate) return;

  const input = document.getElementById('task-input');
  const text = input.value.trim();
  if (!text) return;

  if (!allTasks[selectedDate]) allTasks[selectedDate] = [];

  const now = new Date();
  allTasks[selectedDate].push({
    id: Date.now(),
    text,
    done: false,
    addedAt: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  });

  saveTasks();
  input.value = '';
  renderDay(selectedDate);
  renderCalendar();
  renderStreak();
}

function handleKey(e) {
  if (e.key === 'Enter') addTask();
}

function toggleTask(key, id) {
  const task = (allTasks[key] || []).find(t => t.id === id);
  if (task) task.done = !task.done;
  saveTasks();
  renderDay(key);
  renderCalendar();
  renderStreak();

}

function deleteTask(key, id) {
  if (!allTasks[key]) return;
  allTasks[key] = allTasks[key].filter(t => t.id !== id);
  saveTasks();
  renderDay(key);
  renderCalendar();
  renderStreak();
}

// ── Progress bar ───────────────────────────────────────────────────────
function updateProgress(tasks) {
  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  const percent = total ? (done / total) * 100 : 0;
  document.getElementById('progress-fill').style.width = percent + '%';
}

// ── Streak grid ────────────────────────────────────────────────────────
function renderStreak() {
  const grid = document.getElementById('streak-grid');
  const today = new Date();
  grid.innerHTML = '';

  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = dateKey(d.getFullYear(), d.getMonth(), d.getDate());
    const tasks = allTasks[key] || [];

    let status = 'none'; // none | done | missed

    if (tasks.length > 0) {
      const allDone = tasks.every(t => t.done);

      if (allDone) {
        status = 'done';     // 🟢
      } else {
        status = 'missed';   // 🔴
      }
    }

    const dot = document.createElement('div');
    dot.className = 'streak-dot' + (status !== 'none' ? ' ' + status : '');
    dot.title = key;
    grid.appendChild(dot);
  }
}
function toggleEnv() {
  const newMode = ENV_MODE === 'dev' ? 'prod' : 'dev';
  setEnv(newMode);
}

async function loadQuote() {
  const el = document.getElementById('quote-text');
  if (!el) return;

  el.classList.remove('show');

  setTimeout(async () => {
    try {
      const res = await fetch(
        'https://api.allorigins.win/raw?url=https://zenquotes.io/api/random'
      );
      const data = await res.json();

      let text = data[0].q;

      if (text.length > 70) {
        text = text.slice(0, 70) + '...';
      }

      el.textContent = `"${text}"`;

    } catch (err) {
      console.error(err); // 👈 IMPORTANT (debug)
      el.textContent = 'Motivational quote';
    }

    el.classList.add('show');
  }, 300);
}
// ── Init ───────────────────────────────────────────────────────────────
renderCalendar();
renderStreak();
loadQuote();
setInterval(loadQuote, 1000 * 60 * 10); // every 10 min
const _today = new Date();
selectDay(_today.getFullYear(), _today.getMonth(), _today.getDate());

// Load saved ENV mode
window.addEventListener('DOMContentLoaded', () => {
  ENV_MODE = localStorage.getItem('env_mode') || 'dev';
  setEnv(ENV_MODE);
});
document.getElementById('task-input').addEventListener('focus', () => {
  if (ENV_MODE === 'prod' && !isOnTime) {
    const msg = document.getElementById('locked-msg');
    msg.classList.add('show');

    setTimeout(() => {
      msg.classList.remove('show');
    }, 2500);
  }
});