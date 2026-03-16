/* ─── Guard: redirect to login if not authenticated ─────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;

  // Populate user info in sidebar
  const user = getUser();
  if (user) {
    document.getElementById('userName').textContent = user.username || 'User';
    document.getElementById('userEmail').textContent = user.email || '';
    document.getElementById('userAvatar').textContent = (user.username || 'U')[0].toUpperCase();
  }

  // Sidebar toggle (mobile)
  document.getElementById('sidebarToggle')?.addEventListener('click', openSidebar);
  document.getElementById('sidebarClose')?.addEventListener('click', closeSidebar);
  document.getElementById('sidebarOverlay')?.addEventListener('click', closeSidebar);

  // Character counter
  const textarea = document.getElementById('lyricsInput');
  const counter = document.getElementById('charCounter');
  textarea?.addEventListener('input', () => {
    const len = textarea.value.length;
    const max = parseInt(textarea.getAttribute('maxlength')) || 5000;
    counter.textContent = `${len} / ${max}`;
    counter.className = 'char-counter';
    if (len > max * 0.85) counter.classList.add('warning');
    if (len > max * 0.95) counter.classList.add('danger');
    
    // Clear validation error on input
    const errEl = document.getElementById('lyricsError');
    if (errEl && errEl.style.display === 'block') {
      errEl.style.display = 'none';
      textarea.classList.remove('shake');
    }
  });

  // Load languages and initialize Tom Select (Multilingual)
  loadLanguages();

  // Load recent searches
  loadRecentSearches();
});

/* ─── Sidebar ───────────────────────────────────────────────────────────── */
function openSidebar() {
  document.getElementById('sidebar')?.classList.add('open');
  document.getElementById('sidebarOverlay')?.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebarOverlay')?.classList.remove('active');
  document.body.style.overflow = '';
}

/* ─── Load and Initialize Languages (Multilingual) ─────────────────────── */
async function loadLanguages() {
  try {
    const res = await fetch(`${API_BASE}/lyrics/languages`);
    const data = await res.json();
    
    if (!res.ok || !data.success) throw new Error('Failed to load languages');
    
    const languages = data.data;
    const select = document.getElementById('explanationLanguage');
    if (!select) return;
    
    // Clear existing options except placeholder
    select.innerHTML = '<option value="">Choose a language...</option>';
    
    // Add languages
    languages.forEach(lang => {
      const option = document.createElement('option');
      option.value = lang.name;
      option.textContent = lang.name;
      select.appendChild(option);
    });
    
    // Set default to English
    select.value = 'English';
    
    // Initialize Tom Select on the dropdown
    if (window.TomSelect) {
      new TomSelect(select, {
        create: false,
        placeholder: 'Select explanation language...',
        searchField: ['text'],  // Search by language name
        maxItems: 1,
        hideSelected: true,
        closeAfterSelect: true,
      });
    }
  } catch (err) {
    console.error('[Language Loader] Error:', err.message);
    // Fallback: still show languages without Tom Select
    const select = document.getElementById('explanationLanguage');
    if (select) {
      const defaultLanguages = ['English', 'Hindi', 'Telugu', 'Tamil', 'Spanish', 'French', 'German'];
      select.innerHTML = '<option value="">Choose a language...</option>';
      defaultLanguages.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang;
        option.textContent = lang;
        select.appendChild(option);
      });
      select.value = 'English';
    }
  }
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */
function clearLyrics() {
  const ta = document.getElementById('lyricsInput');
  if (ta) { ta.value = ''; ta.dispatchEvent(new Event('input')); }
}

async function pasteLyrics() {
  try {
    const text = await navigator.clipboard.readText();
    const ta = document.getElementById('lyricsInput');
    if (ta) { ta.value = text; ta.dispatchEvent(new Event('input')); showToast('Pasted from clipboard!', 'info'); }
  } catch {
    showToast('Could not read clipboard. Please paste manually.', 'error');
  }
}

/* ─── Current analysis data (for save) ──────────────────────────────────── */
let currentAnalysis = null;

