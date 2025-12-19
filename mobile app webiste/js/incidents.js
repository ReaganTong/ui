// js/incidents.js

// Global cache
let allIncidentsCache = [];
let currentViewingId = null;

document.addEventListener('DOMContentLoaded', function () {
    loadIncidentsData();
    setupEventListeners();
});

// ==========================================
// 1. DATA LOADING
// ==========================================
async function loadIncidentsData() {
    try {
        showTableLoading();
        if (!window.supabaseClient) throw new Error("Supabase not initialized");

        const { data: reports, error } = await window.supabaseClient
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Process Data
        allIncidentsCache = reports.map(report => ({
            id: report.id,
            displayId: `INC-${report.id}`,
            title: report.description ? report.description.substring(0, 40) + "..." : "No Title",
            description: report.description || "",
            category: report.category || "General",
            status: (report.status || "pending").toLowerCase(),
            severity: (report.severity || "medium").toLowerCase(),
            location: report.location || "Unknown",
            reporter: report.student_id || "Anonymous",
            created_at: report.created_at,
            evidence: report.image_url ? report.image_url.split(',').filter(x => x) : []
        }));

        // IMPORTANT: Render ALL data initially (Don't filter yet)
        renderIncidentsTable(allIncidentsCache);
        updateDashboardStats(allIncidentsCache);

    } catch (error) {
        console.error('Error:', error);
        showNotification('Failed to load reports', 'error');
    } finally {
        hideTableLoading();
    }
}

// ==========================================
// 2. RENDER TABLE
// ==========================================
function renderIncidentsTable(incidents) {
    const tableBody = document.getElementById('incidentsTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (incidents.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" class="text-center" style="padding:40px;">No incidents match your filters.</td></tr>';
        document.getElementById('showingCount').textContent = 0;
        return;
    }

    incidents.forEach((incident) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="incident-checkbox" data-id="${incident.id}"></td>
            <td class="text-mono">${incident.displayId}</td>
            <td><div style="font-weight:500;">${incident.title}</div></td>
            <td><span class="badge badge-outline">${incident.category}</span></td>
            <td><span class="status-badge status-${incident.status}">${incident.status.toUpperCase()}</span></td>
            <td><span class="severity-badge severity-${incident.severity}">${incident.severity}</span></td>
            <td>${incident.location}</td>
            <td>${new Date(incident.created_at).toLocaleDateString()}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action" title="View Details" onclick="viewIncident(${incident.id})"><i class="fas fa-eye"></i></button>
                    <button class="btn-action" title="Mark Resolved" onclick="quickResolve(${incident.id})" style="color:green;"><i class="fas fa-check-circle"></i></button>
                    <button class="btn-action" title="Delete" onclick="deleteIncident(${incident.id})" style="color:#EF4444;"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });

    document.getElementById('showingCount').textContent = incidents.length;
    document.getElementById('totalCount').textContent = allIncidentsCache.length;
}

// ==========================================
// 3. ACTIONS (View, Save, Delete)
// ==========================================

// VIEW: Open Modal & Populate
function viewIncident(id) {
    const incident = allIncidentsCache.find(i => i.id === id);
    if (!incident) return;

    currentViewingId = id;

    // Populate Fields
    document.getElementById('detailTitle').textContent = incident.description;
    document.getElementById('detailId').textContent = incident.displayId;
    document.getElementById('detailCategory').textContent = incident.category;
    document.getElementById('detailReporter').textContent = incident.reporter;
    document.getElementById('detailDate').textContent = new Date(incident.created_at).toLocaleString();
    document.getElementById('detailDescription').textContent = incident.description;

    // Badge
    const badge = document.getElementById('detailStatusBadge');
    if (badge) badge.innerHTML = `<span class="status-badge status-${incident.status}">${incident.status.toUpperCase()}</span>`;

    // Populate Dropdowns
    const statusSelect = document.getElementById('modalStatusSelect');
    if (statusSelect) statusSelect.value = incident.status;

    const severitySelect = document.getElementById('modalSeveritySelect');
    if (severitySelect) severitySelect.value = incident.severity;

    // Evidence
    const gallery = document.getElementById('evidenceGallery');
    gallery.innerHTML = '';
    if (incident.evidence.length > 0) {
        incident.evidence.forEach(url => {
            gallery.innerHTML += `<a href="${url}" target="_blank"><img src="${url}" style="height:100px; border-radius:6px; margin-right:10px;"></a>`;
        });
    } else {
        gallery.innerHTML = '<span class="text-muted">No images attached.</span>';
    }

    // Show Modal
    const modal = document.getElementById('incidentDetailModal');
    if (modal) modal.classList.add('active');
}

// SAVE: Update Status AND Severity
async function saveChanges() {
    if (!currentViewingId) return;

    const newStatus = document.getElementById('modalStatusSelect').value;
    const newSeverity = document.getElementById('modalSeveritySelect').value;
    const btn = document.getElementById('saveChangesBtn');

    try {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        btn.disabled = true;

        const { error } = await window.supabaseClient
            .from('reports')
            .update({
                status: newStatus,
                severity: newSeverity
            })
            .eq('id', currentViewingId);

        if (error) throw error;

        showNotification('Changes saved successfully!', 'success');
        document.getElementById('incidentDetailModal').classList.remove('active');
        loadIncidentsData();

    } catch (err) {
        console.error(err);
        showNotification('Failed to save changes', 'error');
    } finally {
        btn.innerHTML = '<i class="fas fa-save"></i> Save';
        btn.disabled = false;
    }
}

// QUICK RESOLVE
async function quickResolve(id) {
    if (!confirm("Mark this incident as RESOLVED?")) return;
    try {
        const { error } = await window.supabaseClient.from('reports').update({ status: 'resolved' }).eq('id', id);
        if (error) throw error;
        showNotification('Incident Resolved!', 'success');
        loadIncidentsData();
    } catch (err) { showNotification('Error updating status', 'error'); }
}

