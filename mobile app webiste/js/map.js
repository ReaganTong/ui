// Map JavaScript - Interactive campus map
let map;
let incidentMarkers = [];
let resourceMarkers = [];
let currentIncidents = [];

document.addEventListener('DOMContentLoaded', function() {
    // Initialize map
    initMap();
    
    // Load incidents data
    loadMapIncidents();
    
    // Load resources
    loadResources();
    
    // Map filter functionality
    const applyMapFiltersBtn = document.getElementById('applyMapFilters');
    if (applyMapFiltersBtn) {
        applyMapFiltersBtn.addEventListener('click', applyMapFilters);
    }
    
    // Time range selector
    const timeRangeSelect = document.getElementById('timeRange');
    if (timeRangeSelect) {
        timeRangeSelect.addEventListener('change', updateMapForTimeRange);
    }
    
    // Refresh map button
    const refreshMapBtn = document.getElementById('refreshMap');
    if (refreshMapBtn) {
        refreshMapBtn.addEventListener('click', refreshMapData);
    }
    
    // Sidebar toggle
    const sidebarToggle = document.querySelector('.map-sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleMapSidebar);
    }
    
    // View on map buttons
    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn-view-on-map')) {
            const button = e.target.closest('.btn-view-on-map');
            const incidentId = button.dataset.id;
            focusOnIncident(incidentId);
        }
        
        if (e.target.closest('.view-details')) {
            const button = e.target.closest('.view-details');
            const incidentId = button.dataset.id;
            viewIncidentDetails(incidentId);
        }
        
        if (e.target.closest('.navigate-to')) {
            const button = e.target.closest('.navigate-to');
            const lat = parseFloat(button.dataset.lat);
            const lng = parseFloat(button.dataset.lng);
            showNavigation(lat, lng);
        }
    });
});

// Initialize Leaflet map
function initMap() {
    // Center on campus (example coordinates)
    const campusCenter = [40.7128, -74.0060];
    
    // Create map
    map = L.map('map').setView(campusCenter, 16);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
    
    // Add scale control
    L.control.scale().addTo(map);
    
    // Add campus boundary (example polygon)
    const campusBounds = [
        [40.7120, -74.0075],
        [40.7120, -74.0045],
        [40.7136, -74.0045],
        [40.7136, -74.0075]
    ];
    
    L.polygon(campusBounds, {
        color: '#4F46E5',
        weight: 2,
        opacity: 0.5,
        fillOpacity: 0.1
    }).addTo(map);
    
    // Add buildings as polygons
    addBuildings();
    
    // Fit map to campus bounds
    map.fitBounds(campusBounds);
}

// Add campus buildings
function addBuildings() {
    const buildings = [
        {
            name: 'Main Library',
            coords: [
                [40.7125, -74.0060],
                [40.7125, -74.0055],
                [40.7128, -74.0055],
                [40.7128, -74.0060]
            ],
            color: '#3B82F6'
        },
        {
            name: 'Science Building',
            coords: [
                [40.7129, -74.0065],
                [40.7129, -74.0060],
                [40.7132, -74.0060],
                [40.7132, -74.0065]
            ],
            color: '#10B981'
        },
        {
            name: 'Dormitory A',
            coords: [
                [40.7122, -74.0070],
                [40.7122, -74.0065],
                [40.7125, -74.0065],
                [40.7125, -74.0070]
            ],
            color: '#8B5CF6'
        },
        {
            name: 'Administration Building',
            coords: [
                [40.7130, -74.0050],
                [40.7130, -74.0045],
                [40.7133, -74.0045],
                [40.7133, -74.0050]
            ],
            color: '#F59E0B'
        }
    ];
    
    buildings.forEach(building => {
        const polygon = L.polygon(building.coords, {
            color: building.color,
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.3
        }).addTo(map);
        
        // Add popup
        polygon.bindPopup(`
            <div class="building-popup">
                <h5>${building.name}</h5>
                <p><i class="fas fa-building"></i> Campus Building</p>
                <button class="btn btn-sm btn-primary" onclick="showBuildingIncidents('${building.name}')">
                    View Incidents
                </button>
            </div>
        `);
    });
}

