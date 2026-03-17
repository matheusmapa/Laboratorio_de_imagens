import './style.css';

const REGISTRY_URL = '/posts/registry.json';

/** @type {HTMLElement} */
const gallery = document.getElementById('gallery');
const categoriesContainer = document.getElementById('categories-container');
const emptyState = document.getElementById('empty-state');
const postCount = document.getElementById('post-count');

// Modal Elements
const editModal = document.getElementById('edit-modal');
const inputTitle = document.getElementById('edit-title');
const inputDesc = document.getElementById('edit-desc');
const inputCategory = document.getElementById('edit-category');
const btnSave = document.getElementById('save-modal');

// ─── State ────────────────────────────────────────────
let allPosts = [];
let activeFilter = 'all'; // can be 'all', '1080x1080', ..., 'trash'
let currentEditId = null;

// ─── Bootstrap ────────────────────────────────────────
init();

async function init() {
  showLoading();
  await loadPosts();
  setupFilters();
  setupModal();
}

async function loadPosts() {
  try {
    const res = await fetch(REGISTRY_URL);
    if (!res.ok) throw new Error('Registry not found');
    allPosts = await res.json();
    // Sort so newest is first by date, then alphabetically
    allPosts.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  } catch {
    allPosts = [];
  }
  render();
}

// ─── Filters & Top bar ─────────────────────────────────
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

// ─── Render Pipeline ──────────────────────────────────
function render() {
  // 1. Filter out trash depending on active tab
  let visiblePosts = allPosts;
  if (activeFilter === 'trash') {
    visiblePosts = visiblePosts.filter(p => !!p.deletedAt);
  } else {
    // Hide trash from normal views
    visiblePosts = visiblePosts.filter(p => !p.deletedAt);
    if (activeFilter !== 'all') {
      visiblePosts = visiblePosts.filter(p => p.format === activeFilter);
    }
  }

  postCount.textContent = `${visiblePosts.length} post${visiblePosts.length !== 1 ? 's' : ''}`;

  gallery.innerHTML = '';
  categoriesContainer.innerHTML = '';

  if (visiblePosts.length === 0) {
    gallery.style.display = 'none';
    categoriesContainer.style.display = 'none';
    emptyState.style.display = 'flex';
    if (activeFilter === 'trash') {
      emptyState.querySelector('h2').textContent = 'Lixeira Vazia';
      emptyState.querySelector('p').textContent = 'Nenhum post foi apagado recentemente.';
    } else {
      emptyState.querySelector('h2').textContent = 'Nenhum post encontrado';
      emptyState.querySelector('p').textContent = 'Peça ao agente IA para criar seu primeiro post!';
    }
    return;
  }

  emptyState.style.display = 'none';
  gallery.style.display = '';
  categoriesContainer.style.display = 'block';

  // 2. Group by Category if viewing "All"
  if (activeFilter === 'all') {
    gallery.style.display = 'none'; // hide flat gallery
    const byCategory = groupByCategory(visiblePosts);
    
    // Render each category block
    for (const [categoryName, posts] of Object.entries(byCategory)) {
      const isUncategorized = categoryName === 'Uncategorized';
      const icon = isUncategorized ? '📁' : '🧪';
      const displayTitle = isUncategorized ? 'Sem Pasta' : escapeHtml(categoryName);

      const section = document.createElement('div');
      section.className = 'folder-section';
      section.innerHTML = `
        <div class="folder-header">
          <span class="folder-icon">${icon}</span>
          <h2 class="folder-title">${displayTitle}</h2>
          <span class="folder-count">${posts.length}</span>
        </div>
        <div class="gallery">
          ${posts.map(post => createCard(post)).join('')}
        </div>
      `;
      categoriesContainer.appendChild(section);
    }
    
    bindCardEvents(categoriesContainer);
  } else {
    // Normal flat rendering for specific format filters or Trash
    categoriesContainer.style.display = 'none';
    gallery.style.display = '';
    gallery.innerHTML = visiblePosts.map(post => createCard(post)).join('');
    bindCardEvents(gallery);
  }

  // Animate cards on render
  requestAnimationFrame(() => {
    document.querySelectorAll('.card').forEach((card, i) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(16px)';
      setTimeout(() => {
        card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, (i % 15) * 50); // cap staggered delay
    });
  });
}

function groupByCategory(posts) {
  return posts.reduce((groups, post) => {
    const cat = post.category || 'Uncategorized';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(post);
    return groups;
  }, {});
}

