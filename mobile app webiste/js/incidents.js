// Global variable to store fetched data for filtering/searching without re-fetching
let allIncidentsCache = [];

document.addEventListener('DOMContentLoaded', function () {
    // INITIAL LOAD FROM SUPABASE
    loadIncidentsData();

    // --- YOUR EXISTING UI LOGIC (Sidebar, Modals, etc.) ---
    const filterBtn = document.getElementById('filterBtn');
    const filterPanel = document.getElementById('filterPanel');
    if (filterBtn && filterPanel) {
        filterBtn.addEventListener('click', () => filterPanel.classList.toggle('active'));
    }

    // Search functionality - Now searches the real cache
    const incidentSearch = document.getElementById('incidentSearch');
    if (incidentSearch) {
        incidentSearch.addEventListener('input', debounce(searchIncidents, 300));
    }

    // Refresh table button
    const refreshTable = document.getElementById('refreshTable');
    if (refreshTable) {
        refreshTable.addEventListener('click', loadIncidentsData);
    }
});

// 1. FETCH FROM SUPABASE
// DELETE the old loadIncidentsData function and PASTE this:

async function loadIncidentsData() {
    try {
        showTableLoading();

        // 1. Connect to Real Supabase Database
        // Note: Ensure 'supabase' is initialized in app.js or at the top of this file
        const { data: reports, error } = await supabase
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // 2. Convert Database Data to Website Format
        const incidents = reports.map(report => ({
            id: `INC-${report.id}`,
            title: report.description ? report.description.substring(0, 30) + "..." : "No Title",
            description: report.description,
            category: "General", // The app doesn't send category yet, so we default it
            status: report.status.toLowerCase(),
            severity: "medium",
            location: report.location,
            reporter: report.student_id,
            reported_at: report.created_at,
            evidence: report.image_url ? report.image_url.split(',') : []
        }));

        // 3. Update the UI
        renderIncidentsTable(incidents);
        updateIncidentCounts(incidents);

    } catch (error) {
        console.error('Error loading incidents:', error);
        showNotification('Failed to load real reports.', 'error');
    } finally {
        hideTableLoading();
    }
}

// 2. RENDER TABLE (Modified to match Supabase Column Names)
function renderIncidentsTable(incidents) {
    const tableBody = document.getElementById('incidentsTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    incidents.forEach((incident) => {
        const row = document.createElement('tr');
        // NOTE: We use lowercase names (description, location, status) to match Supabase defaults
        row.innerHTML = `
            <td><input type="checkbox" class="incident-checkbox" data-id="${incident.id}"></td>
            <td class="text-mono">#${incident.id}</td>
            <td>
                <strong>${incident.description ? incident.description.substring(0, 30) : 'No Description'}...</strong>
                <p class="text-small">${incident.location || 'Unknown'}</p>
            </td>
            <td><span class="badge badge-outline">General</span></td>
            <td><span class="status-badge status-${incident.status.toLowerCase()}">${incident.status}</span></td>
            <td><span class="severity-badge severity-medium">Medium</span></td>
            <td>${incident.location}</td>
            <td>${new Date(incident.created_at).toLocaleDateString()}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action" title="Resolve" onclick="resolveIncident(${incident.id})">
                        <i class="fas fa-check" style="color:green"></i>
                    </button>
                    <button class="btn-action" title="Delete" onclick="deleteIncident(${incident.id})">
                        <i class="fas fa-trash" style="color:red"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });

    document.getElementById('showingCount').textContent = incidents.length;
}

// 3. ACTION: RESOLVE (The Synced Feature)
async function resolveIncident(id) {
    const { error } = await _supabase
        .from('reports')
        .update({ status: 'Resolved' })
        .eq('id', id);

    if (error) {
        showNotification("Failed to update", "error");
    } else {
        showNotification("Incident Resolved!", "success");
        loadIncidentsData(); // Refresh table
    }
}

// 4. ACTION: DELETE
async function deleteIncident(id) {
    if (!confirm("Are you sure?")) return;

    const { error } = await _supabase
        .from('reports')
        .delete()
        .eq('id', id);

    if (!error) {
        showNotification("Deleted", "success");
        loadIncidentsData();
    }
}

// 5. SEARCH LOGIC (Using the local cache for speed)
function searchIncidents(event) {
    const searchTerm = event.target.value.toLowerCase().trim();

    if (searchTerm === "") {
        renderIncidentsTable(allIncidentsCache);
        return;
    }

    const filtered = allIncidentsCache.filter(incident =>
        (incident.description || "").toLowerCase().includes(searchTerm) ||
        (incident.location || "").toLowerCase().includes(searchTerm) ||
        incident.id.toString().includes(searchTerm)
    );

    renderIncidentsTable(filtered);
}

// --- UTILITIES (Keep these from your original code) ---

function updateIncidentCounts(incidents) {
    const totalCount = document.getElementById('totalCount');
    if (totalCount) totalCount.textContent = incidents.length;

    const pendingCount = document.getElementById('pendingCount');
    if (pendingCount) {
        const pending = incidents.filter(i => i.status.toLowerCase() === 'pending').length;
        pendingCount.textContent = pending;
    }
}

function showTableLoading() {
    const tableBody = document.getElementById('incidentsTableBody');
    if (tableBody) tableBody.innerHTML = `<tr><td colspan="9" class="text-center"><i class="fas fa-spinner fa-spin"></i> Connecting to Supabase...</td></tr>`;
}

function hideTableLoading() { }

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}