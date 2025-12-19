document.addEventListener('DOMContentLoaded', function () {
    initRealAnalytics();
});

async function initRealAnalytics() {
    try {
        if (!window.supabaseClient) {
            console.error("Supabase not initialized");
            return;
        }

        // 1. Fetch Data
        const { data: reports, error } = await window.supabaseClient
            .from('reports')
            .select('*');

        if (error) throw error;

        // 2. Calculate KPIs
        const total = reports.length;
        const resolved = reports.filter(r => (r.status || '').toLowerCase() === 'resolved').length;
        const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

        // Update KPI HTML
        const kpiValues = document.querySelectorAll('.kpi-value');
        if (kpiValues.length > 3) {
            kpiValues[1].innerHTML = `${resolutionRate}<small>%</small>`; // Resolution Rate
            kpiValues[3].innerHTML = total; // Active Reports
        }

        // 3. Draw Charts & Tables
        drawTrendChart(reports);
        drawCategoryChart(reports);
        drawTables(reports);

    } catch (err) {
        console.error("Analytics Error:", err);
    }
}

function drawTrendChart(reports) {
    const ctx = document.getElementById('incidentTrendChart');
    if (!ctx) return;

    // Group by Date
    const dates = {};
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates[d.toLocaleDateString()] = 0;
    }

    reports.forEach(r => {
        const d = new Date(r.created_at).toLocaleDateString();
        if (dates[d] !== undefined) dates[d]++;
    });

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(dates),
            datasets: [{
                label: 'Incidents',
                data: Object.values(dates),
                borderColor: '#4F46E5',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(79, 70, 229, 0.1)'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function drawCategoryChart(reports) {
    const ctx = document.getElementById('categoryDistributionChart');
    if (!ctx) return;

    const cats = {};
    reports.forEach(r => {
        const c = r.category || 'General';
        cats[c] = (cats[c] || 0) + 1;
    });

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(cats),
            datasets: [{
                data: Object.values(cats),
                backgroundColor: ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function drawTables(reports) {
    // --- TABLE 1: TOP LOCATIONS (The Fix) ---
    const locTable = document.querySelectorAll('.data-table tbody')[0];
    if (locTable) {
        const locationCounts = {};
        reports.forEach(r => {
            // Use 'Unknown' if location is missing, or shorten long GPS coords
            let loc = r.location || 'Unknown';
            if (loc.includes(',') && loc.length > 20) loc = "GPS Coordinates";

            locationCounts[loc] = (locationCounts[loc] || 0) + 1;
        });

        // Sort by count (highest first) and take top 10
        const sortedLocs = Object.entries(locationCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        locTable.innerHTML = sortedLocs.map(([loc, count]) => `
            <tr>
                <td><strong>${loc}</strong></td>
                <td>${count}</td>
            </tr>
        `).join('');
    }

    // --- TABLE 2: MOST ACTIVE USERS ---
    const userTable = document.querySelectorAll('.data-table tbody')[1];
    if (userTable) {
        const userCounts = {};
        reports.forEach(r => {
            const uid = r.student_id || 'Anonymous';
            userCounts[uid] = (userCounts[uid] || 0) + 1;
        });

        const sortedUsers = Object.entries(userCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        userTable.innerHTML = sortedUsers.map(([uid, count]) => `
            <tr>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div style="width:30px; height:30px; background:#e0e7ff; color:#4f46e5; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold;">
                            ${uid.charAt(0)}
                        </div>
                        ${uid}
                    </div>
                </td>
                <td>${count} reports</td>
            </tr>
        `).join('');
    }
}