function createCard(post) {
  const formatLabel = getFormatLabel(post.format);
  const slidesLabel = post.slides > 1 ? `${post.slides} slides` : 'Single';
  const dateStr = post.date || '';
  const tagsHtml = (post.tags || []).map(t => `<span class="card-tag">${t}</span>`).join('');
  
  const isTrash = !!post.deletedAt;

  // Render floating actions based on context
  let actionsHtml = '';
  if (isTrash) {
    actionsHtml = `
      <div class="card-actions">
        <button class="action-btn" title="Restaurar da Lixeira" data-action="restore" data-id="${post.id}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
        </button>
        <button class="action-btn delete-btn" title="Excluir Definitivamente" data-action="delete" data-id="${post.id}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
        </button>
      </div>
    `;
  } else {
    actionsHtml = `
      <div class="card-actions">
        <button class="action-btn" title="Editar Propriedades" data-action="edit" data-id="${post.id}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path><path d="m15 5 4 4"></path></svg>
        </button>
        <button class="action-btn delete-btn" title="Mover para Lixeira" data-action="trash" data-id="${post.id}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
        </button>
      </div>
    `;
  }

  return `
    <div class="card" id="card-${post.id}">
      ${actionsHtml}
      <a href="/posts/viewer.html?post=${post.id}" style="display:contents;">
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
            ${isTrash ? '<span class="card-tag" style="background:rgba(239, 68, 68, 0.2);color:#fca5a5;">Excluído</span>' : ''}
            <span class="card-tag format">${formatLabel}</span>
            <span class="card-tag slides">${slidesLabel}</span>
            ${tagsHtml}
            ${dateStr ? `<span class="card-tag date-tag">${dateStr}</span>` : ''}
          </div>
        </div>
      </a>
    </div>
  `;
}

// ─── API & Events ──────────────────────────────────────

function bindCardEvents(container) {
  const btns = container.querySelectorAll('.action-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation(); // prevent opening viewer
      
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      const post = allPosts.find(p => p.id === id);
      if (!post) return;

      if (action === 'trash') {
        const confirmStr = `Mover "${post.title}" para a Lixeira?`;
        if (!window.confirm(confirmStr)) return;
        await sendApiAction('/api/trash', { id });
      } else if (action === 'restore') {
        await sendApiAction('/api/restore', { id });
      } else if (action === 'delete') {
        const confirmStr = `Atenção!\nApagar "${post.title}" permanentemente do seu computador?\nESSA AÇÃO NÃO PODE SER DESFEITA.`;
        if (!window.confirm(confirmStr)) return;
        await sendApiAction('/api/delete', { id });
      } else if (action === 'edit') {
        openEditModal(post);
      }
    });
  });
}

async function sendApiAction(url, body) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      await loadPosts(); // Refresh state from disk directly
    } else {
      alert('Erro na API: ' + (await res.json()).error);
    }
  } catch (err) {
    alert('Erro de Conexão: ' + err.message);
  }
}

// ─── Edit Modal ────────────────────────────────────────

function setupModal() {
  document.getElementById('close-modal').addEventListener('click', closeEditModal);
  document.getElementById('cancel-modal').addEventListener('click', closeEditModal);
  
  btnSave.addEventListener('click', async () => {
    if (!currentEditId) return;
    
    // Disable inputs while saving
    btnSave.textContent = 'Salvando...';
    btnSave.style.opacity = '0.5';

    await sendApiAction('/api/update', {
      id: currentEditId,
      data: {
        title: inputTitle.value.trim(),
        description: inputDesc.value.trim(),
        category: inputCategory.value.trim()
      }
    });

    closeEditModal();
  });
}

function openEditModal(post) {
  currentEditId = post.id;
  inputTitle.value = post.title || '';
  inputDesc.value = post.description || '';
  inputCategory.value = post.category || '';
  
  btnSave.textContent = 'Salvar Alterações';
  btnSave.style.opacity = '1';
  
  editModal.style.display = 'flex';
  // Small delay to allow display flex to apply before opacity animation
  setTimeout(() => editModal.classList.add('active'), 10);
}

function closeEditModal() {
  editModal.classList.remove('active');
  setTimeout(() => {
    editModal.style.display = 'none';
    currentEditId = null;
  }, 300); // match css transition
}

// ─── Utils ─────────────────────────────────────────────

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
  gallery.style.display = '';
  categoriesContainer.style.display = 'none';
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
