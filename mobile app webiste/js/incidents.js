// Global cache for search/filtering
let allIncidentsCache = [];

document.addEventListener('DOMContentLoaded', function () {
    loadIncidentsData();

    // Setup Modals and Filters
    setupEventListeners();
});

// 1. FETCH REAL DATA
async function loadIncidentsData() {
    try {
        showTableLoading();

        // Use window.supabaseClient (defined in app.js)
        const { data: reports, error } = await window.supabaseClient
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Map DB data to UI format
        allIncidentsCache = reports.map(report => ({
            id: report.id, // Keep as number for logic, format string for display
            displayId: `INC-${report.id}`,
            title: report.description ? report.description.substring(0, 30) + "..." : "No Title",
            description: report.description || "No Description",
            category: report.category || "General",
            status: report.status ? report.status.toLowerCase() : "pending",
            severity: report.severity ? report.severity.toLowerCase() : "medium",
            location: report.location || "Unknown",
            reporter: report.student_id || "Anonymous",
            reported_at: report.created_at,
            evidence: report.image_url ? report.image_url.split(',').filter(x => x) : []
        }));

        renderIncidentsTable(allIncidentsCache);
        updateDashboardStats(allIncidentsCache);

    } catch (error) {
        console.error('Error:', error);
        showNotification('Failed to load reports.', 'error');
    } finally {
        hideTableLoading();
    }
}

