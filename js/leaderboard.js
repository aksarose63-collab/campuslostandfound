// ============================================================
// LEADERBOARD MODULE (localStorage backend)
// ============================================================

const _lbdb = window._localDB;

async function fetchLeaderboard(limit = 50) {
  return await _lbdb.getLeaderboard(limit);
}

function renderLeaderboard(data, container, currentUserId) {
  if (!data || data.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🏆</div>
        <p>No users on the leaderboard yet.</p>
        <p class="empty-sub">Start returning items to earn points!</p>
      </div>`;
    return;
  }

  const medals = ['🥇', '🥈', '🥉'];

  container.innerHTML = data.map((user, index) => {
    const rank = index + 1;
    const medal = medals[index] || `#${rank}`;
    const isCurrentUser = user.id === currentUserId;
    const initials = user.username.substring(0, 2).toUpperCase();
    const avatarColor = getAvatarColor(user.username);

    return `
      <div class="lb-row ${isCurrentUser ? 'lb-row-current' : ''} ${rank <= 3 ? 'lb-row-top' : ''}">
        <div class="lb-rank">${medal}</div>
        <div class="lb-avatar" style="background: ${avatarColor}">${initials}</div>
        <div class="lb-info">
          <span class="lb-username">${escapeHtml(user.username)} ${isCurrentUser ? '<span class="you-badge">You</span>' : ''}</span>
          <span class="lb-joined">Member since ${formatDate(user.created_at)}</span>
        </div>
        <div class="lb-points">
          <span class="lb-score">${user.points || 0}</span>
          <span class="lb-pts-label">pts</span>
        </div>
      </div>
    `;
  }).join('');
}

function getAvatarColor(username) {
  const colors = [
    'linear-gradient(135deg, #667eea, #764ba2)',
    'linear-gradient(135deg, #f093fb, #f5576c)',
    'linear-gradient(135deg, #4facfe, #00f2fe)',
    'linear-gradient(135deg, #43e97b, #38f9d7)',
    'linear-gradient(135deg, #fa709a, #fee140)',
    'linear-gradient(135deg, #a18cd1, #fbc2eb)',
    'linear-gradient(135deg, #fccb90, #d57eeb)',
    'linear-gradient(135deg, #a1c4fd, #c2e9fb)',
  ];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

window.fetchLeaderboard = fetchLeaderboard;
window.renderLeaderboard = renderLeaderboard;
window.getAvatarColor = getAvatarColor;
window.escapeHtml = escapeHtml;
