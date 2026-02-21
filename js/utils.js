// ============================================================
// UTILITY HELPERS
// ============================================================

/**
 * Show a toast notification
 * @param {string} message
 * @param {'success'|'error'|'info'|'warning'} type
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️'
    };

    toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;

    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => toast.classList.add('toast-show'));

    // Auto-remove after 4 seconds
    setTimeout(() => {
        toast.classList.remove('toast-show');
        toast.classList.add('toast-hide');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

/**
 * Format a date string into a readable format
 * @param {string} dateStr
 * @returns {string}
 */
function formatDate(dateStr) {
    if (!dateStr) return 'Unknown date';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Get time-ago string
 * @param {string} dateStr
 * @returns {string}
 */
function timeAgo(dateStr) {
    const now = new Date();
    const then = new Date(dateStr);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateStr);
}

/**
 * Get emoji icon for item category
 * @param {string} category
 * @returns {string}
 */
function getCategoryIcon(category) {
    const icons = {
        'Electronics': '💻',
        'Bags': '🎒',
        'Clothing': '👕',
        'Books': '📚',
        'Keys': '🔑',
        'Wallet': '👛',
        'Jewelry': '💍',
        'Sports': '⚽',
        'Documents': '📄',
        'Other': '📦'
    };
    return icons[category] || '📦';
}

/**
 * Debounce function
 * @param {Function} fn
 * @param {number} ms
 * @returns {Function}
 */
function debounce(fn, ms) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
}

/**
 * Capitalize first letter
 * @param {string} str
 * @returns {string}
 */
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generate a unique filename for image uploads
 * @param {File} file
 * @param {string} userId
 * @returns {string}
 */
function generateFilename(file, userId) {
    const ext = file.name.split('.').pop();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${userId}/${timestamp}-${random}.${ext}`;
}

/**
 * Show loading state on a button
 * @param {HTMLButtonElement} btn
 * @param {string} loadingText
 */
function setButtonLoading(btn, loadingText = 'Loading...') {
    btn.disabled = true;
    btn.dataset.originalText = btn.textContent;
    btn.innerHTML = `<span class="spinner-sm"></span> ${loadingText}`;
}

/**
 * Reset button from loading state
 * @param {HTMLButtonElement} btn
 */
function resetButton(btn) {
    btn.disabled = false;
    btn.textContent = btn.dataset.originalText || 'Submit';
}

/**
 * Get status badge HTML
 * @param {string} status
 * @returns {string}
 */
function getStatusBadge(status) {
    const classes = {
        'Open': 'badge-open',
        'Pending': 'badge-pending',
        'Returned': 'badge-returned'
    };
    const emojis = {
        'Open': '🔍',
        'Pending': '⏳',
        'Returned': '✅'
    };
    return `<span class="badge ${classes[status] || 'badge-open'}">${emojis[status] || ''} ${status}</span>`;
}

/**
 * Get type badge HTML
 * @param {string} type
 * @returns {string}
 */
function getTypeBadge(type) {
    const isLost = type === 'lost';
    return `<span class="type-badge ${isLost ? 'type-lost' : 'type-found'}">${isLost ? '📍 Lost' : '🎯 Found'}</span>`;
}

// Make utilities globally available
window.showToast = showToast;
window.formatDate = formatDate;
window.timeAgo = timeAgo;
window.getCategoryIcon = getCategoryIcon;
window.debounce = debounce;
window.capitalize = capitalize;
window.generateFilename = generateFilename;
window.setButtonLoading = setButtonLoading;
window.resetButton = resetButton;
window.getStatusBadge = getStatusBadge;
window.getTypeBadge = getTypeBadge;
