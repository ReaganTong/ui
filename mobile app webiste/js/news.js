document.addEventListener('DOMContentLoaded', function() {
    loadNews();
    
    // Handle Form Submit
    const form = document.getElementById('newsForm');
    if(form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            await sendNews();
        });
    }
});

async function loadNews() {
    const tableBody = document.getElementById('newsTableBody');
    tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Loading...</td></tr>';

    try {
        const { data: news, error } = await window.supabaseClient
            .from('news')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (news.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No news sent yet.</td></tr>';
            return;
        }

        tableBody.innerHTML = news.map(item => `
            <tr>
                <td>${new Date(item.created_at).toLocaleString()}</td>
                <td><strong>${item.title}</strong></td>
                <td>${item.description}</td>
                <td><span class="status-badge status-resolved">Sent</span></td>
            </tr>
        `).join('');

    } catch (err) {
        console.error("Error loading news:", err);
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Failed to load history.</td></tr>';
    }
}

async function sendNews() {
    const titleBtn = document.getElementById('sendNewsBtn');
    const originalText = titleBtn.innerHTML;
    
    try {
        // 1. Get Values
        const title = document.getElementById('newsTitle').value;
        const desc = document.getElementById('newsDescription').value;

        if(!title || !desc) return alert("Please fill in all fields");

        // 2. Show Loading
        titleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        titleBtn.disabled = true;

        // 3. Insert to Supabase
        const { error } = await window.supabaseClient
            .from('news')
            .insert([{ 
                title: title, 
                description: desc 
            }]);

        if (error) throw error;

        // 4. Success
        alert("News sent to Mobile App successfully!");
        document.getElementById('newsForm').reset();
        loadNews(); // Refresh table

    } catch (err) {
        console.error("Error sending news:", err);
        alert("Failed to send news: " + err.message);
    } finally {
        titleBtn.innerHTML = originalText;
        titleBtn.disabled = false;
    }
}