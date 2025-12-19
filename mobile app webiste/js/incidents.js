// Incidents Management JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Load incidents data
    loadIncidentsData();
    
    // Filter panel toggle
    const filterBtn = document.getElementById('filterBtn');
    const filterPanel = document.getElementById('filterPanel');
    const filterClose = document.querySelector('.filter-close');
    
    if (filterBtn && filterPanel) {
        filterBtn.addEventListener('click', () => {
            filterPanel.classList.toggle('active');
        });
        
        if (filterClose) {
            filterClose.addEventListener('click', () => {
                filterPanel.classList.remove('active');
            });
        }
    }
    
    // New incident button
    const newIncidentBtn = document.getElementById('newIncidentBtn');
    if (newIncidentBtn) {
        newIncidentBtn.addEventListener('click', () => {
            showNewIncidentModal();
        });
    }
    
    // Filter actions
    const applyFiltersBtn = document.getElementById('applyFilters');
    const resetFiltersBtn = document.getElementById('resetFilters');
    
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }
    
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetFilters);
    }
    
    // Search functionality
    const incidentSearch = document.getElementById('incidentSearch');
    if (incidentSearch) {
        incidentSearch.addEventListener('input', debounce(searchIncidents, 300));
    }
    
    // Select all checkbox
    const selectAll = document.getElementById('selectAll');
    if (selectAll) {
        selectAll.addEventListener('change', toggleSelectAll);
    }
    
    // Refresh table
    const refreshTable = document.getElementById('refreshTable');
    if (refreshTable) {
        refreshTable.addEventListener('click', refreshIncidents);
    }
    
    // Export functionality
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportIncidents);
    }
});

// Load incidents data
async function loadIncidentsData() {
    try {
        // Show loading state
        showTableLoading();
        
        // In a real app, fetch from API
        // const response = await fetch('/api/incidents');
        // const incidents = await response.json();
        
        // For demo, use mock data
        const incidents = getMockIncidents();
        
        // Render incidents table
        renderIncidentsTable(incidents);
        
        // Update counts
        updateIncidentCounts(incidents);
        
    } catch (error) {
        console.error('Error loading incidents:', error);
        showNotification('Failed to load incidents. Please try again.', 'error');
    } finally {
        hideTableLoading();
    }
}

