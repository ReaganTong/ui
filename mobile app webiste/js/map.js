// js/map.js

let map;
let markersLayer; // Group to hold all markers
let allReportsCache = [];

document.addEventListener('DOMContentLoaded', function () {
    initMap();
    loadMapData();
    setupMapEventListeners();
});

// 1. INITIALIZE MAP
function initMap() {
    // Default Center (Update to your campus location)
    // Example: Sarikei, Malaysia
    const defaultCenter = [1.1206, 111.4528];

    map = L.map('map').setView(defaultCenter, 15);

    // Add Tile Layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Layer Group for Markers (Easy to clear later)
    markersLayer = L.layerGroup().addTo(map);
}

// 2. LOAD DATA
async function loadMapData() {
    try {
        const listContainer = document.getElementById('mapSidebarList');
        if (listContainer) listContainer.innerHTML = '<div style="text-align:center; padding:20px;"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

        if (!window.supabaseClient) throw new Error("Supabase not connected");

        // Fetch
        const { data: reports, error } = await window.supabaseClient
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Process & Cache
        allReportsCache = reports
            .filter(r => r.location && r.location.includes(',')) // Must have valid location
            .map(r => {
                const parts = r.location.split(',');
                return {
                    id: r.id,
                    title: r.description ? r.description.substring(0, 30) + "..." : "Incident",
                    fullDesc: r.description,
                    category: r.category || 'general',
                    status: (r.status || 'pending').toLowerCase(),
                    severity: (r.severity || 'medium').toLowerCase(),
                    lat: parseFloat(parts[0]),
                    lng: parseFloat(parts[1]),
                    date: new Date(r.created_at).toLocaleString()
                };
            });

        applyMapFilters(); // Render map

    } catch (err) {
        console.error(err);
        const list = document.getElementById('mapSidebarList');
        if (list) list.innerHTML = '<div style="text-align:center; color:red; padding:20px;">Failed to load data.</div>';
    }
}

// 3. APPLY FILTERS & RENDER
function applyMapFilters() {
    // Get Checked Statuses
    const statusChecks = document.querySelectorAll('input[name="mapStatus"]:checked');
    const selectedStatuses = Array.from(statusChecks).map(cb => cb.value);

    // Filter Data
    const visibleReports = allReportsCache.filter(r => selectedStatuses.includes(r.status));

    // Clear Old Markers
    markersLayer.clearLayers();

    // Render New Markers & List
    const listContainer = document.getElementById('mapSidebarList');
    if (listContainer) listContainer.innerHTML = '';

    if (visibleReports.length === 0) {
        if (listContainer) listContainer.innerHTML = '<div style="text-align:center; padding:20px;">No incidents match filters.</div>';
        return;
    }

    visibleReports.forEach(report => {
        addMarker(report);
        addSidebarItem(report);
    });
}

// 4. ADD MARKER TO MAP
function addMarker(report) {
    // Color based on status/severity
    let color = '#3B82F6'; // Blue
    if (report.severity === 'high') color = '#EF4444'; // Red
    else if (report.status === 'resolved') color = '#10B981'; // Green
    else if (report.status === 'pending') color = '#F59E0B'; // Orange

    // Custom Icon (HTML/CSS)
    const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color:${color}" class="marker-pin"></div>`,
        iconSize: [30, 42],
        iconAnchor: [15, 42]
    });

    const marker = L.marker([report.lat, report.lng], { icon: icon });

    // Popup
    marker.bindPopup(`
        <div style="min-width:200px;">
            <h4 style="margin:0 0 5px 0;">${report.title}</h4>
            <div style="margin-bottom:5px;">
                <span class="badge" style="background:${color}20; color:${color}; padding:2px 8px; border-radius:10px; font-size:11px;">
                    ${report.status.toUpperCase()}
                </span>
            </div>
            <p style="margin:0; font-size:13px; color:#555;">${report.fullDesc}</p>
            <div style="margin-top:8px; font-size:11px; color:#888;">${report.date}</div>
        </div>
    `);

    markersLayer.addLayer(marker);
}

// 5. ADD ITEM TO SIDEBAR
function addSidebarItem(report) {
    const list = document.getElementById('mapSidebarList');
    if (!list) return;

    let color = 'gray';
    if (report.status === 'pending') color = 'orange';
    if (report.status === 'resolved') color = 'green';
    if (report.status === 'investigating') color = 'blue';

    const div = document.createElement('div');
    div.className = 'map-incident-item';
    div.style.cssText = 'padding:15px; border-bottom:1px solid #eee; display:flex; gap:10px;';
    div.onclick = () => {
        // Zoom to marker
        map.setView([report.lat, report.lng], 17);
    };

    div.innerHTML = `
        <div style="width:4px; background:${color}; border-radius:2px;"></div>
        <div>
            <div style="font-weight:600; font-size:14px;">${report.title}</div>
            <div style="font-size:12px; color:#666; margin-top:2px;">${report.date}</div>
            <div style="margin-top:4px;">
                <span style="font-size:10px; font-weight:bold; color:${color}; text-transform:uppercase;">${report.status}</span>
            </div>
        </div>
    `;
    list.appendChild(div);
}

// 6. EVENT LISTENERS
function setupMapEventListeners() {
    // Refresh Button
    const btn = document.getElementById('refreshMapBtn');
    if (btn) btn.addEventListener('click', loadMapData);

    // Filters
    const checkboxes = document.querySelectorAll('input[name="mapStatus"]');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', applyMapFilters);
    });
}