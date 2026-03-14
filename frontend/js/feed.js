/* ─── State ─────────────────────────────────────────────────────────────── */
let currentPage = 1;
let totalPages = 1;
let searchQuery = '';
let searchTimer = null;

/* ─── Init ──────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  loadFeed(1);
});

/* ─── Sidebar (shared layout) ────────────────────────────────────────────── */
function initSidebar() {
  // Mobile toggle
  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.add('open');
    document.getElementById('sidebarOverlay')?.classList.add('active');
    document.body.style.overflow = 'hidden';
  });
  document.getElementById('sidebarClose')?.addEventListener('click', () => closeSidebar());
  document.getElementById('sidebarOverlay')?.addEventListener('click', () => closeSidebar());

  // User info / login button
  const token = getToken();
  const user = getUser();
  const footer = document.getElementById('sidebarFooter');
  const mobileBtn = document.getElementById('loginBtnMobile');

  if (token && user && footer) {
    footer.innerHTML = `
      <div class="user-info">
        <div class="user-avatar">${(user.username || 'U')[0].toUpperCase()}</div>
        <div>
          <p class="user-name">${user.username}</p>
          <p class="user-email">${user.email}</p>
        </div>
      </div>
      <button class="btn btn-ghost btn-sm logout-btn" onclick="logout()">🚪 Logout</button>
    `;
    if (mobileBtn) { mobileBtn.textContent = '🎛 Dashboard'; mobileBtn.href = 'dashboard.html'; }
  }
}

function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebarOverlay')?.classList.remove('active');
  document.body.style.overflow = '';
}

/* ─── Load Feed ──────────────────────────────────────────────────────────── */
async function loadFeed(page = 1) {
  currentPage = page;
  showFeedLoading(true);

  try {
    const res = await fetch(`${API_BASE}/lyrics/feed?page=${page}&limit=12`);
    const data = await res.json();

    if (!data.success) throw new Error(data.message);

    totalPages = data.pagination?.pages || 1;
    const total = data.pagination?.total || 0;

    const totalEl = document.getElementById('totalCount');
    if (totalEl) totalEl.textContent = total;

    renderFeed(data.data);
    renderPagination();
  } catch (err) {
    showEmpty('Failed to load feed. Please try again.');
    console.error(err);
  } finally {
    showFeedLoading(false);
  }
}

/* ─── Search ─────────────────────────────────────────────────────────────── */
function debounceSearch(value) {
  clearTimeout(searchTimer);
  const clearBtn = document.getElementById('clearSearchBtn');
  if (clearBtn) clearBtn.style.display = value ? 'inline-flex' : 'none';
  searchTimer = setTimeout(() => {
    searchQuery = value.trim();
    if (searchQuery) {
      search();
    } else {
      loadFeed(1);
    }
  }, 400);
}

async function search() {
  const q = document.getElementById('searchInput')?.value.trim();
  if (!q) return loadFeed(1);
  searchQuery = q;
  showFeedLoading(true);

  try {
    const res = await fetch(`${API_BASE}/lyrics/search?song=${encodeURIComponent(q)}`);
    const data = await res.json();

    if (!data.success) throw new Error(data.message);

    if (!data.data.length) {
      showEmpty(`No results found for "${q}"`);
    } else {
      renderFeed(data.data);
      document.getElementById('pagination').innerHTML = '';
    }
  } catch (err) {
    showEmpty(err.message);
  } finally {
    showFeedLoading(false);
  }
}

function clearSearch() {
  document.getElementById('searchInput').value = '';
  document.getElementById('clearSearchBtn').style.display = 'none';
  searchQuery = '';
  loadFeed(1);
}

