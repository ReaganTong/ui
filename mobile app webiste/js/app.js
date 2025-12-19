// ==========================================
// 1. INITIALIZE SUPABASE
// ==========================================
const supabaseUrl = 'https://yacthiglkcipbltixron.supabase.co';
const supabaseKey = 'sb_publishable_thHRqeO7TmSOhuWj9TgB4A_cAw4BwXB';

if (typeof supabase === 'undefined') {
    console.error('CRITICAL: Supabase library not loaded.');
} else {
    // Initialize Client
    window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: true // Changed to TRUE so you stay logged in after refresh
        }
    });
    console.log("Supabase Client initialized.");
}

// ==========================================
// 2. SECURITY GUARD (Auth Check)
// ==========================================
document.addEventListener('DOMContentLoaded', async function () {
    if (!window.supabaseClient) return;

    // Check current page
    const path = window.location.pathname;
    const isLoginPage = path.includes('login.html');

    // Get current session from Supabase
    const { data: { session } } = await window.supabaseClient.auth.getSession();

    // RULE 1: If NOT logged in, and trying to view Dashboard -> Go to Login
    if (!session && !isLoginPage) {
        window.location.href = 'login.html';
    }
    // RULE 2: If IS logged in, and trying to view Login -> Go to Dashboard
    else if (session && isLoginPage) {
        window.location.href = 'index.html';
    }

    // Auto-fill sidebar name if logged in
    if (session && !isLoginPage) {
        const email = session.user.email;
        const nameEl = document.getElementById('sidebarName');
        const userEl = document.getElementById('sidebarAvatar');

        // Use part of email as name if no custom name saved
        const displayName = localStorage.getItem('adminName') || email.split('@')[0];

        if (nameEl) nameEl.textContent = displayName;
        if (userEl) userEl.src = `https://ui-avatars.com/api/?name=${displayName}&background=4F46E5&color=fff`;
    }

    // Initialize UI helpers
    setupUI();

    // Start Data Updates (only if on dashboard)
    if (!isLoginPage) {
        updateStats();
        setInterval(updateStats, 30000);
    }
});

// ==========================================
// 3. AUTH ACTIONS (Login/Logout)
// ==========================================

// Handle Login Form Submission
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const btn = this.querySelector('button[type="submit"]');
        const alertBox = document.getElementById('loginAlert') || createAlertBox(this);

        // Reset UI
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
        btn.disabled = true;
        alertBox.style.display = 'none';

        try {
            // REAL LOGIN REQUEST
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            // Success! Security Guard will handle redirect on next load, but we force it here
            window.location.href = 'index.html';

        } catch (err) {
            console.error("Login failed:", err);
            alertBox.textContent = "Invalid email or password.";
            alertBox.style.display = 'block';
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}

// Handle Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async function () {
        if (confirm('Are you sure you want to logout?')) {
            await window.supabaseClient.auth.signOut();
            window.location.href = 'login.html';
        }
    });
}

// ==========================================
// 4. UI HELPERS (Toggle, Dates, etc.)
// ==========================================
function setupUI() {
    // Toggle Password
    const toggleBtn = document.getElementById('togglePassword');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function () {
            const input = document.getElementById('password');
            const icon = this.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }

    // Sidebar Toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function () {
            document.querySelector('.sidebar').classList.toggle('active');
        });
    }

    // Current Date
    const currentDate = document.getElementById('currentDate');
    if (currentDate) {
        const now = new Date();
        currentDate.textContent = now.toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }
}

// Helper to create alert box if missing
function createAlertBox(form) {
    let box = document.createElement('div');
    box.id = 'loginAlert';
    box.className = 'alert alert-error';
    box.style.color = 'red';
    box.style.marginBottom = '15px';
    box.style.display = 'none';
    form.insertBefore(box, form.firstChild);
    return box;
}

// ==========================================
// 5. DATA FUNCTIONS
// ==========================================
async function updateStats() {
    if (!window.supabaseClient) return;

    // Only run if elements exist
    const stats = document.querySelectorAll('.stat-value');
    if (stats.length === 0) return;

    const { data: reports } = await window.supabaseClient.from('reports').select('status');
    if (reports) {
        const total = reports.length;
        const pending = reports.filter(r => r.status === 'pending').length;
        const investigating = reports.filter(r => r.status === 'investigating').length;
        const resolved = reports.filter(r => r.status === 'resolved').length;

        // Update Dashboard Cards safely
        const safeSet = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        safeSet('statTotal', total);
        safeSet('statPending', pending);
        safeSet('statInvestigating', investigating);
        safeSet('statResolved', resolved);
    }
}

// Send News Function
async function sendNewsToApp() {
    const title = document.getElementById('newsTitle')?.value;
    const description = document.getElementById('newsDescription')?.value;

    if (!title || !description) return alert('Please enter title and description');

    const { error } = await window.supabaseClient
        .from('news')
        .insert([{ title, description }]);

    if (error) {
        alert('Failed to send news');
    } else {
        alert('News sent to app!');
        document.getElementById('newsTitle').value = '';
        document.getElementById('newsDescription').value = '';
    }
}