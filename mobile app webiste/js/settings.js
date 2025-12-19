document.addEventListener('DOMContentLoaded', function () {
    loadSettings();
    setupEventListeners();
});

// 1. LOAD SAVED SETTINGS (from LocalStorage)
function loadSettings() {
    // Profile
    const savedName = localStorage.getItem('adminName');
    const savedEmail = localStorage.getItem('adminEmail');

    if (savedName) {
        document.getElementById('inputName').value = savedName;
        updateSidebar(savedName);
    }
    if (savedEmail) {
        document.getElementById('inputEmail').value = savedEmail;
    }

    // Dark Mode
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    const toggle = document.getElementById('darkModeToggle');
    if (toggle) {
        toggle.checked = isDarkMode;
        if (isDarkMode) document.body.classList.add('dark-mode');
    }

    // Notifications
    const emailNotif = localStorage.getItem('emailNotif') === 'true';
    const notifToggle = document.getElementById('emailNotifToggle');
    if (notifToggle) notifToggle.checked = emailNotif;
}

// 2. SAVE PROFILE
function saveProfile() {
    const name = document.getElementById('inputName').value;
    const email = document.getElementById('inputEmail').value;

    if (name) {
        localStorage.setItem('adminName', name);
        updateSidebar(name);
    }
    if (email) {
        localStorage.setItem('adminEmail', email);
    }

    // Update Avatar URL based on new name
    const newAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4F46E5&color=fff`;
    document.getElementById('settingsAvatar').src = newAvatarUrl;
    document.getElementById('sidebarAvatar').src = newAvatarUrl;

    showNotification('Profile updated successfully!', 'success');
}

// 3. TOGGLE DARK MODE
function toggleDarkMode() {
    const isChecked = document.getElementById('darkModeToggle').checked;

    if (isChecked) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'true');
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'false');
    }
}

// 4. UPDATE PASSWORD
// 4. UPDATE PASSWORD (REAL SUPABASE VERSION)
async function updatePassword() {
    const newP = document.getElementById('newPass').value;
    const confirmP = document.getElementById('confirmPass').value;
    const btn = document.getElementById('updatePassBtn');

    if (!newP || !confirmP) {
        return showNotification('Please fill in new password fields.', 'error');
    }

    if (newP !== confirmP) {
        return showNotification('New passwords do not match.', 'error');
    }

    if (newP.length < 6) {
        return showNotification('Password must be at least 6 characters.', 'error');
    }

    // CHANGE PASSWORD IN SUPABASE
    try {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
        btn.disabled = true;

        const { error } = await window.supabaseClient.auth.updateUser({
            password: newP
        });

        if (error) throw error;

        showNotification('Password updated! Please login again.', 'success');

        // Optional: Logout user after password change to force re-login
        setTimeout(async () => {
            await window.supabaseClient.auth.signOut();
            window.location.href = 'login.html';
        }, 2000);

    } catch (err) {
        console.error(err);
        showNotification('Failed to update: ' + err.message, 'error');
        btn.innerHTML = 'Update Password';
        btn.disabled = false;
    }
}
// 5. EVENT LISTENERS
function setupEventListeners() {
    // Save All Button (Header)
    document.getElementById('saveAllBtn').addEventListener('click', () => {
        saveProfile();
        // Also save notification toggle state
        const notifState = document.getElementById('emailNotifToggle').checked;
        localStorage.setItem('emailNotif', notifState);
    });

    // Dark Mode Toggle
    document.getElementById('darkModeToggle').addEventListener('change', toggleDarkMode);

    // Password Update Button
    document.getElementById('updatePassBtn').addEventListener('click', updatePassword);
}

// Helper: Update Sidebar immediately
function updateSidebar(name) {
    const sidebarName = document.getElementById('sidebarName');
    if (sidebarName) sidebarName.textContent = name;
}

// Helper: Notification
function showNotification(msg, type = 'info') {
    const d = document.createElement('div');
    d.className = `notification notification-${type}`;
    d.innerHTML = `<span>${msg}</span>`;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 3000);
}