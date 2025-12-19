document.addEventListener('DOMContentLoaded', function() {
    loadUsers();
});

async function loadUsers() {
    const tableBody = document.getElementById('usersTableBody');
    tableBody.innerHTML = '<tr><td colspan="7" class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading Users...</td></tr>';

    try {
        // 1. Fetch all reports to find unique students
        const { data: reports, error } = await window.supabaseClient
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // 2. Group reports by student_id to create "User" profiles
        const usersMap = {};
        
        reports.forEach(report => {
            const id = report.student_id || "Anonymous";
            
            if (!usersMap[id]) {
                usersMap[id] = {
                    id: id,
                    role: "Student", // Default
                    status: "Active",
                    incidentCount: 0,
                    lastActive: report.created_at,
                    firstSeen: report.created_at
                };
            }
            
            // Update stats
            usersMap[id].incidentCount++;
            if (new Date(report.created_at) > new Date(usersMap[id].lastActive)) {
                usersMap[id].lastActive = report.created_at;
            }
            if (new Date(report.created_at) < new Date(usersMap[id].firstSeen)) {
                usersMap[id].firstSeen = report.created_at;
            }
        });

        const users = Object.values(usersMap);

        // 3. Update Sidebar Badge
        const userBadge = document.querySelector('.badge-info');
        if(userBadge) userBadge.textContent = users.length;
        
        // 4. Update Stats Header
        document.querySelector('.stat-value').textContent = users.length; // Total Users

        // 5. Render Table
        renderUserTable(users);

    } catch (err) {
        console.error(err);
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Failed to load users.</td></tr>';
    }
}

function renderUserTable(users) {
    const tableBody = document.getElementById('usersTableBody');
    tableBody.innerHTML = '';

    if (users.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No active users found.</td></tr>';
        return;
    }

    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="user-cell">
                    <div class="user-avatar-small" style="background:#4F46E5; color:white; display:flex; align-items:center; justify-content:center; width:32px; height:32px; border-radius:50%;">
                        ${user.id.substring(0,1).toUpperCase()}
                    </div>
                    <div class="user-info-small">
                        <strong>${user.id}</strong>
                        <small>Student ID</small>
                    </div>
                </div>
            </td>
            <td><span class="role-badge role-student">Student</span></td>
            <td><span class="user-status-badge active">Active</span></td>
            <td>
                <div class="incident-count">
                    <span class="count">${user.incidentCount}</span>
                    <small>reports</small>
                </div>
            </td>
            <td>${new Date(user.lastActive).toLocaleDateString()}</td>
            <td>${new Date(user.firstSeen).toLocaleDateString()}</td>
            <td>
                <button class="btn-action" title="View Details"><i class="fas fa-eye"></i></button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Update Counts
    const showingCount = document.getElementById('userShowingCount');
    const totalCount = document.getElementById('userTotalCount');
    if(showingCount) showingCount.textContent = users.length;
    if(totalCount) totalCount.textContent = users.length;
}