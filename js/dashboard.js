// ============================================================
// DASHBOARD MODULE
// ============================================================

let currentUser = null;
let currentProfile = null;
let currentFilters = { type: 'all', status: 'all', search: '', category: 'all' };
let activeTab = 'all';
let itemsCache = [];

// ── Init ────────────────────────────────────────────────────
async function initDashboard() {
    currentUser = await requireAuth();
    if (!currentUser) return;

    currentProfile = await getUserProfile(currentUser.id);
    renderUserInfo();
    await loadItems();
    initTabs();
    initSearch();
    initModals();
    initForms();
    setupLogout();
}

// ── User Info ───────────────────────────────────────────────
function renderUserInfo() {
    const usernameEl = document.getElementById('nav-username');
    const pointsEl = document.getElementById('nav-points');
    const avatarEl = document.getElementById('nav-avatar');

    if (usernameEl) usernameEl.textContent = currentProfile.username;
    if (pointsEl) pointsEl.textContent = `${currentProfile.points || 0} pts`;
    if (avatarEl) {
        const initials = currentProfile.username.substring(0, 2).toUpperCase();
        avatarEl.textContent = initials;
        avatarEl.style.background = getAvatarColor(currentProfile.username);
    }
}

// ── Load & Render Items ──────────────────────────────────────
async function loadItems() {
    const grid = document.getElementById('items-grid');
    if (!grid) return;
    grid.innerHTML = `<div class="loading-spinner"><div class="spinner"></div><p>Loading items...</p></div>`;

    try {
        let items;
        if (activeTab === 'mine') {
            items = await fetchMyItems(currentUser.id);
        } else {
            const filters = { ...currentFilters };
            if (activeTab === 'lost') filters.type = 'lost';
            else if (activeTab === 'found') filters.type = 'found';
            else if (activeTab === 'all') delete filters.type;
            items = await fetchItems(filters);
        }

        itemsCache = items;
        renderItems(items);
        updateStats(items);
    } catch (err) {
        grid.innerHTML = `<div class="error-state"><p>❌ Failed to load items: ${err.message}</p></div>`;
    }
}

function renderItems(items) {
    const grid = document.getElementById('items-grid');
    if (!grid) return;

    if (!items || items.length === 0) {
        grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>No items found</h3>
        <p class="empty-sub">Try adjusting your filters or be the first to report an item!</p>
      </div>`;
        return;
    }

    grid.innerHTML = items.map(item => createItemCard(item)).join('');
}

function createItemCard(item) {
    const isOwner = item.user_id === currentUser.id;
    const canClaim = !isOwner && item.status === 'Open';
    const canManage = isOwner && item.status !== 'Returned';

    return `
    <div class="item-card" data-id="${item.id}">
      <div class="item-card-image">
        ${item.image_url
            ? `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.name)}" loading="lazy">`
            : `<div class="item-no-image">${getCategoryIcon(item.category)}</div>`}
        <div class="item-card-badges">
          ${getTypeBadge(item.type)}
          ${getStatusBadge(item.status)}
        </div>
      </div>
      <div class="item-card-body">
        <h3 class="item-card-title">${escapeHtml(item.name)}</h3>
        <p class="item-card-desc">${escapeHtml(item.description || 'No description provided.')}</p>
        <div class="item-card-meta">
          <span>📍 ${escapeHtml(item.location || 'Unknown')}</span>
          <span>📅 ${formatDate(item.date_occurred)}</span>
          <span>${getCategoryIcon(item.category)} ${escapeHtml(item.category || 'Other')}</span>
          <span>👤 ${item.profiles ? escapeHtml(item.profiles.username) : 'Unknown'}</span>
        </div>
        <div class="item-card-footer">
          <span class="item-time">${timeAgo(item.created_at)}</span>
          <div class="item-card-actions">
            ${canClaim ? `<button class="btn btn-claim" onclick="openClaimModal('${item.id}', '${item.user_id}')">${item.type === 'lost' ? '🔍 I Found This' : "🙋 That's Mine"}</button>` : ''}
            ${isOwner && item.status !== 'Returned' ? `<button class="btn btn-view-claims" onclick="openClaimsViewModal('${item.id}')">📋 Claims</button>` : ''}
            ${isOwner ? `<button class="btn btn-delete btn-sm" onclick="handleDeleteItem('${item.id}', '${item.image_url || ''}')">🗑️</button>` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

function updateStats(items) {
    const totalEl = document.getElementById('stat-total');
    const lostEl = document.getElementById('stat-lost');
    const foundEl = document.getElementById('stat-found');
    const resolvedEl = document.getElementById('stat-resolved');

    if (totalEl) totalEl.textContent = items.length;
    if (lostEl) lostEl.textContent = items.filter(i => i.type === 'lost').length;
    if (foundEl) foundEl.textContent = items.filter(i => i.type === 'found').length;
    if (resolvedEl) resolvedEl.textContent = items.filter(i => i.status === 'Returned').length;
}

// ── Tabs ─────────────────────────────────────────────────────
function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeTab = btn.dataset.tab;
            currentFilters = { type: 'all', status: 'all', search: '', category: 'all' };
            document.getElementById('search-input').value = '';
            document.getElementById('filter-category').value = 'all';
            document.getElementById('filter-status').value = 'all';
            await loadItems();
        });
    });
}

