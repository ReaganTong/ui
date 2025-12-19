// ==========================================
// 1. INITIALIZE SUPABASE (FIXED)
// ==========================================
const supabaseUrl = 'https://yacthiglkcipbltixron.supabase.co';
const supabaseKey = 'sb_publishable_thHRqeO7TmSOhuWj9TgB4A_cAw4BwXB';

// Check if library is loaded
if (typeof supabase === 'undefined') {
    console.error('CRITICAL: Supabase library not loaded. Check incidents.html script tags.');
} else {
    // FIX: createClient is called on the library 'supabase'
    // We assign it to 'window.supabaseClient' to avoid naming conflicts
    // We disable 'persistSession' to fix the "Tracking Prevention blocked storage" error
    window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: false
        }
    });
    console.log("Supabase Client initialized successfully!");
}

// ==========================================
// 2. EXISTING UI LOGIC
// ==========================================

// Toggle password visibility
const togglePassword = document.getElementById('togglePassword');
if (togglePassword) {
    togglePassword.addEventListener('click', function() {
        const passwordInput = document.getElementById('password');
        const icon = this.querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });
}

// Login form submission
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Simulate login
        console.log('Login attempt:', { email, password });
        
        const submitBtn = this.querySelector('.btn-login');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
        submitBtn.disabled = true;
        
        setTimeout(() => {
            window.location.href = 'index.html';
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }, 1500);
    });
}

// Set current date
const currentDate = document.getElementById('currentDate');
if (currentDate) {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDate.textContent = now.toLocaleDateString('en-US', options);
}

// Sidebar toggle for mobile
const sidebarToggle = document.getElementById('sidebarToggle');
if (sidebarToggle) {
    sidebarToggle.addEventListener('click', function() {
        document.querySelector('.sidebar').classList.toggle('active');
    });
}

// Notification button
const notificationBtn = document.querySelector('.btn-notification');
if (notificationBtn) {
    notificationBtn.addEventListener('click', function() {
        alert('Notifications cleared!');
    });
}

// Update Stats (Connected to Supabase)
async function updateStats() {
    if (!window.supabaseClient) return;

    const { data: reports, error } = await window.supabaseClient.from('reports').select('*');
    if (reports) {
        const stats = document.querySelectorAll('.stat-card h3');
        if (stats.length > 0) {
            stats[0].textContent = reports.length;
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin panel loaded');
    setInterval(updateStats, 30000); // Auto-update
    updateStats(); // Initial update
});

// Logout functionality
const logoutBtn = document.querySelector('.btn-logout');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to logout?')) {
            window.location.href = 'login.html';
        }
    });
}

// ==========================================
// 3. ADMIN FUNCTION: SEND NEWS
// ==========================================
async function sendNewsToApp() {
    const title = document.getElementById('newsTitle')?.value;
    const description = document.getElementById('newsDescription')?.value;

    if (!title || !description) {
        alert('Please enter title and description');
        return;
    }

    if (!window.supabaseClient) {
        alert('Database not connected');
        return;
    }

    const { data, error } = await window.supabaseClient
        .from('news')
        .insert([{ 
            title: title, 
            description: description, 
            created_at: new Date().toISOString() 
        }]);

    if (error) {
        console.error('Error sending news:', error);
        alert('Failed to send news');
    } else {
        alert('News sent to app!');
        document.getElementById('newsTitle').value = '';
        document.getElementById('newsDescription').value = '';
    }
}