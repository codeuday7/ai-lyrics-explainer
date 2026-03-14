/* ─── Config ─────────────────────────────────────────────────────────────── */
const API_BASE = 'https://ai-lyrics-backend.onrender.com/api';

/* ─── Toast Notifications ───────────────────────────────────────────────── */
function showToast(message, type = 'info', duration = 3500) {
  const icons = { success: '✅', error: '❌', info: '💡' };
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || '💡'}</span>
    <span class="toast-msg">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ─── Token Utilities ───────────────────────────────────────────────────── */
function getToken() {
  return localStorage.getItem('token');
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
}

function logout() {
  localStorage.clear();
  sessionStorage.clear();
  window.location.replace('index.html');
}

function requireAuth() {
  if (!getToken()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

/* ─── Password Toggle ───────────────────────────────────────────────────── */
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁';
  }
}

/* ─── Password Strength ─────────────────────────────────────────────────── */
const signupPasswordInput = document.getElementById('signupPassword');
if (signupPasswordInput) {
  signupPasswordInput.addEventListener('input', function () {
    const val = this.value;
    const bar = document.getElementById('passwordStrength');
    if (!bar) return;
    bar.className = 'password-strength';
    if (val.length < 6) bar.classList.add('weak');
    else if (val.length < 10 || !/[^a-zA-Z0-9]/.test(val)) bar.classList.add('medium');
    else bar.classList.add('strong');
  });
}

/* ─── Tab Switching ─────────────────────────────────────────────────────── */
function showTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const loginTab = document.getElementById('loginTab');
  const signupTab = document.getElementById('signupTab');
  const indicator = document.getElementById('tabIndicator');

  if (tab === 'login') {
    loginForm?.classList.remove('hidden');
    signupForm?.classList.add('hidden');
    loginTab?.classList.add('active');
    signupTab?.classList.remove('active');
    indicator?.classList.remove('right');
  } else {
    signupForm?.classList.remove('hidden');
    loginForm?.classList.add('hidden');
    signupTab?.classList.add('active');
    loginTab?.classList.remove('active');
    indicator?.classList.add('right');
  }
}

/* ─── Set button loading state ──────────────────────────────────────────── */
function setButtonLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  const text = btn.querySelector('.btn-text');
  const spinner = btn.querySelector('.btn-spinner');
  if (loading) {
    btn.disabled = true;
    text?.classList.add('hidden');
    spinner?.classList.remove('hidden');
  } else {
    btn.disabled = false;
    text?.classList.remove('hidden');
    spinner?.classList.add('hidden');
  }
}

/* ─── Login ────────────────────────────────────────────────────────────── */
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail')?.value.trim();
  const password = document.getElementById('loginPassword')?.value;

  if (!email || !password) return showToast('Please fill in all fields.', 'error');
  setButtonLoading('loginBtn', true);

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Login failed.');

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('authenticated', 'true');
    showToast('Login successful! Redirecting...', 'success');
    setTimeout(() => { window.location.href = 'index.html'; }, 900);
  } catch (err) {
    showToast(err.message, 'error');
    setButtonLoading('loginBtn', false);
  }
}

/* ─── Signup ────────────────────────────────────────────────────────────── */
async function handleSignup(e) {
  e.preventDefault();
  const username = document.getElementById('signupUsername')?.value.trim();
  const email = document.getElementById('signupEmail')?.value.trim();
  const password = document.getElementById('signupPassword')?.value;

  if (!username || !email || !password) return showToast('Please fill in all fields.', 'error');
  if (password.length < 6) return showToast('Password must be at least 6 characters.', 'error');
  setButtonLoading('signupBtn', true);

  try {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Signup failed.');

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('authenticated', 'true');
    showToast('Account created! Welcome to LyricsAI 🎵', 'success');
    setTimeout(() => { window.location.href = 'index.html'; }, 900);
  } catch (err) {
    showToast(err.message, 'error');
    setButtonLoading('signupBtn', false);
  }
}
