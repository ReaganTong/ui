// js/auth.js

document.addEventListener('DOMContentLoaded', function () {
    // 1. Handle Login Submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // 2. Handle Password Toggle (Eye Icon)
    const toggleBtn = document.getElementById('togglePassword');
    const passInput = document.getElementById('password');

    if (toggleBtn && passInput) {
        toggleBtn.addEventListener('click', function () {
            // Toggle type
            const type = passInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passInput.setAttribute('type', type);

            // Toggle Icon class
            const icon = this.querySelector('i');
            if (type === 'text') {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }
});

async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btn = document.getElementById('loginBtn');
    const alertBox = document.getElementById('loginAlert');

    // Reset UI
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
    btn.disabled = true;
    alertBox.style.display = 'none';

    try {
        if (!window.supabaseClient) {
            throw new Error("Database connection error. Check app.js");
        }

        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        // Success - Redirect
        window.location.href = 'index.html';

    } catch (err) {
        console.error(err);
        // Show friendly error
        alertBox.textContent = err.message === "Invalid login credentials"
            ? "Incorrect email or password."
            : err.message;

        alertBox.style.display = 'block';

        // Reset Button
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}