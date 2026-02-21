// ============================================================
// AUTH MODULE (localStorage backend)
// ============================================================

const _ldb = window._localDB;

async function signUp(email, password, username) {
    return await _ldb.signUp(email, password, username);
}

async function signIn(email, password) {
    return await _ldb.signIn(email, password);
}

function signOut() {
    _ldb.signOut();
    window.location.href = 'index.html';
}

function getUser() {
    return _ldb.getUserBySession();
}

function getUserProfile(userId) {
    return _ldb.getUserById(userId);
}

function requireAuth() {
    const user = getUser();
    if (!user) { window.location.href = 'index.html'; return null; }
    return user;
}

function redirectIfLoggedIn() {
    const user = getUser();
    if (user) window.location.href = 'dashboard.html';
}

// ── Auth Page Logic ───────────────────────────────────────
if (document.getElementById('auth-page')) {
    redirectIfLoggedIn();

    const loginTab = document.getElementById('tab-login');
    const signupTab = document.getElementById('tab-signup');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginSubmit = document.getElementById('login-submit');
    const signupSubmit = document.getElementById('signup-submit');

    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active'); signupTab.classList.remove('active');
        loginForm.classList.remove('hidden'); signupForm.classList.add('hidden');
    });

    signupTab.addEventListener('click', () => {
        signupTab.classList.add('active'); loginTab.classList.remove('active');
        signupForm.classList.remove('hidden'); loginForm.classList.add('hidden');
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        setButtonLoading(loginSubmit, 'Signing in...');
        try {
            await signIn(email, password);
            showToast('Welcome back! Redirecting...', 'success');
            setTimeout(() => (window.location.href = 'dashboard.html'), 700);
        } catch (err) {
            showToast(err.message, 'error');
            resetButton(loginSubmit);
        }
    });

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('signup-username').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const confirm = document.getElementById('signup-confirm').value;

        if (password !== confirm) { showToast('Passwords do not match!', 'error'); return; }
        if (password.length < 6) { showToast('Password must be at least 6 characters.', 'error'); return; }

        setButtonLoading(signupSubmit, 'Creating account...');
        try {
            await signUp(email, password, username);
            showToast('Account created! Please sign in.', 'success');
            loginTab.click();
            resetButton(signupSubmit);
        } catch (err) {
            showToast(err.message, 'error');
            resetButton(signupSubmit);
        }
    });
}

// Expose globally
window.signOut = signOut;
window.getUser = getUser;
window.getUserProfile = getUserProfile;
window.requireAuth = requireAuth;