// Load incidents for map
function loadMapIncidents() {
    // In a real app, fetch from API
    // For demo, use mock data
    const incidents = [
        {
            id: 'INC-0012',
            title: 'Broken glass near Library',
            description: 'Large pieces of broken glass found near the main library entrance.',
            category: 'hazard',
            status: 'pending',
            severity: 'high',
            location: 'Main Library Entrance',
            lat: 40.7126,
            lng: -74.0060,
            reported_at: '2025-12-18T10:30:00'
        },
        {
            id: 'INC-0011',
            title: 'Suspicious person near Dorm A',
            description: 'Suspicious individual loitering near Dormitory A.',
            category: 'security',
            status: 'investigating',
            severity: 'medium',
            location: 'Dormitory A Parking Lot',
            lat: 40.7123,
            lng: -74.0068,
            reported_at: '2025-12-18T09:15:00'
        },
        {
            id: 'INC-0010',
            title: 'Water leak in Science Building',
            description: 'Water leaking from ceiling in room 305.',
            category: 'maintenance',
            status: 'resolved',
            severity: 'low',
            location: 'Science Building, Room 305',
            lat: 40.7130,
            lng: -74.0062,
            reported_at: '2025-12-17T14:20:00'
        },
        {
            id: 'INC-0009',
            title: 'Stolen laptop from Computer Lab',
            description: 'Laptop reported stolen from computer lab B.',
            category: 'theft',
            status: 'investigating',
            severity: 'high',
            location: 'Computer Lab B',
            lat: 40.7127,
            lng: -74.0058,
            reported_at: '2025-12-17T11:45:00'
        }
    ];
    
    currentIncidents = incidents;
    addIncidentMarkers(incidents);
    updateIncidentList(incidents);
}

// Add incident markers to map
function addIncidentMarkers(incidents) {
    // Clear existing markers
    incidentMarkers.forEach(marker => map.removeLayer(marker));
    incidentMarkers = [];
    
    incidents.forEach(incident => {
        // Determine marker color based on severity
        let markerColor;
        let iconClass;
        
        switch (incident.severity) {
            case 'high':
                markerColor = '#EF4444';
                iconClass = 'fas fa-exclamation-circle';
                break;
            case 'medium':
                markerColor = '#F59E0B';
                iconClass = 'fas fa-exclamation-triangle';
                break;
            case 'low':
                markerColor = '#10B981';
                iconClass = 'fas fa-info-circle';
                break;
            default:
                markerColor = '#6B7280';
                iconClass = 'fas fa-map-marker-alt';
        }
        
        // Create custom icon
        const icon = L.divIcon({
            html: `
                <div class="map-marker" style="background-color: ${markerColor};">
                    <i class="${iconClass}"></i>
                </div>
            `,
            className: 'custom-marker',
            iconSize: [30, 30],
            iconAnchor: [15, 30],
            popupAnchor: [0, -30]
        });
        
        // Create marker
        const marker = L.marker([incident.lat, incident.lng], { icon })
            .addTo(map);
        
        // Create popup content
        const popupContent = createPopupContent(incident);
        
        // Bind popup
        marker.bindPopup(popupContent, {
            maxWidth: 300,
            minWidth: 250
        });
        
        // Store marker reference
        incidentMarkers.push(marker);
        
        // Add click event to focus on incident in sidebar
        marker.on('click', function() {
            highlightIncidentInList(incident.id);
        });
    });
}

