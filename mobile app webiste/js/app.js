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
        
        // Simulate login - replace with actual API call
        console.log('Login attempt:', { email, password });
        
        // Show loading
        const submitBtn = this.querySelector('.btn-login');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
        submitBtn.disabled = true;
        
        // Simulate API delay
        setTimeout(() => {
            // For demo purposes, redirect to dashboard
            window.location.href = 'index.html';
            
            // In real app, you would:
            // 1. Call your authentication API
            // 2. Store the token
            // 3. Redirect to dashboard
            
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
        const count = this.querySelector('.notification-count');
        if (count) {
            count.textContent = '0';
            setTimeout(() => {
                count.style.opacity = '0';
            }, 300);
        }
        alert('Notifications cleared!');
    });
}

// Quick stats update (simulated)
function updateStats() {
    // Simulate updating stats
    const stats = document.querySelectorAll('.stat-card h3');
    if (stats.length > 0) {
        // In real app, fetch from API and update
        console.log('Updating stats...');
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Any initialization code
    console.log('Admin panel loaded');
    
    // Auto-update stats every 30 seconds
    setInterval(updateStats, 30000);
});

// Logout functionality
const logoutBtn = document.querySelector('.btn-logout');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to logout?')) {
            // Clear any stored credentials
            localStorage.removeItem('admin_token');
            sessionStorage.removeItem('admin_session');
            
            // Redirect to login
            window.location.href = 'login.html';
        }
    });
}