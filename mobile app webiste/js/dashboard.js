// js/dashboard.js
document.addEventListener('DOMContentLoaded', function () {
    loadDashboardData();
});

async function loadDashboardData() {
    try {
        console.log("Loading Dashboard Data...");

        // 1. Check Connection
        if (!window.supabaseClient) {
            console.error("Supabase not initialized! Check app.js");
            return;
        }

        // 2. Fetch Real Data
        const { data: reports, error } = await window.supabaseClient
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // 3. Calculate Stats
        const total = reports.length;
        const pending = reports.filter(r => (r.status || '').toLowerCase() === 'pending').length;
        const investigating = reports.filter(r => (r.status || '').toLowerCase() === 'investigating').length;
        const resolved = reports.filter(r => (r.status || '').toLowerCase() === 'resolved').length;

        // Count Unique Users
        const uniqueUsers = new Set(reports.map(r => r.student_id)).size;

        // 4. Update Sidebar Numbers (Fixes the "0" issue)
        const pendingBadge = document.getElementById('pendingCount');
        const userBadge = document.getElementById('userCount');
        if (pendingBadge) pendingBadge.textContent = pending;
        if (userBadge) userBadge.textContent = uniqueUsers;

        // 5. Update Dashboard Cards
        renderStatsCards(total, pending, investigating, resolved);

        // 6. Update "Recent Incidents" Table
        renderRecentTable(reports.slice(0, 5)); // Show only top 5

        // 7. Update Charts
        if (typeof Chart !== 'undefined') {
            initCategoryChart(reports);
            initTrendChart(reports);
        }

    } catch (err) {
        console.error("Dashboard Error:", err);
    }
}

function renderStatsCards(total, pending, investigating, resolved) {
    const grid = document.getElementById('statsGrid');
    if (!grid) return;

    grid.innerHTML = `
        <div class="stat-card">
            <div class="stat-info">
                <h3>${total}</h3>
                <p>Total Incidents</p>
            </div>
            <div class="stat-icon" style="background: #E0E7FF; color: #4F46E5;"><i class="fas fa-folder-open"></i></div>
        </div>
        <div class="stat-card">
            <div class="stat-info">
                <h3>${pending}</h3>
                <p>Pending Review</p>
            </div>
            <div class="stat-icon" style="background: #FEE2E2; color: #EF4444;"><i class="fas fa-exclamation-circle"></i></div>
        </div>
        <div class="stat-card">
            <div class="stat-info">
                <h3>${investigating}</h3>
                <p>Investigating</p>
            </div>
            <div class="stat-icon" style="background: #FEF3C7; color: #F59E0B;"><i class="fas fa-search"></i></div>
        </div>
        <div class="stat-card">
            <div class="stat-info">
                <h3>${resolved}</h3>
                <p>Resolved</p>
            </div>
            <div class="stat-icon" style="background: #D1FAE5; color: #10B981;"><i class="fas fa-check-circle"></i></div>
        </div>
    `;
}

function renderRecentTable(reports) {
    const table = document.getElementById('recentIncidentsTable');
    if (!table) return;

    let html = `<thead><tr><th>ID</th><th>Title</th><th>Status</th><th>Date</th></tr></thead><tbody>`;

    if (reports.length === 0) {
        html += `<tr><td colspan="4" class="text-center">No reports found.</td></tr>`;
    } else {
        reports.forEach(r => {
            const statusClass = `status-${(r.status || 'pending').toLowerCase()}`;
            html += `
                <tr>
                    <td>#${r.id}</td>
                    <td>${r.description ? r.description.substring(0, 20) + '...' : 'No Title'}</td>
                    <td><span class="status-badge ${statusClass}">${r.status}</span></td>
                    <td>${new Date(r.created_at).toLocaleDateString()}</td>
                </tr>`;
        });
    }
    html += `</tbody>`;
    table.innerHTML = html;
}

function initCategoryChart(reports) {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    const cats = {};
    reports.forEach(r => { cats[r.category || 'General'] = (cats[r.category || 'General'] || 0) + 1; });
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(cats),
            datasets: [{ data: Object.values(cats), backgroundColor: ['#4F46E5', '#EF4444', '#F59E0B', '#10B981'] }]
        }
    });
}

function initTrendChart(reports) {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;
    const days = {};
    for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days[d.toLocaleDateString()] = 0; }
    reports.forEach(r => { const d = new Date(r.created_at).toLocaleDateString(); if (days[d] !== undefined) days[d]++; });
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(days),
            datasets: [{ label: 'Incidents', data: Object.values(days), borderColor: '#4F46E5', tension: 0.4 }]
        }
    });
}