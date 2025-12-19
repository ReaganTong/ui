document.addEventListener('DOMContentLoaded', async function () {
    console.log("Reports page loaded.");

    // 1. SETUP BUTTON LISTENERS
    const btnMonthly = document.getElementById('btnDownloadMonthly');
    const btnAll = document.getElementById('btnDownloadAll');

    if (btnMonthly) btnMonthly.addEventListener('click', downloadMonthlyReport);
    if (btnAll) btnAll.addEventListener('click', downloadAllReports);

    // 2. SET DEFAULT MONTH (Current Month)
    const dateInput = document.getElementById('reportMonth');
    if (dateInput) {
        const now = new Date();
        const monthStr = now.toISOString().slice(0, 7); // Format: YYYY-MM
        dateInput.value = monthStr;
    }

    // 3. LOAD TOTAL COUNT (With Error Checking)
    loadTotalCount();
});

async function loadTotalCount() {
    const el = document.getElementById('totalRecordsCount');

    // Check if Supabase is ready
    if (!window.supabaseClient) {
        console.error("Supabase client not found in reports.js");
        if (el) el.textContent = "Error: DB Not Connected";
        return;
    }

    try {
        // Fetch count only
        const { count, error } = await window.supabaseClient
            .from('reports')
            .select('*', { count: 'exact', head: true });

        if (error) throw error;

        if (el) el.textContent = count || 0;

    } catch (e) {
        console.error("Error loading count:", e);
        if (el) el.textContent = "Error";
    }
}

// --- GENERATE MONTHLY ANALYTICS CSV ---
async function downloadMonthlyReport() {
    const monthInput = document.getElementById('reportMonth').value; // "2025-12"
    if (!monthInput) return alert("Please select a month");

    const btn = document.getElementById('btnDownloadMonthly');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    btn.disabled = true;

    try {
        // Fetch ALL reports (Supabase filtering on dates can be tricky with ISO, so we filter in JS for simplicity)
        const { data: reports, error } = await window.supabaseClient
            .from('reports')
            .select('*');

        if (error) throw error;

        // Filter by Month string
        const filtered = reports.filter(r => r.created_at.startsWith(monthInput));

        if (filtered.length === 0) {
            alert("No reports found for this month.");
            return;
        }

        // Calculate Stats
        const total = filtered.length;
        const resolved = filtered.filter(r => (r.status || '').toLowerCase() === 'resolved').length;
        const pending = filtered.filter(r => (r.status || '').toLowerCase() === 'pending').length;

        // Count Categories
        const cats = {};
        filtered.forEach(r => cats[r.category || 'Other'] = (cats[r.category || 'Other'] || 0) + 1);

        // Build CSV
        let csv = `ANALYTICS REPORT FOR ${monthInput}\n`;
        csv += `Generated on,${new Date().toLocaleString()}\n\n`;
        csv += `SUMMARY\n`;
        csv += `Total Incidents,${total}\n`;
        csv += `Resolved,${resolved}\n`;
        csv += `Pending,${pending}\n\n`;
        csv += `BY CATEGORY\n`;
        Object.keys(cats).forEach(c => csv += `${c},${cats[c]}\n`);

        csv += `\nDETAILED LOG\n`;
        csv += `ID,Date,Category,Status,Description\n`;

        filtered.forEach(r => {
            const safeDesc = `"${(r.description || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;
            csv += `${r.id},${r.created_at},${r.category},${r.status},${safeDesc}\n`;
        });

        downloadCSV(csv, `Analytics_${monthInput}.csv`);

    } catch (err) {
        console.error(err);
        alert("Failed to generate report: " + err.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// --- GENERATE ALL REPORTS DUMP ---
async function downloadAllReports() {
    const btn = document.getElementById('btnDownloadAll');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Downloading...';
    btn.disabled = true;

    try {
        const { data: reports, error } = await window.supabaseClient
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!reports || reports.length === 0) {
            alert("No data found in database.");
            return;
        }

        // CSV Headers
        const headers = ['ID', 'Created At', 'Category', 'Status', 'Severity', 'Location', 'Student ID', 'Description', 'Image URL'];
        let csv = headers.join(',') + '\n';

        reports.forEach(r => {
            // Escape special characters for CSV
            const safeDesc = `"${(r.description || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;
            const safeLoc = `"${(r.location || '').replace(/"/g, '""')}"`;

            const row = [
                r.id,
                r.created_at,
                r.category,
                r.status,
                r.severity,
                safeLoc,
                r.student_id,
                safeDesc,
                r.image_url
            ];
            csv += row.join(',') + '\n';
        });

        downloadCSV(csv, `Full_Export_${new Date().toISOString().split('T')[0]}.csv`);

    } catch (err) {
        console.error(err);
        alert("Failed to download: " + err.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Helper to download the string as a file
function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}