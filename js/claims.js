// ============================================================
// CLAIMS MODULE (localStorage backend)
// ============================================================

const _cdb = window._localDB;

async function createClaim(itemId, ownerId, claimerId) {
    return await _cdb.createClaim(itemId, ownerId, claimerId);
}

async function fetchClaimsForItem(itemId) {
    return await _cdb.getClaimsForItem(itemId);
}

async function approveClaim(claimId, itemId, ownerId) {
    return await _cdb.approveClaim(claimId, itemId, ownerId);
}

async function rejectClaim(claimId, itemId) {
    return await _cdb.rejectClaim(claimId, itemId);
}

// Expose globally
window.createClaim = createClaim;
window.fetchClaimsForItem = fetchClaimsForItem;
window.approveClaim = approveClaim;
window.rejectClaim = rejectClaim;