// Create popup content for incidents
function createPopupContent(incident) {
    const template = document.getElementById('popupTemplate');
    if (!template) return '<div>No template found</div>';
    
    const statusClass = `status-${incident.status}`;
    const severityClass = `severity-${incident.severity}`;
    
    let html = template.innerHTML
        .replace(/{title}/g, incident.title)
        .replace(/{location}/g, incident.location)
        .replace(/{time}/g, new Date(incident.reported_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
        .replace(/{status}/g, incident.status.charAt(0).toUpperCase() + incident.status.slice(1))
        .replace(/{statusClass}/g, statusClass)
        .replace(/{severity}/g, incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1))
        .replace(/{severityClass}/g, severityClass)
        .replace(/{description}/g, incident.description)
        .replace(/{id}/g, incident.id)
        .replace(/{lat}/g, incident.lat)
        .replace(/{lng}/g, incident.lng);
    
    return html;
}

// Load resources (emergency phones, first aid, etc.)
function loadResources() {
    const resources = [
        {
            type: 'emergency',
            name: 'Emergency Phone #1',
            lat: 40.7124,
            lng: -74.0062,
            icon: 'fas fa-phone'
        },
        {
            type: 'firstaid',
            name: 'First Aid Station - Library',
            lat: 40.7126,
            lng: -74.0057,
            icon: 'fas fa-first-aid'
        },
        {
            type: 'security',
            name: 'Security Office',
            lat: 40.7130,
            lng: -74.0050,
            icon: 'fas fa-shield-alt'
        },
        {
            type: 'emergency',
            name: 'Emergency Phone #2',
            lat: 40.7128,
            lng: -74.0068,
            icon: 'fas fa-phone'
        },
        {
            type: 'firstaid',
            name: 'First Aid Station - Dorms',
            lat: 40.7122,
            lng: -74.0067,
            icon: 'fas fa-first-aid'
        }
    ];
    
    addResourceMarkers(resources);
}

// Add resource markers
function addResourceMarkers(resources) {
    resources.forEach(resource => {
        let markerColor;
        
        switch (resource.type) {
            case 'emergency':
                markerColor = '#EF4444';
                break;
            case 'firstaid':
                markerColor = '#10B981';
                break;
            case 'security':
                markerColor = '#3B82F6';
                break;
            default:
                markerColor = '#6B7280';
        }
        
        const icon = L.divIcon({
            html: `
                <div class="resource-marker" style="background-color: ${markerColor};">
                    <i class="${resource.icon}"></i>
                </div>
            `,
            className: 'custom-resource-marker',
            iconSize: [24, 24],
            iconAnchor: [12, 24],
            popupAnchor: [0, -24]
        });
        
        const marker = L.marker([resource.lat, resource.lng], { icon })
            .addTo(map);
        
        marker.bindPopup(`
            <div class="resource-popup">
                <h5>${resource.name}</h5>
                <p><i class="${resource.icon}"></i> ${resource.type.charAt(0).toUpperCase() + resource.type.slice(1)} Resource</p>
                <button class="btn btn-sm btn-primary" onclick="getDirections(${resource.lat}, ${resource.lng})">
                    <i class="fas fa-directions"></i> Get Directions
                </button>
            </div>
        `);
        
        resourceMarkers.push(marker);
    });
}

// Update incident list in sidebar
function updateIncidentList(incidents) {
    const incidentList = document.querySelector('.incident-list');
    if (!incidentList) return;
    
    incidentList.innerHTML = incidents.map(incident => `
        <div class="map-incident-item" data-id="${incident.id}">
            <div class="incident-marker ${incident.severity}"></div>
            <div class="incident-content">
                <h6>${incident.title}</h6>
                <p>${incident.location} • ${new Date(incident.reported_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                <span class="status-badge status-${incident.status}">${incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}</span>
            </div>
            <button class="btn-view-on-map" data-id="${incident.id}">
                <i class="fas fa-map-marker-alt"></i>
            </button>
        </div>
    `).join('');
}

// Highlight incident in list
function highlightIncidentInList(incidentId) {
    // Remove highlight from all items
    document.querySelectorAll('.map-incident-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add highlight to selected item
    const selectedItem = document.querySelector(`.map-incident-item[data-id="${incidentId}"]`);
    if (selectedItem) {
        selectedItem.classList.add('active');
        
        // Scroll into view
        selectedItem.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
        });
    }
}

// Focus on incident (center map on it)
function focusOnIncident(incidentId) {
    const incident = currentIncidents.find(i => i.id === incidentId);
    if (!incident) return;
    
    // Center map on incident
    map.setView([incident.lat, incident.lng], 18);
    
    // Open popup
    incidentMarkers.forEach(marker => {
        const latLng = marker.getLatLng();
        if (latLng.lat === incident.lat && latLng.lng === incident.lng) {
            marker.openPopup();
        }
    });
    
    // Highlight in list
    highlightIncidentInList(incidentId);
}

// View incident details
function viewIncidentDetails(incidentId) {
    // Navigate to incident details page or open modal
    window.location.href = `incidents.html?view=${incidentId}`;
}

// Show navigation
function showNavigation(lat, lng) {
    // In a real app, this would open Google Maps or similar
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
}

// Get directions to resource
function getDirections(lat, lng) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
}

