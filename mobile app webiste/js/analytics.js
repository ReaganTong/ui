// Analytics Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all charts
    initIncidentTrendChart();
    initCategoryDistributionChart();
    initTimeOfDayChart();
    initDepartmentChart();
    initResolutionTimeChart();
    initKPISmallCharts();
    
    // Date range selector
    const dateRangeButtons = document.querySelectorAll('.btn-date-range');
    dateRangeButtons.forEach(button => {
        button.addEventListener('click', function() {
            dateRangeButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            updateChartsForDateRange(this.dataset.range);
        });
    });
    
    // Trend metric selector
    const trendMetricSelect = document.getElementById('trendMetric');
    if (trendMetricSelect) {
        trendMetricSelect.addEventListener('change', function() {
            updateTrendChart(this.value);
        });
    }
    
    // Report generation
    const generateReportBtn = document.getElementById('generateReportBtn');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', function() {
            generateCustomReport();
        });
    }
    
    // Export report
    const exportReportBtn = document.getElementById('exportReportBtn');
    if (exportReportBtn) {
        exportReportBtn.addEventListener('click', function() {
            exportAnalyticsReport();
        });
    }
    
    // Building heatmap interaction
    const buildingElements = document.querySelectorAll('.building');
    buildingElements.forEach(building => {
        building.addEventListener('click', function() {
            showBuildingDetails(this.dataset.building);
        });
    });
});

// Initialize Incident Trend Chart
function initIncidentTrendChart() {
    const ctx = document.getElementById('incidentTrendChart').getContext('2d');
    
    // Sample data for trend chart
    const dates = ['Dec 11', 'Dec 12', 'Dec 13', 'Dec 14', 'Dec 15', 'Dec 16', 'Dec 17'];
    const incidentCounts = [12, 18, 15, 22, 19, 25, 23];
    const avgSeverity = [2.3, 2.8, 2.5, 3.1, 2.9, 3.4, 3.2];
    const responseTimes = [2.1, 2.4, 2.2, 2.8, 2.5, 3.1, 2.9];
    
    const trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Incident Count',
                data: incidentCounts,
                borderColor: '#4F46E5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                yAxisID: 'y'
            }, {
                label: 'Avg Severity (1-5)',
                data: avgSeverity,
                borderColor: '#10B981',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [5, 5],
                tension: 0.4,
                yAxisID: 'y1'
            }]
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            stacked: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Incident Trends (Last 7 Days)'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Incident Count'
                    },
                    min: 0,
                    max: 30
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Avg Severity'
                    },
                    min: 1,
                    max: 5,
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
    
    // Store chart instance for updates
    window.trendChart = trendChart;
}

// Initialize Category Distribution Chart
function initCategoryDistributionChart() {
    const ctx = document.getElementById('categoryDistributionChart').getContext('2d');
    
    const categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Hazards', 'Security', 'Maintenance', 'Theft', 'Medical', 'Other'],
            datasets: [{
                data: [35, 25, 18, 12, 6, 4],
                backgroundColor: [
                    '#EF4444', // Red
                    '#3B82F6', // Blue
                    '#10B981', // Green
                    '#F59E0B', // Yellow
                    '#8B5CF6', // Purple
                    '#6B7280'  // Gray
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });
}

// Initialize Time of Day Chart
function initTimeOfDayChart() {
    const ctx = document.getElementById('timeOfDayChart').getContext('2d');
    
    const hours = ['12AM', '2AM', '4AM', '6AM', '8AM', '10AM', '12PM', '2PM', '4PM', '6PM', '8PM', '10PM'];
    const incidentsByHour = [2, 1, 0, 3, 8, 12, 15, 18, 20, 14, 9, 4];
    
    const timeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: hours,
            datasets: [{
                label: 'Incidents',
                data: incidentsByHour,
                backgroundColor: 'rgba(79, 70, 229, 0.7)',
                borderColor: '#4F46E5',
                borderWidth: 1,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Peak Reporting Times'
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Time of Day'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Incidents'
                    },
                    ticks: {
                        stepSize: 5
                    }
                }
            }
        }
    });
}

// Initialize Department Chart
function initDepartmentChart() {
    const ctx = document.getElementById('departmentChart').getContext('2d');
    
    const departmentData = {
        labels: ['Comp Sci', 'Engineering', 'Business', 'Arts', 'Sciences', 'Medicine', 'Law'],
        datasets: [{
            label: 'Incidents',
            data: [24, 18, 15, 12, 20, 8, 6],
            backgroundColor: 'rgba(59, 130, 246, 0.7)',
            borderColor: '#3B82F6',
            borderWidth: 1
        }, {
            label: 'Resolved',
            data: [20, 15, 12, 10, 16, 6, 5],
            backgroundColor: 'rgba(16, 185, 129, 0.7)',
            borderColor: '#10B981',
            borderWidth: 1
        }]
    };
    
    const departmentChart = new Chart(ctx, {
        type: 'bar',
        data: departmentData,
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Incidents by Department'
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Incidents'
                    }
                }
            }
        }
    });
}