/* ─── Analyze Lyrics ────────────────────────────────────────────────────── */
async function analyzeLyrics() {
  const lyrics = document.getElementById('lyricsInput')?.value.trim();
  let songName = document.getElementById('songName')?.value.trim();
  const artist = document.getElementById('artist')?.value.trim();
  const movieName = document.getElementById('movieName')?.value.trim();
  const releaseDate = document.getElementById('releaseDate')?.value.trim();
  const explanationLanguage = document.getElementById('explanationLanguage')?.value || 'English';

  // Inject metadata into songName for the AI prompt without changing backend
  if (movieName || releaseDate) {
    const meta = [];
    if (movieName) meta.push(`Movie: ${movieName}`);
    if (releaseDate) meta.push(`Year: ${releaseDate}`);
    songName = `${songName || 'Unknown Song'} (${meta.join(', ')})`;
  }

  if (!lyrics || lyrics.length < 20) {
    const ta = document.getElementById('lyricsInput');
    const errEl = document.getElementById('lyricsError');
    ta.classList.remove('shake'); // Reset animation
    void ta.offsetWidth; // Trigger reflow
    ta.classList.add('shake');
    if (errEl) errEl.style.display = 'block';
    // Don't toast, handle it visually above
    return;
  }

  // Handle Split View CSS Layout Trigger (Desktop)
  document.getElementById('resultsContainer')?.classList.add('dashboard-split');
  document.querySelector('.analyzer-card')?.parentElement?.classList.add('split-left');

  // Show Skeleton Overlay instead of full screen loading
  document.getElementById('skeletonLoader')?.classList.remove('hidden');
  document.getElementById('resultsSection')?.classList.add('hidden');
  document.getElementById('analyzeBtn').disabled = true;
  
  // Start dynamic status text
  startStatusCarousel();

  try {
    const res = await fetch(`${API_BASE}/lyrics/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ lyrics, songName, artist, explanationLanguage }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 401) { logout(); return; }
      throw new Error(data.message || 'Analysis failed.');
    }

    currentAnalysis = { lyrics, songName, artist, explanationLanguage, provider: data.provider, ...data.data };
    saveRecentSearch(songName, artist);
    renderResults(currentAnalysis);
    showToast('Analysis complete! 🎶', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    document.getElementById('skeletonLoader')?.classList.add('hidden');
    document.getElementById('analyzeBtn').disabled = false;
    stopStatusCarousel();
  }
}

/* ─── Render Results ─────────────────────────────────────────────────────── */
function renderResults(data) {
  if (!data) {
    const verseContainer = document.getElementById('verseBreakdownResult');
    if (verseContainer) {
      verseContainer.innerHTML = '<div class="skeleton skeleton-text short">Loading...</div>';
    }
    return;
  }

  document.getElementById('resultSongName').textContent = data.songName || 'Unknown Song';
  const artistEl = document.getElementById('resultArtist');
  if (artistEl) {
    artistEl.textContent = data.artist && data.artist !== 'Unknown Artist' ? `by ${data.artist}` : '';
  }

  // Detected Language (NEW: Multilingual)
  const detectedLangEl = document.getElementById('detectedLanguageResult');
  if (detectedLangEl) {
    const langCode = data.detected_language_code || 'unknown';
    const langName = data.detected_language || 'Unknown';
    detectedLangEl.innerHTML = `<strong>${langName}</strong> <span style="color: #888; font-size: 13px;">(${langCode})</span>`;
  }

  // Translated Lyrics (NEW: Multilingual)
  const translatedEl = document.getElementById('translatedLyricsResult');
  if (translatedEl) {
    const translated = data.translated_lyrics || data.lyrics || 'No translation available';
    translatedEl.textContent = translated;
  }

  // Use typewriter effect for text
  typewriterEffect(document.getElementById('themeResult'), data.theme || 'N/A');
  typewriterEffect(document.getElementById('hiddenMeaningResult'), data.hiddenMeaning || 'N/A');
  typewriterEffect(document.getElementById('overallMessageResult'), data.overallMessage || 'N/A');
  typewriterEffect(document.getElementById('culturalContextResult'), data.culturalContext || 'N/A');
  typewriterEffect(document.getElementById('ahaInsightResult'), data.ahaInsight || 'N/A');

  // Set Provider Label
  const providerEl = document.getElementById('aiProviderResult');
  if (providerEl) {
    providerEl.textContent = data.provider || 'Unknown';
  }

  // Set Explanation Language (NEW: Multilingual)
  const explanationLangEl = document.getElementById('detectedLanguageResult')?.parentElement?.querySelector('.result-card-header');
  // Note: This displays in the detected language section; actual explanation is in specific fields

  // Line By Line Explanation (NEW: Multilingual)
  const lineByLineEl = document.getElementById('lineByLineResult');
  if (lineByLineEl && data.line_by_line_explanation && Array.isArray(data.line_by_line_explanation)) {
    lineByLineEl.innerHTML = '';
    data.line_by_line_explanation.forEach((item, idx) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'line-by-line-item';
      itemEl.innerHTML = `
        <div class="line-text"><strong>${item.line}</strong></div>
        <div class="line-explanation">${item.explanation}</div>
      `;
      lineByLineEl.appendChild(itemEl);
    });
  }

  // Process lyrics into interactive line-by-line breakdown
  const verseContainer = document.getElementById('verseBreakdownResult');
  verseContainer.innerHTML = '';
  verseContainer.className = 'lyrics-breakdown-container';

  const lines = data?.lyrics?.split('\n') || [];
  
  if (lines.length === 0) {
    verseContainer.innerHTML = '<div class="skeleton skeleton-text short">No lyrics available to display.</div>';
  }
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    const wrapper = document.createElement('div');
    wrapper.className = 'lyric-line-wrapper';
    
    // Add original verse breakdown if provided (as a summary section at the top of the container)
    // Actually, we'll just show the lyrics line-by-line
    
    if (!trimmedLine) {
      wrapper.innerHTML = `<div class="lyric-line-content"><div class="lyric-text empty"></div></div>`;
    } else {
      wrapper.innerHTML = `
        <div class="lyric-line-content">
          <div class="lyric-text">${trimmedLine}</div>
          <button class="explain-btn" onclick="explainLine(this, \`${trimmedLine.replace(/"/g, '&quot;').replace(/'/g, '\\\'')}\`)">
            <span>✨</span> Explain
          </button>
        </div>
        <div class="lyric-explanation-box hidden"></div>
      `;
    }
    verseContainer.appendChild(wrapper);
  });

  
  // Set the tone badge color based on text
  const toneEl = document.getElementById('toneResult');
  let badgeColor = '#ffbd2e'; // yellow default
  const toneText = (data.emotionalTone || '').toLowerCase();
  
  if (toneText.includes('sad') || toneText.includes('melanchol')) badgeColor = '#3b82f6'; // blue
  else if (toneText.includes('angry') || toneText.includes('rage')) badgeColor = '#ef4444'; // red
  else if (toneText.includes('happy') || toneText.includes('joy') || toneText.includes('hope')) badgeColor = '#10b981'; // green
  else if (toneText.includes('love') || toneText.includes('romanc')) badgeColor = '#ec4899'; // pink
  
  toneEl.innerHTML = `<div class="emotion-badge" style="background: ${badgeColor}20; color: ${badgeColor}; border: 1px solid ${badgeColor}40;">${data.emotionalTone || 'N/A'}</div>`;

  document.getElementById('resultsSection')?.classList.remove('hidden');
  document.getElementById('resultsSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ─── Inline "Explain this line" Logic ──────────────────────────────────── */
async function explainLine(btnEl, lineText) {
  const container = btnEl.closest('.lyric-line-wrapper').querySelector('.lyric-explanation-box');
  
  // If already visible, toggle it off
  if (!container.classList.contains('hidden')) {
    container.classList.add('hidden');
    return;
  }

  // Show loading state
  container.classList.remove('hidden');
  container.className = 'lyric-explanation-box inline-explanation';
  container.innerHTML = `<span class="btn-spinner" style="border-top-color: var(--accent-purple); width: 14px; height: 14px; display: inline-block; margin-right: 8px;"></span> <em>AI is analyzing this line...</em>`;

  try {
    const songCtx = currentAnalysis?.songName || '';
    const artistCtx = currentAnalysis?.artist || '';
    
    const res = await fetch(`${API_BASE}/lyrics/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ 
        lyrics: lineText, 
        songName: `Context: A specific line from the song ${songCtx}`, 
        artist: artistCtx 
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 401) { logout(); return; }
      throw new Error(data.message || 'Failed to explain line.');
    }

    // The explanation is likely in hiddenMeaning or overallMessage or theme
    const answer = data.data.hiddenMeaning || data.data.overallMessage || data.data.verseBreakdown[0] || 'No detailed explanation available.';
    const formattedAnswer = answer.replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--text-primary)">$1</strong>');
    
    container.innerHTML = `<strong>Meaning:</strong> ${formattedAnswer}`;
  } catch (err) {
    container.innerHTML = `<span style="color: var(--error)">Error: ${err.message}</span>`;
  }
}

/* ─── Save Explanation ───────────────────────────────────────────────────── */
async function saveExplanation() {
  if (!currentAnalysis) return showToast('No analysis to save. Please analyze lyrics first.', 'error');

  const isPublic = document.getElementById('isPublic')?.checked ?? true;
  const saveBtn = document.getElementById('saveBtn');
  saveBtn.disabled = true;
  saveBtn.textContent = '💾 Saving...';

  try {
    // Extract multilingual fields from current analysis (NEW: Multilingual)
    const saveData = {
      ...currentAnalysis,
      isPublic,
      // Multilingual fields
      detectedLanguage: currentAnalysis.detected_language || 'Unknown',
      detectedLanguageCode: currentAnalysis.detected_language_code || 'unknown',
      translatedLyrics: currentAnalysis.translated_lyrics || null,
      explanationLanguage: currentAnalysis.explanationLanguage || 'English',
      explanationLanguageCode: 'en', // Will be set properly when language service is extended
      lineByLineExplanation: currentAnalysis.line_by_line_explanation || [],
    };

    const res = await fetch(`${API_BASE}/lyrics/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(saveData),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to save.');

    showToast('Explanation saved! 💾', 'success');
    saveBtn.textContent = '✅ Saved';
    setTimeout(() => { saveBtn.textContent = '💾 Save'; saveBtn.disabled = false; }, 2000);
  } catch (err) {
    showToast(err.message, 'error');
    saveBtn.disabled = false;
    saveBtn.textContent = '💾 Save';
  }
}

/* ─── Copy Explanation ───────────────────────────────────────────────────── */
async function copyExplanation() {
  if (!currentAnalysis) return;

  const text = `🎵 ${currentAnalysis.songName} – AI Analysis

🎭 Theme: ${currentAnalysis.theme}

💜 Emotional Tone: ${currentAnalysis.emotionalTone}

🔍 Hidden Meaning: ${currentAnalysis.hiddenMeaning}

💌 Overall Message: ${currentAnalysis.overallMessage}

🌍 Cultural Context: ${currentAnalysis.culturalContext}

💡 The "Aha!" Insight: ${currentAnalysis.ahaInsight}

${Array.isArray(currentAnalysis.verseBreakdown)
  ? currentAnalysis.verseBreakdown.map((v, i) => `📜 Section ${i+1}: ${v}`).join('\n\n')
  : ''}

– Analyzed by LyricsAI`;

  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard! 📋', 'success');
  } catch {
    showToast('Could not copy. Please copy manually.', 'error');
  }
}

/* ─── Share Explanation ─────────────────────────────────────────────────── */
async function shareExplanation() {
  if (!currentAnalysis) return;

  const shareData = {
    title: `${currentAnalysis.songName} – AI Lyrics Analysis`,
    text: `Check out this AI analysis of "${currentAnalysis.songName}"!\n\nTheme: ${currentAnalysis.theme}`,
    url: window.location.href,
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch {}
  } else {
    await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`).catch(() => {});
    showToast('Link copied to clipboard! 🔗', 'info');
  }
}

/* ─── Export to Image (html2canvas) ─────────────────────────────────────── */
async function exportToImage() {
  const section = document.getElementById('resultsSection');
  if (!section || !window.html2canvas) return showToast('Export not available.', 'error');

  const btn = document.getElementById('exportBtn');
  btn.disabled = true;
  btn.textContent = '📸 Exporting...';

  try {
    section.classList.add('exporting'); // apply specific export styling (hide elements, add branding)
    
    // Give browser a moment to apply export CSS
    await new Promise(r => setTimeout(r, 100));

    const canvas = await html2canvas(section, {
      backgroundColor: '#0a0a0f', // Match dark theme
      scale: 2, // High resolution
      logging: false,
      useCORS: true
    });

    const link = document.createElement('a');
    link.download = `LyricsAI_${currentAnalysis?.songName?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'analysis'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    showToast('Exported successfully! 📸', 'success');
  } catch (err) {
    showToast('Failed to export image.', 'error');
    console.error(err);
  } finally {
    section.classList.remove('exporting');
    btn.disabled = false;
    btn.textContent = '📸 Export';
  }
}

/* ─── Typewriter Effect ─────────────────────────────────────────────────── */
function typewriterEffect(element, text, speed = 15) {
  element.innerHTML = '<span class="typewriter-cursor"></span>';
  let i = 0;
  let isBold = false;
  let currentSpan = null;
  
  function type() {
    if (i < text.length) {
      const cursor = element.querySelector('.typewriter-cursor');
      
      // Check for markdown bold syntax
      if (text.substr(i, 2) === '**') {
        isBold = !isBold;
        i += 2;
        if (isBold) {
          currentSpan = document.createElement('strong');
          currentSpan.style.color = 'var(--text-primary)';
          element.insertBefore(currentSpan, cursor);
        } else {
          currentSpan = null;
        }
        type(); // Process next char immediately
        return;
      }
      
      const charTag = document.createTextNode(text.charAt(i));
      if (currentSpan) {
        currentSpan.appendChild(charTag);
      } else {
        element.insertBefore(charTag, cursor);
      }
      
      i++;
      setTimeout(type, speed);
    } else {
      // Remove cursor when done
      const cursor = element.querySelector('.typewriter-cursor');
      if (cursor) cursor.remove();
    }
  }
  
  // Small delay to let cards render
  setTimeout(type, 300);
}

/* ─── Dynamic Status Carousel ───────────────────────────────────────────── */
let statusInterval;
function startStatusCarousel() {
  const statuses = [
    "Tuning the AI engine...",
    "Decoding hidden metaphors...",
    "Analyzing emotional frequency...",
    "Extracting cultural context...",
    "Finalizing lyrical insights..."
  ];
  const el = document.getElementById('statusText');
  if (!el) return;
  
  let i = 0;
  el.textContent = statuses[0];
  
  statusInterval = setInterval(() => {
    el.classList.add('exit');
    setTimeout(() => {
      i = (i + 1) % statuses.length;
      el.textContent = statuses[i];
      el.classList.remove('exit', 'active');
      void el.offsetWidth; // Trigger reflow
      el.classList.add('active');
    }, 400); // Wait 400ms for exit animation
  }, 1200); // 1.2s cycle
}

function stopStatusCarousel() {
  clearInterval(statusInterval);
}

/* ─── Local Recent Searches ─────────────────────────────────────────────── */
function saveRecentSearch(songName, artist) {
  if (!songName) return;
  const key = 'lyrics_ai_recent';
  let recents = JSON.parse(localStorage.getItem(key) || '[]');
  
  const displayLine = artist ? `${songName} - ${artist}` : songName;
  
  // Remove if exists
  recents = recents.filter(r => r !== displayLine);
  
  // Add to start
  recents.unshift(displayLine);
  
  // Keep only last 3
  if (recents.length > 3) recents = recents.slice(0, 3);
  
  localStorage.setItem(key, JSON.stringify(recents));
  loadRecentSearches();
}

function loadRecentSearches() {
  const key = 'lyrics_ai_recent';
  const recents = JSON.parse(localStorage.getItem(key) || '[]');
  const container = document.getElementById('recentSearches');
  const list = document.getElementById('recentSearchesList');
  
  if (!container || !list) return;
  
  if (recents.length === 0) {
    container.classList.add('hidden');
    return;
  }
  
  container.classList.remove('hidden');
  list.innerHTML = '';
  
  recents.forEach(item => {
    const pill = document.createElement('div');
    pill.className = 'recent-pill';
    pill.innerHTML = `<span>🕒</span> ${item}`;
    pill.onclick = () => {
      // Auto-fill form and try to analyze
      const parts = item.split(' - ');
      document.getElementById('songName').value = parts[0] || '';
      document.getElementById('artist').value = parts[1] || '';
      // Clear optional so they don't break the prompt
      document.getElementById('movieName').value = '';
      document.getElementById('releaseDate').value = '';
      
      const ta = document.getElementById('lyricsInput');
      if (ta.value.length < 20) {
        showToast('Please paste lyrics to analyze this recent song.', 'info');
        ta.focus();
      } else {
        analyzeLyrics();
      }
    };
    list.appendChild(pill);
  });
}