/* ─── Render Feed Cards ──────────────────────────────────────────────────── */
function toSentenceCase(text) {
  const trimmed = String(text || '').trim().toLowerCase();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function renderFeed(songs) {
  const grid = document.getElementById('feedGrid');
  const empty = document.getElementById('emptyState');
  grid.innerHTML = '';

  if (!songs.length) {
    grid.style.display = 'none';
    empty.classList.remove('hidden');
    document.getElementById('emptyMessage').textContent = 'No songs decoded yet. Be the first!';
    return;
  }

  grid.style.display = 'grid';
  empty.classList.add('hidden');

  songs.forEach((song) => {
    const card = document.createElement('div');
    card.className = 'feed-card glass-card';
    card.onclick = () => openModal(song);

    const preview = song.overallMessage || song.hiddenMeaning || 'Click to read the full analysis.';
    const parseMd = (str) => escapeHtml(str).replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--text-primary)">$1</strong>');

    const toneText = (song.emotionalTone || '').toLowerCase();
    let badgeColor = '#ffbd2e'; // yellow default
    if (toneText.includes('sad') || toneText.includes('melanchol')) badgeColor = '#3b82f6';
    else if (toneText.includes('angry') || toneText.includes('rage')) badgeColor = '#ef4444';
    else if (toneText.includes('happy') || toneText.includes('joy') || toneText.includes('hope')) badgeColor = '#10b981';
    else if (toneText.includes('love') || toneText.includes('romanc')) badgeColor = '#ec4899';

    const themeText = song.theme ? toSentenceCase(song.theme) : 'Theme unknown';
    const emotionText = song.emotionalTone ? toSentenceCase(song.emotionalTone) : 'N/A';

    card.innerHTML = `
      <div class="feed-card-header">
        <div class="feed-song-info">
          <h3>${escapeHtml(song.songName)}</h3>
          <p class="feed-artist">🎤 ${escapeHtml(song.artist || 'Unknown Artist')}</p>
        </div>
        <span class="feed-badge">AI ✨</span>
      </div>
      <div class="feed-theme">🎭 ${parseMd(themeText)}</div>
      <p class="feed-preview">${parseMd(preview)}</p>
      <div class="feed-card-footer">
        <span class="emotion-badge" style="background: ${badgeColor}15; color: ${badgeColor}; border: 1px solid ${badgeColor}30; padding: 4px 10px; font-size: 0.74rem;">💜 ${escapeHtml(emotionText)}</span>
        <span class="feed-read">Read more →</span>
      </div>
    `;
    grid.appendChild(card);
  });
}

/* ─── Modal ──────────────────────────────────────────────────────────────── */
function openModal(song) {
  const overlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');
  const parseMd = (str) => escapeHtml(str).replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--text-primary)">$1</strong>');

  const verses = Array.isArray(song.verseBreakdown)
    ? song.verseBreakdown.map((v, i) => `<div class="verse-item"><div class="verse-number">Section ${i + 1}</div><div class="verse-text">${parseMd(v)}</div></div>`).join('')
    : `<div class="verse-item"><div class="verse-text">${parseMd(song.verseBreakdown || '')}</div></div>`;

  content.innerHTML = `
    <h2 class="modal-song-title">${escapeHtml(song.songName)}</h2>
    <p class="modal-artist">🎤 ${escapeHtml(song.artist || 'Unknown Artist')}</p>
    <div class="modal-section">
      <div class="modal-section-title">🎭 Theme</div>
      <p>${parseMd(song.theme)}</p>
    </div>
    <div class="modal-section">
      <div class="modal-section-title">💜 Emotional Tone</div>
      <p>${escapeHtml(song.emotionalTone)}</p>
    </div>
    <div class="modal-section">
      <div class="modal-section-title">📜 Verse Breakdown</div>
      <div class="verse-list">${verses}</div>
    </div>
    <div class="modal-section">
      <div class="modal-section-title">🔍 Hidden Meaning</div>
      <p>${parseMd(song.hiddenMeaning)}</p>
    </div>
    <div class="modal-section">
      <div class="modal-section-title">💌 Overall Message</div>
      <p>${parseMd(song.overallMessage)}</p>
    </div>
    <div class="modal-section">
      <div class="modal-section-title">🌍 Cultural Context</div>
      <p>${parseMd(song.culturalContext || 'No context available.')}</p>
    </div>
    <div class="modal-section">
      <div class="modal-section-title">💡 The "Aha!" Insight</div>
      <p>${parseMd(song.ahaInsight || 'No insight available.')}</p>
    </div>
  `;

  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay')?.classList.add('hidden');
  document.body.style.overflow = '';
}

/* ─── Pagination ─────────────────────────────────────────────────────────── */
function renderPagination() {
  const container = document.getElementById('pagination');
  if (!container || totalPages <= 1) { container.innerHTML = ''; return; }

  let html = '';
  if (currentPage > 1) {
    html += `<button class="page-btn" onclick="loadFeed(${currentPage - 1})">‹</button>`;
  }
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="loadFeed(${i})">${i}</button>`;
  }
  if (currentPage < totalPages) {
    html += `<button class="page-btn" onclick="loadFeed(${currentPage + 1})">›</button>`;
  }
  container.innerHTML = html;
}

/* ─── Utilities ──────────────────────────────────────────────────────────── */
function showFeedLoading(show) {
  const el = document.getElementById('feedLoading');
  if (el) el.style.display = show ? 'flex' : 'none';
}

function showEmpty(msg) {
  document.getElementById('feedGrid').innerHTML = '';
  document.getElementById('feedGrid').style.display = 'none';
  const empty = document.getElementById('emptyState');
  if (empty) {
    empty.classList.remove('hidden');
    const msgEl = document.getElementById('emptyMessage');
    if (msgEl) msgEl.textContent = msg || 'Nothing to show.';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
