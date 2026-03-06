import './style.css';

const REGISTRY_URL = '/posts/registry.json';

/** @type {HTMLElement} */
const gallery = document.getElementById('gallery');
const emptyState = document.getElementById('empty-state');
const postCount = document.getElementById('post-count');

// ─── State ────────────────────────────────────────────
let allPosts = [];
let activeFilter = 'all';

// ─── Bootstrap ────────────────────────────────────────
init();

async function init() {
  showLoading();
  try {
    const res = await fetch(REGISTRY_URL);
    if (!res.ok) throw new Error('Registry not found');
    allPosts = await res.json();
  } catch {
    allPosts = [];
  }
  setupFilters();
  render();
}

// ─── Filters ──────────────────────────────────────────
function setupFilters() {
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      render();
    });
  });
}

// ─── Render ───────────────────────────────────────────
function render() {
  const filtered = activeFilter === 'all'
    ? allPosts
    : allPosts.filter(p => p.format === activeFilter);

  postCount.textContent = `${filtered.length} post${filtered.length !== 1 ? 's' : ''}`;

  if (filtered.length === 0) {
    gallery.innerHTML = '';
    gallery.style.display = 'none';
    emptyState.style.display = 'flex';
    return;
  }

  emptyState.style.display = 'none';
  gallery.style.display = '';

  gallery.innerHTML = filtered.map(post => createCard(post)).join('');

  // Animate cards in
  requestAnimationFrame(() => {
    gallery.querySelectorAll('.card').forEach((card, i) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(16px)';
      setTimeout(() => {
        card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, i * 60);
    });
  });
}

function createCard(post) {
  const formatLabel = getFormatLabel(post.format);
  const slidesLabel = post.slides > 1 ? `${post.slides} slides` : 'Single';
  const dateStr = post.date || '';
  const tagsHtml = (post.tags || []).map(t => `<span class="card-tag">${t}</span>`).join('');

  return `
    <a href="/posts/viewer.html?post=${post.id}" class="card" id="card-${post.id}">
      <div class="card-preview">
        <div class="card-preview-placeholder">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </div>
      </div>
      <div class="card-body">
        <div class="card-title-row">
          <span class="card-title">${escapeHtml(post.title)}</span>
          <svg class="card-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
          </svg>
        </div>
        <p class="card-desc">${escapeHtml(post.description)}</p>
        <div class="card-meta">
          <span class="card-tag format">${formatLabel}</span>
          <span class="card-tag slides">${slidesLabel}</span>
          ${tagsHtml}
          ${dateStr ? `<span class="card-tag date-tag">${dateStr}</span>` : ''}
        </div>
      </div>
    </a>
  `;
}

// ─── Helpers ──────────────────────────────────────────

function getFormatLabel(format) {
  const map = {
    '1080x1080': 'Feed 1:1',
    '1080x1350': 'Feed 4:5',
    '1080x1920': 'Story',
  };
  return map[format] || format || 'Custom';
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showLoading() {
  gallery.innerHTML = Array.from({ length: 6 }, () => `
    <div class="skeleton-card">
      <div class="skeleton-preview"></div>
      <div class="skeleton-body">
        <div class="skeleton-line medium"></div>
        <div class="skeleton-line short"></div>
      </div>
    </div>
  `).join('');
}
