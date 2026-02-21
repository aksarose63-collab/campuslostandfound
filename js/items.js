// ============================================================
// ITEMS MODULE (localStorage backend)
// ============================================================

const _idb = window._localDB;

async function reportItem(formData, type, userId, imageFile) {
    return await _idb.createItem({ user_id: userId, type, ...formData }, imageFile);
}

async function fetchItems(filters = {}) {
    return await _idb.getItems(filters);
}

async function fetchMyItems(userId) {
    return await _idb.getMyItems(userId);
}

async function updateItemStatus(itemId, status) {
    return await _idb.updateItemStatus(itemId, status);
}

async function deleteItem(itemId, _imageUrl) {
    return await _idb.deleteItem(itemId);
}

async function fetchItemById(itemId) {
    return await _idb.getItemById(itemId);
}

// Expose globally
window.reportItem = reportItem;
window.fetchItems = fetchItems;
window.fetchMyItems = fetchMyItems;
window.updateItemStatus = updateItemStatus;
window.deleteItem = deleteItem;
window.fetchItemById = fetchItemById;