// DELETE
async function deleteIncident(id) {
    if (!id && currentViewingId) id = currentViewingId;
    if (!confirm("Are you sure you want to delete this report?")) return;

    try {
        const { error } = await window.supabaseClient.from('reports').delete().eq('id', id);
        if (error) throw error;
        showNotification('Report deleted', 'success');
        document.getElementById('incidentDetailModal').classList.remove('active');
        loadIncidentsData();
    } catch (err) { showNotification('Failed to delete report', 'error'); }
}

// ==========================================
// 4. FILTERS (SMARTER LOGIC)
// ==========================================
function applyFilters() {
    console.log("Applying filters...");

    const selectedStatuses = Array.from(document.querySelectorAll('input[name="status"]:checked')).map(cb => cb.value.toLowerCase());
    const selectedSeverities = Array.from(document.querySelectorAll('input[name="severity"]:checked')).map(cb => cb.value.toLowerCase());
    const categorySelect = document.getElementById('categoryFilter');
    let selectedCategories = [];
    if (categorySelect && categorySelect.selectedOptions.length > 0) {
        selectedCategories = Array.from(categorySelect.selectedOptions).map(opt => opt.value.toLowerCase());
    }

    const startInput = document.getElementById('startDate');
    const endInput = document.getElementById('endDate');
    const startDate = startInput && startInput.value ? new Date(startInput.value) : null;
    const endDate = endInput && endInput.value ? new Date(endInput.value) : null;
    if (endDate) endDate.setHours(23, 59, 59);

    const filtered = allIncidentsCache.filter(item => {
        // If nothing selected, show ALL (don't filter)
        if (selectedStatuses.length > 0 && !selectedStatuses.includes(item.status)) return false;
        if (selectedSeverities.length > 0 && !selectedSeverities.includes(item.severity)) return false;
        if (selectedCategories.length > 0 && !selectedCategories.includes(item.category.toLowerCase())) return false;

        const incDate = new Date(item.created_at);
        if (startDate && incDate < startDate) return false;
        if (endDate && incDate > endDate) return false;
        return true;
    });

    renderIncidentsTable(filtered);

    const panel = document.getElementById('filterPanel');
    if (panel) panel.classList.remove('active');
    showNotification(`Found ${filtered.length} reports.`, 'success');
}

// ==========================================
// 5. EXPORT (FIXED)
// ==========================================
function exportData() {
    if (allIncidentsCache.length === 0) return alert("No data to export!");

    const headers = ["ID", "Date", "Category", "Status", "Severity", "Location", "Description", "Reporter"];
    const csvRows = [headers.join(",")];

    allIncidentsCache.forEach(row => {
        const safeDesc = `"${(row.description || '').replace(/"/g, '""')}"`;
        const safeLoc = `"${(row.location || '').replace(/"/g, '""')}"`;
        const values = [
            row.id,
            new Date(row.created_at).toLocaleDateString(),
            row.category,
            row.status,
            row.severity,
            safeLoc,
            safeDesc,
            row.reporter
        ];
        csvRows.push(values.join(","));
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incidents_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// ==========================================
// 6. EVENT LISTENERS
// ==========================================
function setupEventListeners() {
    // Buttons
    const btnSave = document.getElementById('saveChangesBtn');
    if (btnSave) btnSave.addEventListener('click', saveChanges);

    const btnModalDelete = document.getElementById('modalDeleteBtn');
    if (btnModalDelete) btnModalDelete.addEventListener('click', () => deleteIncident(null));

    const btnApply = document.getElementById('applyFilters');
    if (btnApply) btnApply.addEventListener('click', applyFilters);

    const btnExport = document.getElementById('exportBtn');
    if (btnExport) btnExport.addEventListener('click', exportData);

    const btnReset = document.getElementById('resetFilters');
    if (btnReset) btnReset.addEventListener('click', () => {
        document.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = true);
        applyFilters();
    });

    // Close Modals & Panels
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function () { this.closest('.modal').classList.remove('active'); });
    });

    const modal = document.getElementById('incidentDetailModal');
    if (modal) modal.addEventListener('click', function (e) { if (e.target === modal) modal.classList.remove('active'); });

    // Filter Panel Toggle
    const btnFilter = document.getElementById('filterBtn');
    const panel = document.getElementById('filterPanel');
    const btnFilterClose = document.querySelector('.filter-close');

    if (btnFilter && panel) {
        btnFilter.addEventListener('click', (e) => { e.stopPropagation(); panel.classList.toggle('active'); });
    }
    if (btnFilterClose && panel) {
        btnFilterClose.addEventListener('click', () => panel.classList.remove('active'));
    }

    // Search
    const searchInput = document.getElementById('incidentSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const results = allIncidentsCache.filter(i =>
                i.title.toLowerCase().includes(term) ||
                i.displayId.toLowerCase().includes(term)
            );
            renderIncidentsTable(results);
        });
    }
}

// Utils
function updateDashboardStats(incidents) {
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('statTotal', incidents.length);
    set('statPending', incidents.filter(i => i.status === 'pending').length);
    set('statInvestigating', incidents.filter(i => i.status === 'investigating').length);
    set('statResolved', incidents.filter(i => i.status === 'resolved').length);
}

function showTableLoading() {
    const tb = document.getElementById('incidentsTableBody');
    if (tb) tb.innerHTML = '<tr><td colspan="9" class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';
}
function hideTableLoading() { }

function showNotification(msg, type = 'info') {
    const d = document.createElement('div');
    d.className = `notification notification-${type}`;
    d.innerHTML = `<span>${msg}</span>`;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 3000);
}