// Render incidents table
function renderIncidentsTable(incidents) {
    const tableBody = document.getElementById('incidentsTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    incidents.forEach((incident, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <input type="checkbox" class="incident-checkbox" data-id="${incident.id}">
            </td>
            <td class="text-mono">${incident.id}</td>
            <td>
                <strong>${incident.title}</strong>
                <p class="text-small">${incident.description.substring(0, 50)}...</p>
            </td>
            <td><span class="badge badge-outline">${formatCategory(incident.category)}</span></td>
            <td><span class="status-badge status-${incident.status}">${formatStatus(incident.status)}</span></td>
            <td><span class="severity-badge severity-${incident.severity}">${formatSeverity(incident.severity)}</span></td>
            <td>${incident.location}</td>
            <td>${formatDate(incident.reported_at)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action" title="View" onclick="viewIncident('${incident.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action" title="Edit" onclick="editIncident('${incident.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action" title="Delete" onclick="deleteIncident('${incident.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Update showing count
    const showingCount = document.getElementById('showingCount');
    if (showingCount) {
        showingCount.textContent = incidents.length;
    }
}

// Update incident counts
function updateIncidentCounts(incidents) {
    const totalCount = document.getElementById('totalCount');
    if (totalCount) {
        totalCount.textContent = incidents.length;
    }
    
    // Update pending count in sidebar
    const pendingCount = document.getElementById('pendingCount');
    if (pendingCount) {
        const pending = incidents.filter(i => i.status === 'pending').length;
        pendingCount.textContent = pending;
    }
}

// Apply filters
function applyFilters() {
    const statusFilters = Array.from(document.querySelectorAll('input[name="status"]:checked'))
        .map(cb => cb.value);
    
    const severityFilters = Array.from(document.querySelectorAll('input[name="severity"]:checked'))
        .map(cb => cb.value);
    
    const categoryFilter = document.getElementById('categoryFilter');
    const categories = Array.from(categoryFilter.selectedOptions).map(opt => opt.value);
    
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    console.log('Applying filters:', {
        statusFilters,
        severityFilters,
        categories,
        startDate,
        endDate
    });
    
    // In a real app, send filter criteria to API
    // For demo, filter client-side
    const allIncidents = getMockIncidents();
    const filtered = allIncidents.filter(incident => {
        // Status filter
        if (statusFilters.length > 0 && !statusFilters.includes(incident.status)) {
            return false;
        }
        
        // Severity filter
        if (severityFilters.length > 0 && !severityFilters.includes(incident.severity)) {
            return false;
        }
        
        // Category filter
        if (categories.length > 0 && !categories.includes(incident.category)) {
            return false;
        }
        
        // Date filter
        if (startDate) {
            const incidentDate = new Date(incident.reported_at);
            const filterStart = new Date(startDate);
            if (incidentDate < filterStart) return false;
        }
        
        if (endDate) {
            const incidentDate = new Date(incident.reported_at);
            const filterEnd = new Date(endDate);
            filterEnd.setHours(23, 59, 59, 999);
            if (incidentDate > filterEnd) return false;
        }
        
        return true;
    });
    
    renderIncidentsTable(filtered);
    showNotification(`Filtered to ${filtered.length} incidents`, 'success');
}

// Reset filters
function resetFilters() {
    // Reset all checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = cb.name === 'status' && cb.value === 'pending';
    });
    
    // Reset selects
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.selectedIndex = -1;
    }
    
    // Reset dates
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    
    // Reload all incidents
    loadIncidentsData();
    showNotification('Filters reset', 'info');
}

// Search incidents
function searchIncidents(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    
    if (searchTerm.length < 2) {
        loadIncidentsData();
        return;
    }
    
    const allIncidents = getMockIncidents();
    const filtered = allIncidents.filter(incident => 
        incident.title.toLowerCase().includes(searchTerm) ||
        incident.description.toLowerCase().includes(searchTerm) ||
        incident.location.toLowerCase().includes(searchTerm) ||
        incident.id.toLowerCase().includes(searchTerm)
    );
    
    renderIncidentsTable(filtered);
}

// Toggle select all
function toggleSelectAll(event) {
    const isChecked = event.target.checked;
    document.querySelectorAll('.incident-checkbox').forEach(cb => {
        cb.checked = isChecked;
    });
}

// Refresh incidents
function refreshIncidents() {
    loadIncidentsData();
    showNotification('Incidents refreshed', 'success');
}

// Export incidents
function exportIncidents() {
    const incidents = getMockIncidents();
    
    // Convert to CSV
    const headers = ['ID', 'Title', 'Category', 'Status', 'Severity', 'Location', 'Reported At'];
    const csvRows = [
        headers.join(','),
        ...incidents.map(incident => [
            incident.id,
            `"${incident.title}"`,
            incident.category,
            incident.status,
            incident.severity,
            `"${incident.location}"`,
            incident.reported_at
        ].join(','))
    ];
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `incidents_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Incidents exported to CSV', 'success');
}

// View incident details
function viewIncident(incidentId) {
    const incident = getMockIncidents().find(i => i.id === incidentId);
    if (!incident) return;
    
    // Populate modal
    document.getElementById('detailId').textContent = incident.id;
    document.getElementById('detailTitle').textContent = incident.title;
    document.getElementById('detailCategory').textContent = formatCategory(incident.category);
    document.getElementById('detailReporter').textContent = incident.reporter;
    document.getElementById('detailDate').textContent = formatDate(incident.reported_at, true);
    document.getElementById('detailLocation').textContent = incident.location;
    document.getElementById('detailDescription').textContent = incident.description;
    
    // Update status badges
    const statusBadge = document.querySelector('#incidentDetailModal .detail-status .status-badge');
    const severityBadge = document.querySelector('#incidentDetailModal .detail-status .severity-badge');
    
    if (statusBadge) {
        statusBadge.className = `status-badge status-${incident.status}`;
        statusBadge.textContent = formatStatus(incident.status);
    }
    
    if (severityBadge) {
        severityBadge.className = `severity-badge severity-${incident.severity}`;
        severityBadge.textContent = formatSeverity(incident.severity);
    }
    
    // Populate evidence gallery
    const gallery = document.getElementById('evidenceGallery');
    gallery.innerHTML = incident.evidence.map(img => `
        <div class="evidence-item">
            <img src="https://via.placeholder.com/150x100/4F46E5/ffffff?text=${img}" alt="Evidence">
            <button class="evidence-view" onclick="viewEvidence('${img}')">
                <i class="fas fa-expand"></i>
            </button>
        </div>
    `).join('');
    
    // Populate activity log
    const activityLog = document.getElementById('activityLog');
    activityLog.innerHTML = `
        <div class="activity-item">
            <div class="activity-icon"><i class="fas fa-plus"></i></div>
            <div class="activity-content">
                <p>Incident reported</p>
                <small>${formatDate(incident.reported_at, true)} by ${incident.reporter}</small>
            </div>
        </div>
        <div class="activity-item">
            <div class="activity-icon"><i class="fas fa-user-tag"></i></div>
            <div class="activity-content">
                <p>Assigned to Security Team</p>
                <small>${formatDate(new Date(Date.now() - 3600000).toISOString(), true)} by Admin</small>
            </div>
        </div>
    `;
    
    // Show modal
    showModal('incidentDetailModal');
    
    // Set up action buttons
    document.getElementById('assignToMeBtn').onclick = () => assignToMe(incidentId);
    document.getElementById('updateStatusBtn').onclick = () => showUpdateStatusModal(incidentId);
    document.getElementById('deleteIncidentBtn').onclick = () => confirmDeleteIncident(incidentId);
}

// Show new incident modal
function showNewIncidentModal() {
    showModal('quickReportModal');
    
    // Set up form submission
    const form = document.getElementById('quickReportForm');
    const submitBtn = document.getElementById('submitReportBtn');
    
    if (submitBtn) {
        submitBtn.onclick = () => submitNewIncident(form);
    }
}

// Submit new incident
function submitNewIncident(form) {
    const formData = new FormData(form);
    const incidentData = {
        title: document.getElementById('incidentTitle').value,
        category: document.getElementById('incidentCategory').value,
        severity: document.getElementById('incidentSeverity').value,
        description: document.getElementById('incidentDescription').value,
        location: document.getElementById('incidentLocation').value
    };
    
    // Validation
    if (!incidentData.title.trim()) {
        showNotification('Please enter a title', 'error');
        return;
    }
    
    // In a real app, send to API
    console.log('Submitting new incident:', incidentData);
    
    // Simulate API call
    setTimeout(() => {
        showNotification('Incident reported successfully!', 'success');
        closeModal('quickReportModal');
        refreshIncidents();
        
        // Reset form
        form.reset();
    }, 1000);
}

// Show update status modal
function showUpdateStatusModal(incidentId) {
    closeModal('incidentDetailModal');
    showModal('updateStatusModal');
    
    // Set up save button
    document.getElementById('saveStatusBtn').onclick = () => updateIncidentStatus(incidentId);
}

// Update incident status
function updateIncidentStatus(incidentId) {
    const newStatus = document.getElementById('newStatus').value;
    const notes = document.getElementById('statusNotes').value;
    const assignTo = document.getElementById('assignTo').value;
    
    // In a real app, send to API
    console.log('Updating incident status:', {
        incidentId,
        newStatus,
        notes,
        assignTo
    });
    
    // Simulate API call
    setTimeout(() => {
        showNotification('Incident status updated successfully!', 'success');
        closeModal('updateStatusModal');
        refreshIncidents();
    }, 1000);
}

// Assign incident to me
function assignToMe(incidentId) {
    // In a real app, send to API
    console.log('Assigning incident to current user:', incidentId);
    
    setTimeout(() => {
        showNotification('Incident assigned to you', 'success');
        closeModal('incidentDetailModal');
        refreshIncidents();
    }, 1000);
}

// Confirm delete incident
function confirmDeleteIncident(incidentId) {
    if (confirm('Are you sure you want to delete this incident? This action cannot be undone.')) {
        deleteIncident(incidentId);
    }
}

// Delete incident
function deleteIncident(incidentId) {
    // In a real app, send to API
    console.log('Deleting incident:', incidentId);
    
    setTimeout(() => {
        showNotification('Incident deleted successfully', 'success');
        closeModal('incidentDetailModal');
        refreshIncidents();
    }, 1000);
}

// Utility functions
function getMockIncidents() {
    return [
        {
            id: 'INC-0012',
            title: 'Broken glass near Library',
            description: 'Large pieces of broken glass found near the main library entrance. Appears to be from a broken window. Area needs to be cordoned off for safety.',
            category: 'hazard',
            status: 'pending',
            severity: 'high',
            location: 'Main Library Entrance',
            reporter: 'John Doe (S12345)',
            reported_at: '2025-12-18T10:30:00',
            evidence: ['glass1.jpg', 'glass2.jpg']
        },
        {
            id: 'INC-0011',
            title: 'Suspicious person near Dorm A',
            description: 'Reported seeing a suspicious individual loitering near Dormitory A for over an hour. Security should investigate.',
            category: 'security',
            status: 'investigating',
            severity: 'medium',
            location: 'Dormitory A Parking Lot',
            reporter: 'Jane Smith (S67890)',
            reported_at: '2025-12-18T09:15:00',
            evidence: ['person1.jpg']
        },
        {
            id: 'INC-0010',
            title: 'Water leak in Science Building',
            description: 'Water leaking from ceiling in room 305. Creating puddle on floor - slip hazard.',
            category: 'maintenance',
            status: 'resolved',
            severity: 'low',
            location: 'Science Building, Room 305',
            reporter: 'Robert Johnson (F12345)',
            reported_at: '2025-12-17T14:20:00',
            evidence: ['leak1.jpg', 'leak2.jpg']
        },
        {
            id: 'INC-0009',
            title: 'Stolen laptop from Computer Lab',
            description: 'Laptop reported stolen from computer lab B. Last seen yesterday afternoon.',
            category: 'theft',
            status: 'investigating',
            severity: 'high',
            location: 'Computer Lab B',
            reporter: 'Sarah Williams (S11223)',
            reported_at: '2025-12-17T11:45:00',
            evidence: []
        },
        {
            id: 'INC-0008',
            title: 'Fire alarm malfunction',
            description: 'Fire alarm going off randomly in Engineering building. False alarm - needs maintenance.',
            category: 'maintenance',
            status: 'closed',
            severity: 'medium',
            location: 'Engineering Building, 3rd Floor',
            reporter: 'Michael Brown (S33445)',
            reported_at: '2025-12-16T16:30:00',
            evidence: ['alarm1.jpg']
        }
    ];
}

function formatCategory(category) {
    const categories = {
        'hazard': 'Hazard',
        'security': 'Security',
        'maintenance': 'Maintenance',
        'theft': 'Theft',
        'assault': 'Assault',
        'fire': 'Fire Safety',
        'medical': 'Medical',
        'other': 'Other'
    };
    return categories[category] || category;
}

function formatStatus(status) {
    const statuses = {
        'pending': 'Pending',
        'investigating': 'Investigating',
        'resolved': 'Resolved',
        'closed': 'Closed'
    };
    return statuses[status] || status;
}

function formatSeverity(severity) {
    const severities = {
        'low': 'Low',
        'medium': 'Medium',
        'high': 'High'
    };
    return severities[severity] || severity;
}

function formatDate(dateString, includeTime = false) {
    const date = new Date(dateString);
    if (includeTime) {
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function showTableLoading() {
    const tableBody = document.getElementById('incidentsTableBody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center">
                    <div class="loading-spinner-small">
                        <i class="fas fa-spinner fa-spin"></i>
                        <span>Loading incidents...</span>
                    </div>
                </td>
            </tr>
        `;
    }
}

function hideTableLoading() {
    // Loading state removed when table is rendered
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

function showNotification(message, type = 'info') {
    // Same notification function as in analytics.js
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button class="notification-close">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
    
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}