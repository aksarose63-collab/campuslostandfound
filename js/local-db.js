// ============================================================
// LOCAL DATABASE – localStorage backend (no Supabase needed)
// ============================================================

class LocalDB {
    constructor() {
        this._init();
    }

    _init() {
        if (!localStorage.getItem('laf_users')) localStorage.setItem('laf_users', JSON.stringify([]));
        if (!localStorage.getItem('laf_items')) localStorage.setItem('laf_items', JSON.stringify([]));
        if (!localStorage.getItem('laf_claims')) localStorage.setItem('laf_claims', JSON.stringify([]));
    }

    // ── Internal Helpers ──────────────────────────────────────
    _users() { try { return JSON.parse(localStorage.getItem('laf_users') || '[]'); } catch { return []; } }
    _items() { try { return JSON.parse(localStorage.getItem('laf_items') || '[]'); } catch { return []; } }
    _claims() { try { return JSON.parse(localStorage.getItem('laf_claims') || '[]'); } catch { return []; } }

    _saveUsers(d) { localStorage.setItem('laf_users', JSON.stringify(d)); }
    _saveItems(d) { localStorage.setItem('laf_items', JSON.stringify(d)); }
    _saveClaims(d) { localStorage.setItem('laf_claims', JSON.stringify(d)); }

    _id() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    }

    // ── Auth ──────────────────────────────────────────────────
    async signUp(email, password, username) {
        const users = this._users();
        if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            throw new Error('An account with this email already exists.');
        }
        if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
            throw new Error('Username is already taken. Please choose another.');
        }
        const user = {
            id: this._id(), email, password, username,
            points: 0, created_at: new Date().toISOString()
        };
        users.push(user);
        this._saveUsers(users);
        return user;
    }

    async signIn(email, password) {
        const user = this._users().find(
            u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );
        if (!user) throw new Error('Invalid email or password. Please try again.');
        localStorage.setItem('laf_session', JSON.stringify({ id: user.id, email: user.email }));
        return user;
    }

    signOut() {
        localStorage.removeItem('laf_session');
    }

    getSession() {
        try { return JSON.parse(localStorage.getItem('laf_session')); } catch { return null; }
    }

    getUserById(id) {
        return this._users().find(u => u.id === id) || null;
    }

    getUserBySession() {
        const session = this.getSession();
        if (!session) return null;
        return this.getUserById(session.id);
    }

    addPoints(userId, pts) {
        const users = this._users();
        const idx = users.findIndex(u => u.id === userId);
        if (idx > -1) {
            users[idx].points = (users[idx].points || 0) + pts;
            this._saveUsers(users);
        }
    }

    // ── Image Compression (canvas) ───────────────────────────
    compressImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX = 800;
                    let w = img.width, h = img.height;
                    if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
                    if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
                    canvas.width = w; canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL('image/jpeg', 0.75));
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // ── Items ─────────────────────────────────────────────────
    async createItem(data, imageFile) {
        let image_url = null;
        if (imageFile) {
            image_url = await this.compressImage(imageFile);
        }
        const item = {
            id: this._id(),
            ...data,
            image_url,
            status: 'Open',
            created_at: new Date().toISOString()
        };
        const items = this._items();
        items.unshift(item);
        this._saveItems(items);
        return item;
    }

    async getItems(filters = {}) {
        const users = this._users();
        let items = this._items().map(item => ({
            ...item,
            profiles: users.find(u => u.id === item.user_id) || null
        }));

        if (filters.type && filters.type !== 'all') items = items.filter(i => i.type === filters.type);
        if (filters.status && filters.status !== 'all') items = items.filter(i => i.status === filters.status);
        if (filters.category && filters.category !== 'all') items = items.filter(i => i.category === filters.category);
        if (filters.search) {
            const q = filters.search.toLowerCase();
            items = items.filter(i =>
                (i.name || '').toLowerCase().includes(q) ||
                (i.description || '').toLowerCase().includes(q) ||
                (i.location || '').toLowerCase().includes(q)
            );
        }
        return items;
    }

    async getMyItems(userId) {
        const users = this._users();
        return this._items()
            .filter(i => i.user_id === userId)
            .map(item => ({ ...item, profiles: users.find(u => u.id === item.user_id) || null }));
    }

    async getItemById(itemId) {
        const users = this._users();
        const item = this._items().find(i => i.id === itemId);
        if (!item) return null;
        return { ...item, profiles: users.find(u => u.id === item.user_id) || null };
    }

    async updateItemStatus(itemId, status) {
        const items = this._items();
        const idx = items.findIndex(i => i.id === itemId);
        if (idx > -1) { items[idx].status = status; this._saveItems(items); }
    }

    async deleteItem(itemId) {
        this._saveItems(this._items().filter(i => i.id !== itemId));
        this._saveClaims(this._claims().filter(c => c.item_id !== itemId));
    }

    // ── Claims ────────────────────────────────────────────────
    async createClaim(itemId, ownerId, claimerId) {
        const claims = this._claims();
        if (claims.find(c => c.item_id === itemId && c.claimer_id === claimerId)) {
            throw new Error('You have already submitted a claim for this item.');
        }
        const claim = {
            id: this._id(), item_id: itemId, owner_id: ownerId, claimer_id: claimerId,
            status: 'Pending', created_at: new Date().toISOString()
        };
        claims.push(claim);
        this._saveClaims(claims);
        await this.updateItemStatus(itemId, 'Pending');
        return claim;
    }

    async getClaimsForItem(itemId) {
        const users = this._users();
        return this._claims()
            .filter(c => c.item_id === itemId)
            .map(c => ({ ...c, claimer: users.find(u => u.id === c.claimer_id) || null }))
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    async approveClaim(claimId, itemId, ownerId) {
        const claims = this._claims();
        const claim = claims.find(c => c.id === claimId);
        claims.forEach(c => {
            if (c.id === claimId) c.status = 'Approved';
            else if (c.item_id === itemId) c.status = 'Rejected';
        });
        this._saveClaims(claims);
        await this.updateItemStatus(itemId, 'Returned');

        // Award points to both the finder and the poster of the lost item
        this.addPoints(ownerId, 10);
        if (claim && claim.claimer_id) {
            this.addPoints(claim.claimer_id, 10);
        }
    }

    async rejectClaim(claimId, itemId) {
        const claims = this._claims();
        const idx = claims.findIndex(c => c.id === claimId);
        if (idx > -1) { claims[idx].status = 'Rejected'; this._saveClaims(claims); }
        const pending = this._claims().filter(c => c.item_id === itemId && c.status === 'Pending');
        if (pending.length === 0) await this.updateItemStatus(itemId, 'Open');
    }

    // ── Leaderboard ───────────────────────────────────────────
    async getLeaderboard(limit = 50) {
        return this._users()
            .sort((a, b) => (b.points || 0) - (a.points || 0))
            .slice(0, limit);
    }
}

window._localDB = new LocalDB();
