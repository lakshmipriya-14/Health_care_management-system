document.addEventListener('DOMContentLoaded', async () => {
    
    // Check auth
    try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) throw new Error('Not logged in');
        const data = await res.json();
        
        if (data.user.role !== 'patient') {
            window.location.href = '/login.html';
            return;
        }

        document.getElementById('userName').textContent = data.user.name;
        loadBookings();

    } catch (err) {
        window.location.href = '/login.html';
    }

});

async function loadBookings() {
    const tbody = document.getElementById('bookingsTableBody');
    try {
        const res = await fetch('/api/bookings/mine');
        if (!res.ok) throw new Error('Failed to load bookings');
        const bookings = await res.json();

        if (bookings.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No bookings found.</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        bookings.forEach(b => {
            const tr = document.createElement('tr');
            
            // Status styling
            let statusClass = 'status-pending';
            if (b.status === 'Approved') statusClass = 'status-approved';
            if (b.status === 'Rejected') statusClass = 'status-rejected';

            tr.innerHTML = `
                <td><strong style="color: var(--primary);">${b.reference_no}</strong></td>
                <td>${b.doctor_name}</td>
                <td>${b.department_name}</td>
                <td>${b.appointment_date} at ${b.appointment_time}</td>
                <td><span class="status-badge ${statusClass}">${b.status}</span></td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="color:red">Error loading bookings.</td></tr>';
    }
}