// 2. RENDER TABLE
function renderIncidentsTable(incidents) {
    const tableBody = document.getElementById('incidentsTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (incidents.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" class="text-center">No incidents found.</td></tr>';
        return;
    }

    incidents.forEach((incident) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="incident-checkbox" data-id="${incident.id}"></td>
            <td class="text-mono">${incident.displayId}</td>
            <td>
                <strong>${incident.title}</strong>
                <p class="text-small">${incident.location}</p>
            </td>
            <td><span class="badge badge-outline">${incident.category}</span></td>
            <td><span class="status-badge status-${incident.status}">${incident.status}</span></td>
            <td><span class="severity-badge severity-${incident.severity}">${incident.severity}</span></td>
            <td>${incident.location}</td>
            <td>${new Date(incident.reported_at).toLocaleDateString()}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action" title="View Details" onclick="viewIncident(${incident.id})">
                        <i class="fas fa-eye"></i>
                    </button>
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

    // Update "Showing X of Y"
    const showingCount = document.getElementById('showingCount');
    if (showingCount) showingCount.textContent = incidents.length;
}

// 3. UPDATE STATS (The Real Numbers)
// 3. UPDATE STATS (The Real Numbers)
function updateDashboardStats(incidents) {
    // Helper to safely set text
    const setStat = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    // Calculate Counts
    const pendingCount = incidents.filter(i => i.status === 'pending').length;
    const investigatingCount = incidents.filter(i => i.status === 'investigating').length;
    const resolvedCount = incidents.filter(i => i.status === 'resolved').length;

    // Update Table Footer
    setStat('totalCount', incidents.length);

    // Update Dashboard Cards
    setStat('statTotal', incidents.length);
    setStat('statPending', pendingCount);
    setStat('statInvestigating', investigatingCount);
    setStat('statResolved', resolvedCount);

    // === NEW: Update Sidebar Badge ===
    const sidebarBadge = document.getElementById('sidebarBadge');
    if (sidebarBadge) {
        sidebarBadge.textContent = pendingCount;

        // Optional: Hide badge if count is 0, show if > 0
        sidebarBadge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
    }
}
// 4. VIEW INCIDENT (Populate Real Data into Modal)
function viewIncident(id) {
    const incident = allIncidentsCache.find(i => i.id === id);
    if (!incident) return;

    // Populate Text Fields
    document.getElementById('detailTitle').textContent = incident.description.substring(0, 50);
    document.getElementById('detailId').textContent = incident.displayId;
    document.getElementById('detailCategory').textContent = incident.category;
    document.getElementById('detailReporter').textContent = incident.reporter;
    document.getElementById('detailDate').textContent = new Date(incident.reported_at).toLocaleString();
    document.getElementById('detailLocation').textContent = incident.location;
    document.getElementById('detailDescription').textContent = incident.description;

    // Populate Badges
    const statusContainer = document.querySelector('.detail-status');
    if (statusContainer) {
        statusContainer.innerHTML = `
            <span class="status-badge status-${incident.status}">${incident.status}</span>
            <span class="severity-badge severity-${incident.severity}">${incident.severity}</span>
        `;
    }

    // Populate Evidence Images
    const gallery = document.getElementById('evidenceGallery');
    gallery.innerHTML = '';
    if (incident.evidence.length > 0) {
        incident.evidence.forEach(url => {
            gallery.innerHTML += `
                <div class="evidence-item">
                    <a href="${url}" target="_blank">
                        <img src="${url}" alt="Evidence" style="height:100px; object-fit:cover; border-radius:4px;">
                    </a>
                </div>`;
        });
    } else {
        gallery.innerHTML = '<p class="text-small text-muted">No evidence attached.</p>';
    }

    // Populate Activity (Simple Mock log based on creation)
    const log = document.getElementById('activityLog');
    log.innerHTML = `
        <div class="activity-item">
            <div class="activity-icon"><i class="fas fa-plus"></i></div>
            <div class="activity-content">
                <p>Report Submitted</p>
                <small>${new Date(incident.reported_at).toLocaleString()}</small>
            </div>
        </div>`;

    // Show Modal
    document.getElementById('incidentDetailModal').classList.add('active');
}

// 5. ACTIONS
async function resolveIncident(id) {
    if (!confirm("Mark this incident as Resolved?")) return;

    const { error } = await window.supabaseClient
        .from('reports')
        .update({ status: 'Resolved' })
        .eq('id', id);

    if (error) showNotification("Failed to update: " + error.message, "error");
    else {
        showNotification("Incident Resolved!", "success");
        loadIncidentsData();
    }
}

async function deleteIncident(id) {
    if (!confirm("Are you sure? This cannot be undone.")) return;

    const { error } = await window.supabaseClient
        .from('reports')
        .delete()
        .eq('id', id);

    if (error) showNotification("Failed to delete", "error");
    else {
        showNotification("Deleted successfully", "success");
        loadIncidentsData();
    }
}

// 6. SEARCH & UI HELPERS
function searchIncidents(event) {
    const term = event.target.value.toLowerCase().trim();
    if (!term) {
        renderIncidentsTable(allIncidentsCache);
        return;
    }
    const filtered = allIncidentsCache.filter(i =>
        i.description.toLowerCase().includes(term) ||
        i.location.toLowerCase().includes(term) ||
        i.displayId.toLowerCase().includes(term)
    );
    renderIncidentsTable(filtered);
}

function setupEventListeners() {
    // Search
    const search = document.getElementById('incidentSearch');
    if (search) search.addEventListener('input', searchIncidents);

    // Refresh
    const refresh = document.getElementById('refreshTable');
    if (refresh) refresh.addEventListener('click', loadIncidentsData);

    // Filter Panel
    const filterBtn = document.getElementById('filterBtn');
    const panel = document.getElementById('filterPanel');
    const closeFilter = document.querySelector('.filter-close');
    if (filterBtn && panel) filterBtn.onclick = () => panel.classList.toggle('active');
    if (closeFilter) closeFilter.onclick = () => panel.classList.remove('active');

    // Modal Close
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function () {
            this.closest('.modal').classList.remove('active');
        });
    });
}

function showTableLoading() {
    const body = document.getElementById('incidentsTableBody');
    if (body) body.innerHTML = '<tr><td colspan="9" class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';
}
function hideTableLoading() { }

function showNotification(msg, type = 'info') {
    const div = document.createElement('div');
    div.className = `notification notification-${type}`;
    div.innerHTML = `<span>${msg}</span>`;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}