// ── Search & Filter ──────────────────────────────────────────
function initSearch() {
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('filter-category');
    const statusFilter = document.getElementById('filter-status');

    const debouncedSearch = debounce(async () => {
        currentFilters.search = searchInput.value.trim();
        await loadItems();
    }, 350);

    searchInput.addEventListener('input', debouncedSearch);

    categoryFilter.addEventListener('change', async () => {
        currentFilters.category = categoryFilter.value;
        await loadItems();
    });

    statusFilter.addEventListener('change', async () => {
        currentFilters.status = statusFilter.value;
        await loadItems();
    });
}

// ── Modals ────────────────────────────────────────────────────
function initModals() {
    // Close modal on backdrop click
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) closeAllModals();
        });
    });

    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

    // Report buttons
    document.getElementById('btn-report-lost').addEventListener('click', () => openReportModal('lost'));
    document.getElementById('btn-report-found').addEventListener('click', () => openReportModal('found'));

    // Leaderboard tab
    document.getElementById('btn-leaderboard').addEventListener('click', loadLeaderboardPanel);
}

function openReportModal(type) {
    const modal = document.getElementById('report-modal');
    const title = document.getElementById('report-modal-title');
    const typeInput = document.getElementById('form-type');
    const categoryRow = document.getElementById('category-row');
    const dateLostLabel = document.getElementById('date-label');

    title.textContent = type === 'lost' ? '📍 Report Lost Item' : '🎯 Report Found Item';
    typeInput.value = type;
    categoryRow.style.display = type === 'lost' ? '' : '';
    dateLostLabel.textContent = type === 'lost' ? 'Date Lost *' : 'Date Found *';
    modal.classList.add('modal-open');
}

function closeAllModals() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('modal-open'));
    document.getElementById('report-form').reset();
    document.getElementById('image-preview-container').innerHTML = '';
}

async function openClaimModal(itemId, ownerId) {
    if (ownerId === currentUser.id) {
        showToast('You cannot claim your own item.', 'warning');
        return;
    }
    const modal = document.getElementById('claim-modal');
    document.getElementById('claim-item-id').value = itemId;
    document.getElementById('claim-owner-id').value = ownerId;
    modal.classList.add('modal-open');
}

async function openClaimsViewModal(itemId) {
    const modal = document.getElementById('claims-view-modal');
    const list = document.getElementById('claims-list');
    list.innerHTML = `< div class="loading-spinner" > <div class="spinner"></div></div > `;
    document.getElementById('claims-view-item-id').value = itemId;
    modal.classList.add('modal-open');

    try {
        const claims = await fetchClaimsForItem(itemId);
        if (!claims || claims.length === 0) {
            list.innerHTML = `< p class="no-claims" > No claims submitted yet.</p > `;
            return;
        }
        list.innerHTML = claims.map(c => `
        < div class="claim-row" >
        <div class="claim-info">
          <strong>👤 ${escapeHtml(c.claimer?.username || 'Unknown')}</strong>
          <span class="claim-time">${timeAgo(c.created_at)}</span>
        </div>
        <div class="claim-status ${c.status.toLowerCase()}">${c.status}</div>
        ${c.status === 'Pending' ? `
          <div class="claim-actions">
            <button class="btn btn-approve" onclick="handleApproveClaim('${c.id}', '${itemId}', '${c.owner_id}')">✅ Approve</button>
            <button class="btn btn-reject" onclick="handleRejectClaim('${c.id}', '${itemId}')">❌ Reject</button>
          </div>` : ''
            }
      </div >
        `).join('');
    } catch (err) {
        list.innerHTML = `< p class="error-text" > Failed to load claims: ${err.message}</p > `;
    }
}