// Initialize Resolution Time Chart
function initResolutionTimeChart() {
    const ctx = document.getElementById('resolutionTimeChart').getContext('2d');
    
    const resolutionData = {
        labels: ['<1 hour', '1-3 hours', '3-6 hours', '6-12 hours', '12-24 hours', '>24 hours'],
        datasets: [{
            data: [15, 28, 32, 18, 10, 7],
            backgroundColor: [
                '#10B981', '#34D399', '#60A5FA', '#FBBF24', '#FB923C', '#F87171'
            ],
            borderWidth: 2,
            borderColor: '#ffffff'
        }]
    };
    
    const resolutionChart = new Chart(ctx, {
        type: 'polarArea',
        data: resolutionData,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                },
                title: {
                    display: true,
                    text: 'Resolution Time Distribution'
                }
            },
            scales: {
                r: {
                    ticks: {
                        display: false
                    }
                }
            }
        }
    });
}

// Initialize KPI Small Charts
function initKPISmallCharts() {
    // Response Time Chart
    const responseCtx = document.getElementById('responseTimeChart').getContext('2d');
    new Chart(responseCtx, {
        type: 'line',
        data: {
            labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
            datasets: [{
                data: [2.8, 2.6, 2.4, 2.3, 2.2, 2.4, 2.5],
                borderColor: '#10B981',
                backgroundColor: 'transparent',
                borderWidth: 2,
                tension: 0.4,
                fill: false,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            scales: {
                x: { display: false },
                y: { display: false }
            }
        }
    });
    
    // Resolution Rate Chart
    const resolutionCtx = document.getElementById('resolutionRateChart').getContext('2d');
    new Chart(resolutionCtx, {
        type: 'line',
        data: {
            labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
            datasets: [{
                data: [92, 93, 94, 94, 95, 94, 94],
                borderColor: '#3B82F6',
                backgroundColor: 'transparent',
                borderWidth: 2,
                tension: 0.4,
                fill: false,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            scales: {
                x: { display: false },
                y: { display: false }
            }
        }
    });
    
    // Satisfaction Chart
    const satisfactionCtx = document.getElementById('satisfactionChart').getContext('2d');
    new Chart(satisfactionCtx, {
        type: 'line',
        data: {
            labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
            datasets: [{
                data: [4.5, 4.3, 4.2, 4.1, 4.2, 4.3, 4.2],
                borderColor: '#F59E0B',
                backgroundColor: 'transparent',
                borderWidth: 2,
                tension: 0.4,
                fill: false,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            scales: {
                x: { display: false },
                y: { display: false }
            }
        }
    });
    
    // Active Reports Chart
    const activeCtx = document.getElementById('activeReportsChart').getContext('2d');
    new Chart(activeCtx, {
        type: 'line',
        data: {
            labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
            datasets: [{
                data: [28, 26, 25, 24, 23, 24, 23],
                borderColor: '#EF4444',
                backgroundColor: 'transparent',
                borderWidth: 2,
                tension: 0.4,
                fill: false,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            scales: {
                x: { display: false },
                y: { display: false }
            }
        }
    });
}

// Update charts based on date range
function updateChartsForDateRange(range) {
    console.log(`Updating charts for date range: ${range}`);
    
    // In a real application, you would fetch new data from the API
    // based on the selected date range
    
    // For demo purposes, we'll simulate data updates
    const ranges = {
        'week': { days: 7, label: 'Last 7 Days' },
        'month': { days: 30, label: 'Last 30 Days' },
        'quarter': { days: 90, label: 'Last Quarter' },
        'year': { days: 365, label: 'Last Year' }
    };
    
    const selectedRange = ranges[range];
    
    // Show loading state
    showLoadingState();
    
    // Simulate API call
    setTimeout(() => {
        // Update charts with new data
        updateChartData(selectedRange.days);
        hideLoadingState();
        
        // Show success message
        showNotification(`Charts updated for ${selectedRange.label}`, 'success');
    }, 1000);
}

// Update chart data
function updateChartData(days) {
    // Generate new random data based on days
    const newData = generateRandomData(days);
    
    // Update trend chart if it exists
    if (window.trendChart) {
        window.trendChart.data.labels = newData.labels;
        window.trendChart.data.datasets[0].data = newData.incidentCounts;
        window.trendChart.update();
    }
}

// Generate random data for charts
function generateRandomData(days) {
    const labels = [];
    const incidentCounts = [];
    
    // Generate labels based on number of days
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        
        // Generate random incident count (between 10 and 30)
        incidentCounts.push(Math.floor(Math.random() * 20) + 10);
    }
    
    return {
        labels,
        incidentCounts
    };
}

// Update trend chart based on selected metric
function updateTrendChart(metric) {
    console.log(`Updating trend chart with metric: ${metric}`);
    
    if (!window.trendChart) return;
    
    // Sample data for different metrics
    const metricsData = {
        'count': {
            label: 'Incident Count',
            data: [12, 18, 15, 22, 19, 25, 23],
            color: '#4F46E5',
            yAxisID: 'y'
        },
        'severity': {
            label: 'Average Severity',
            data: [2.3, 2.8, 2.5, 3.1, 2.9, 3.4, 3.2],
            color: '#10B981',
            yAxisID: 'y1'
        },
        'response': {
            label: 'Response Time (hours)',
            data: [2.1, 2.4, 2.2, 2.8, 2.5, 3.1, 2.9],
            color: '#F59E0B',
            yAxisID: 'y'
        }
    };
    
    const selectedMetric = metricsData[metric];
    
    // Update the dataset
    window.trendChart.data.datasets[0].label = selectedMetric.label;
    window.trendChart.data.datasets[0].data = selectedMetric.data;
    window.trendChart.data.datasets[0].borderColor = selectedMetric.color;
    window.trendChart.data.datasets[0].backgroundColor = selectedMetric.color + '20';
    window.trendChart.data.datasets[0].yAxisID = selectedMetric.yAxisID;
    
    // Hide the second dataset
    window.trendChart.data.datasets[1].hidden = true;
    
    window.trendChart.update();
}

// Show building details
function showBuildingDetails(buildingId) {
    const buildingData = {
        'library': {
            name: 'Main Library',
            incidents: 24,
            pending: 5,
            avgSeverity: 'Medium',
            avgResponse: '2.1 hours',
            trend: 'Increasing'
        },
        'science': {
            name: 'Science Building',
            incidents: 18,
            pending: 3,
            avgSeverity: 'Low',
            avgResponse: '1.8 hours',
            trend: 'Stable'
        },
        'dorm-a': {
            name: 'Dormitory A',
            incidents: 12,
            pending: 2,
            avgSeverity: 'Medium',
            avgResponse: '2.4 hours',
            trend: 'Decreasing'
        }
    };
    
    const data = buildingData[buildingId] || buildingData['library'];
    
    // Create modal with building details
    const modalHtml = `
        <div class="modal active" id="buildingModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${data.name} - Incident Analytics</h3>
                    <button class="modal-close" onclick="closeModal('buildingModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="building-stats">
                        <div class="stat-item">
                            <span class="stat-label">Total Incidents</span>
                            <span class="stat-value">${data.incidents}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Pending Review</span>
                            <span class="stat-value">${data.pending}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Avg Severity</span>
                            <span class="stat-value">${data.avgSeverity}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Avg Response Time</span>
                            <span class="stat-value">${data.avgResponse}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Trend</span>
                            <span class="stat-value ${data.trend.toLowerCase()}">${data.trend}</span>
                        </div>
                    </div>
                    
                    <div class="incident-breakdown">
                        <h4>Recent Incidents</h4>
                        <div class="incident-list">
                            <!-- Incident items would be loaded here -->
                            <div class="incident-item">
                                <span class="incident-title">Broken window - Floor 3</span>
                                <span class="incident-time">Today, 10:30 AM</span>
                            </div>
                            <div class="incident-item">
                                <span class="incident-title">Fire alarm test - No issues</span>
                                <span class="incident-time">Yesterday, 2:15 PM</span>
                            </div>
                            <div class="incident-item">
                                <span class="incident-title">Water leak - Room 305</span>
                                <span class="incident-time">Dec 16, 9:45 AM</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal('buildingModal')">Close</button>
                    <button class="btn btn-primary" onclick="viewBuildingOnMap('${buildingId}')">
                        <i class="fas fa-map-marker-alt"></i> View on Map
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);
}

// Close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}

// View building on map
function viewBuildingOnMap(buildingId) {
    // In a real application, this would navigate to the map page
    // and focus on the specific building
    window.location.href = `map.html?building=${buildingId}`;
}

// Generate custom report
function generateCustomReport() {
    const reportName = document.getElementById('reportName').value || 'Analytics Report';
    const reportPeriod = document.getElementById('reportPeriod').value;
    const reportFormat = document.getElementById('reportFormat').value;
    
    // Show loading state
    showLoadingState();
    
    // Simulate report generation
    setTimeout(() => {
        hideLoadingState();
        
        // Create download link
        const blob = new Blob(['Sample report content'], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${reportFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Show success message
        showNotification(`Report "${reportName}" generated successfully!`, 'success');
        
        // Close modal
        closeModal('reportGeneratorModal');
    }, 2000);
}

// Export analytics report
function exportAnalyticsReport() {
    // Get current date range
    const activeRange = document.querySelector('.btn-date-range.active').dataset.range;
    
    showLoadingState();
    
    setTimeout(() => {
        hideLoadingState();
        
        // In a real application, this would generate a comprehensive PDF/Excel report
        const reportData = {
            title: `Campus Safety Analytics Report - ${new Date().toLocaleDateString()}`,
            period: activeRange,
            generated: new Date().toISOString(),
            charts: ['trend', 'categories', 'timing', 'departments', 'resolution'],
            data: window.trendChart ? window.trendChart.data : null
        };
        
        // Create and download report
        const dataStr = JSON.stringify(reportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics_report_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('Analytics report exported successfully!', 'success');
    }, 1500);
}

// Utility functions
function showLoadingState() {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading data...</p>
        </div>
    `;
    document.body.appendChild(loadingOverlay);
}

function hideLoadingState() {
    const loadingOverlay = document.querySelector('.loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.remove();
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button class="notification-close">&times;</button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
    
    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
}