// Apply map filters
function applyMapFilters() {
    const statusFilters = Array.from(document.querySelectorAll('input[name="mapStatus"]:checked'))
        .map(cb => cb.value);
    
    const typeFilters = Array.from(document.querySelectorAll('input[name="mapType"]:checked'))
        .map(cb => cb.value);
    
    const resourceFilters = Array.from(document.querySelectorAll('input[name="resources"]:checked'))
        .map(cb => cb.value);
    
    console.log('Applying map filters:', {
        statusFilters,
        typeFilters,
        resourceFilters
    });
    
    // Filter incidents
    const filteredIncidents = currentIncidents.filter(incident => {
        if (statusFilters.length > 0 && !statusFilters.includes(incident.status)) {
            return false;
        }
        
        // Map category to type for filtering
        const typeMap = {
            'hazard': 'hazard',
            'security': 'security',
            'maintenance': 'maintenance',
            'theft': 'security',
            'fire': 'hazard',
            'medical': 'hazard',
            'other': 'hazard'
        };
        
        const incidentType = typeMap[incident.category] || 'hazard';
        if (typeFilters.length > 0 && !typeFilters.includes(incidentType)) {
            return false;
        }
        
        return true;
    });
    
    // Update incident markers
    addIncidentMarkers(filteredIncidents);
    updateIncidentList(filteredIncidents);
    
    // Show/hide resource markers
    resourceMarkers.forEach((marker, index) => {
        const resourceType = getResourceType(index); // You'd need to store resource types
        if (resourceFilters.length > 0 && !resourceFilters.includes(resourceType)) {
            map.removeLayer(marker);
        } else {
            marker.addTo(map);
        }
    });
    
    showNotification(`Map filtered: ${filteredIncidents.length} incidents shown`, 'success');
}

// Update map for time range
function updateMapForTimeRange() {
    const timeRange = document.getElementById('timeRange').value;
    
    // In a real app, fetch incidents for the selected time range
    console.log('Updating map for time range:', timeRange);
    
    // For demo, just show a message
    showNotification(`Showing incidents for: ${timeRange}`, 'info');
}

// Refresh map data
function refreshMapData() {
    // Clear and reload data
    loadMapIncidents();
    showNotification('Map data refreshed', 'success');
}

// Toggle map sidebar
function toggleMapSidebar() {
    const sidebar = document.querySelector('.map-sidebar');
    const toggleBtn = document.querySelector('.map-sidebar-toggle i');
    
    if (sidebar.classList.contains('collapsed')) {
        sidebar.classList.remove('collapsed');
        toggleBtn.classList.remove('fa-chevron-right');
        toggleBtn.classList.add('fa-chevron-left');
    } else {
        sidebar.classList.add('collapsed');
        toggleBtn.classList.remove('fa-chevron-left');
        toggleBtn.classList.add('fa-chevron-right');
    }
}

// Show building incidents
function showBuildingIncidents(buildingName) {
    // Filter incidents for this building
    const buildingIncidents = currentIncidents.filter(incident => 
        incident.location.toLowerCase().includes(buildingName.toLowerCase())
    );
    
    if (buildingIncidents.length === 0) {
        showNotification(`No incidents found for ${buildingName}`, 'info');
        return;
    }
    
    // Create modal showing building incidents
    const modalHtml = `
        <div class="modal active" id="buildingIncidentsModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${buildingName} - Recent Incidents</h3>
                    <button class="modal-close" onclick="closeModal('buildingIncidentsModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="incident-list-modal">
                        ${buildingIncidents.map(incident => `
                            <div class="incident-item-modal">
                                <div class="incident-header">
                                    <h5>${incident.title}</h5>
                                    <span class="severity-badge severity-${incident.severity}">${incident.severity}</span>
                                </div>
                                <p class="incident-description">${incident.description}</p>
                                <div class="incident-footer">
                                    <span class="incident-time">${new Date(incident.reported_at).toLocaleDateString()}</span>
                                    <span class="status-badge status-${incident.status}">${incident.status}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal('buildingIncidentsModal')">Close</button>
                    <button class="btn btn-primary" onclick="focusOnBuilding('${buildingName}')">
                        <i class="fas fa-map-marker-alt"></i> View on Map
                    </button>
                </div>
            </div>
        </div>
    `;
    
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);
}

// Focus on building
function focusOnBuilding(buildingName) {
    // Center map on building
    const buildingCoords = {
        'Main Library': [40.71265, -74.00575],
        'Science Building': [40.71305, -74.00625],
        'Dormitory A': [40.71235, -74.00675],
        'Administration Building': [40.71315, -74.00475]
    };
    
    const coords = buildingCoords[buildingName];
    if (coords) {
        map.setView(coords, 18);
    }
    
    closeModal('buildingIncidentsModal');
}

// Close modal (reused from analytics)
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}

// Show notification (reused from analytics)
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
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