// ── Forms ─────────────────────────────────────────────────────
function initForms() {
    // Image preview
    document.getElementById('form-image').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            document.getElementById('image-preview-container').innerHTML = `
        < img src = "${ev.target.result}" alt = "Preview" class="image-preview" > `;
        };
        reader.readAsDataURL(file);
    });

    // Report form submit
    document.getElementById('report-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('report-submit-btn');
        setButtonLoading(btn, 'Submitting...');

        try {
            const type = document.getElementById('form-type').value;
            const imageFile = document.getElementById('form-image').files[0] || null;
            const formData = {
                name: document.getElementById('form-name').value.trim(),
                description: document.getElementById('form-description').value.trim(),
                category: document.getElementById('form-category').value,
                date_occurred: document.getElementById('form-date').value,
                location: document.getElementById('form-location').value.trim()
            };

            await reportItem(formData, type, currentUser.id, imageFile);
            showToast(`${capitalize(type)} item reported successfully! 🎉`, 'success');
            closeAllModals();
            await loadItems();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            resetButton(btn);
        }
    });

    // Claim form submit
    document.getElementById('claim-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('claim-submit-btn');
        const itemId = document.getElementById('claim-item-id').value;
        const ownerId = document.getElementById('claim-owner-id').value;
        setButtonLoading(btn, 'Submitting...');

        try {
            await createClaim(itemId, ownerId, currentUser.id);
            showToast('Claim submitted! The finder will review your request. ✅', 'success');
            closeAllModals();
            await loadItems();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            resetButton(btn);
        }
    });
}

// ── Claim Handlers ───────────────────────────────────────────
async function handleApproveClaim(claimId, itemId, ownerId) {
    try {
        await approveClaim(claimId, itemId, ownerId);
        showToast('Match made! Reward points (+10) awarded to the lost item poster and finder! 🏆', 'success');
        closeAllModals();
        await loadItems();
        // Refresh points display
        currentProfile = await getUserProfile(currentUser.id);
        renderUserInfo();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function handleRejectClaim(claimId, itemId) {
    try {
        await rejectClaim(claimId, itemId);
        showToast('Claim rejected.', 'info');
        await openClaimsViewModal(itemId);
        await loadItems();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ── Delete Item ──────────────────────────────────────────────
async function handleDeleteItem(itemId, imageUrl) {
    if (!confirm('Are you sure you want to delete this item? This cannot be undone.')) return;
    try {
        await deleteItem(itemId, imageUrl);
        showToast('Item deleted successfully.', 'success');
        await loadItems();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ── Leaderboard Panel ─────────────────────────────────────────
async function loadLeaderboardPanel() {
    const panel = document.getElementById('leaderboard-panel');
    const container = document.getElementById('lb-container');
    const mainContent = document.getElementById('main-content');

    mainContent.classList.add('hidden');
    panel.classList.remove('hidden');

    container.innerHTML = `< div class="loading-spinner" ><div class="spinner"></div><p>Loading leaderboard...</p></div > `;

    try {
        const data = await fetchLeaderboard(100);
        renderLeaderboard(data, container, currentUser.id);
    } catch (err) {
        container.innerHTML = `< p class="error-text" > Failed to load leaderboard: ${err.message}</p > `;
    }
}

function showMainContent() {
    document.getElementById('leaderboard-panel').classList.add('hidden');
    document.getElementById('main-content').classList.remove('hidden');
}

// ── Logout ─────────────────────────────────────────────────
function setupLogout() {
    document.getElementById('logout-btn').addEventListener('click', async () => {
        try {
            await signOut();
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
}

// ── Expose globally ──────────────────────────────────────────
window.openClaimModal = openClaimModal;
window.openClaimsViewModal = openClaimsViewModal;
window.handleApproveClaim = handleApproveClaim;
window.handleRejectClaim = handleRejectClaim;
window.handleDeleteItem = handleDeleteItem;
window.showMainContent = showMainContent;

// ── Start ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initDashboard);
