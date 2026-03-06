document.addEventListener('DOMContentLoaded', async () => {
    
    // Check auth
    try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) throw new Error('Not logged in');
        const data = await res.json();
        
        if (data.user.role !== 'doctor') {
            window.location.href = '/login.html';
            return;
        }

        document.getElementById('docName').textContent = data.user.name;
        loadRequests();

    } catch (err) {
        window.location.href = '/login.html';
    }

});

const showToast = (msg, isError = false) => {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = 'toast ' + (isError ? 'error' : 'success');
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
};

async function loadRequests() {
    const tbody = document.getElementById('requestsTableBody');
    try {
        const res = await fetch('/api/bookings/requests');
        if (!res.ok) throw new Error('Failed to load requests');
        const requests = await res.json();

        if (requests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No incoming requests.</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        requests.forEach(r => {
            const tr = document.createElement('tr');
            
            // Status styling
            let statusClass = 'status-pending';
            if (r.status === 'Approved') statusClass = 'status-approved';
            if (r.status === 'Rejected') statusClass = 'status-rejected';

            let actionHtml = '';
            if (r.status === 'Pending') {
                actionHtml = `
                    <div class="action-btns">
                        <button class="btn-act btn-accept" onclick="updateStatus(${r.id}, 'Approved')"><i class="fa-solid fa-check"></i> Accept</button>
                        <button class="btn-act btn-reject" onclick="updateStatus(${r.id}, 'Rejected')"><i class="fa-solid fa-xmark"></i> Reject</button>
                    </div>
                `;
            } else {
                actionHtml = `<span style="color: var(--text-muted); font-size: 0.85rem;">Completed</span>`;
            }

            tr.innerHTML = `
                <td><strong style="color: var(--primary);">${r.reference_no}</strong></td>
                <td>
                    <strong>${r.patient_name}</strong><br>
                    <span style="font-size: 0.8rem; color: var(--text-muted);">${r.age} yrs | ${r.gender}</span>
                </td>
                <td style="font-size: 0.85rem;">
                    <i class="fa-solid fa-phone"></i> ${r.phone}<br>
                    <i class="fa-solid fa-envelope"></i> ${r.email}
                </td>
                <td>${r.appointment_date}<br><span style="color: var(--text-muted);">${r.appointment_time}</span></td>
                <td><span class="status-badge ${statusClass}">${r.status}</span></td>
                <td>${actionHtml}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="color:red">Error loading requests.</td></tr>';
    }
}

async function updateStatus(bookingId, status) {
    if (!confirm(`Are you sure you want to ${status.toLowerCase()} this booking?`)) return;

    try {
        const res = await fetch(`/api/bookings/${bookingId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        
        showToast(data.message);
        loadRequests(); // refresh table
    } catch (err) {
        showToast(err.message, true);
    }
}
