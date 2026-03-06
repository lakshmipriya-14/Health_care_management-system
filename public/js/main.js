let globalDoctors = [];
let currentUser = null;

const showToast = (msg, isError = false) => {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = 'toast ' + (isError ? 'error' : 'success');
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
};

document.addEventListener('DOMContentLoaded', async () => {

    // 1. Check Auth & Update Nav
    try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
            const data = await res.json();
            currentUser = data.user;
            
            const nav = document.getElementById('authNav');
            nav.innerHTML = `
                <a href="#departments">Departments</a>
                <a href="#doctors">Doctors</a>
                <a href="/dashboard" class="btn btn-primary" style="padding: 0.5rem 1rem;">Dashboard</a>
                <a href="#" id="mainLogout" class="btn btn-outline" style="padding: 0.5rem 1rem;">Log Out</a>
            `;

            document.getElementById('mainLogout').addEventListener('click', async (e) => {
                e.preventDefault();
                await fetch('/api/auth/logout', { method: 'POST' });
                window.location.reload();
            });
        }
    } catch (err) { }

    // 2. Fetch Departments
    try {
        const res = await fetch('/api/departments');
        const depts = await res.json();
        
        const deptsGrid = document.getElementById('deptsGrid');
        const bookDept = document.getElementById('bookDept');
        const filterDept = document.getElementById('filterDept');
        
        deptsGrid.innerHTML = '';
        depts.forEach(d => {
            // Populate grid
            const card = document.createElement('div');
            card.className = 'card dept-card text-center';
            card.style.cursor = 'pointer';
            card.onclick = () => selectDepartment(d.id);
            card.innerHTML = `
                <div class="dept-icon"><i class="fa-solid ${d.icon}"></i></div>
                <h3>${d.name}</h3>
                <p style="font-size: 0.9rem;">${d.description}</p>
            `;
            deptsGrid.appendChild(card);

            // Populate selects
            const optBook = new Option(d.name, d.id);
            const optFilter = new Option(d.name, d.id);
            bookDept.add(optBook);
            filterDept.add(optFilter);
        });

    } catch (err) { console.error('Error fetching depts:', err); }

    // 3. Fetch Doctors
    try {
        const res = await fetch('/api/doctors');
        globalDoctors = await res.json();
        renderDoctorsGrid(globalDoctors);
        updateDoctorDropdown(globalDoctors);
    } catch (err) { console.error('Error fetching doctors:', err); }


    // 4. Booking Form Interactions
    const bookDept = document.getElementById('bookDept');
    const bookDoc = document.getElementById('bookDoc');
    const dateInput = document.getElementById('bookDate');
    const filterDept = document.getElementById('filterDept');

    // Filter logic on Doctor grid
    filterDept.addEventListener('change', (e) => {
        const dId = e.target.value;
        if (dId === 'all') {
            renderDoctorsGrid(globalDoctors);
        } else {
            const filtered = globalDoctors.filter(d => d.department_id == dId);
            renderDoctorsGrid(filtered);
        }
    });

    // Min date
    const today = new Date();
    const minDate = today.toISOString().split('T')[0];
    dateInput.setAttribute('min', minDate);

    // Filter doctors when dept selected in booking form
    bookDept.addEventListener('change', (e) => {
        const dId = e.target.value;
        const filtered = globalDoctors.filter(d => d.department_id == dId);
        updateDoctorDropdown(filtered);
    });

    // Submit Booking
    const bookingForm = document.getElementById('bookingForm');
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!currentUser) {
            showToast('You must be logged in to book an appointment.', true);
            setTimeout(() => window.location.href = '/login.html', 1500);
            return;
        }
        if (currentUser.role !== 'patient') {
            showToast('Only patients can book appointments.', true);
            return;
        }

        const payload = {
            department_id: bookDept.value,
            doctor_id: bookDoc.value,
            date: dateInput.value,
            time: document.getElementById('bookTime').value,
            notes: document.getElementById('bookNotes').value
        };

        if (!payload.department_id || !payload.doctor_id || !payload.date || !payload.time) {
            showToast('Please fill all required fields.', true);
            return;
        }

        const btn = document.getElementById('submitBookingBtn');
        const origText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = 'Processing... <i class="fa-solid fa-spinner fa-spin"></i>';

        try {
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            showToast(`Success! Reference: ${data.referenceId}`);
            bookingForm.reset();
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 2000);

        } catch (err) {
            showToast(err.message, true);
            btn.disabled = false;
            btn.innerHTML = origText;
        }
    });

});

function selectDepartment(deptId) {
    document.getElementById('bookDept').value = deptId;
    document.getElementById('bookDept').dispatchEvent(new Event('change'));
    document.getElementById('book-appointment').scrollIntoView({ behavior: 'smooth' });
}

function selectDoctor(deptId, docId) {
    document.getElementById('bookDept').value = deptId;
    document.getElementById('bookDept').dispatchEvent(new Event('change'));
    setTimeout(() => { 
        document.getElementById('bookDoc').value = docId; 
    }, 50);
    document.getElementById('book-appointment').scrollIntoView({ behavior: 'smooth' });
}

function renderDoctorsGrid(doctors) {
    const docsGrid = document.getElementById('docsGrid');
    docsGrid.innerHTML = '';
    
    if (doctors.length === 0) {
        docsGrid.innerHTML = '<p class="text-center" style="grid-column: 1 / -1;">No doctors match this filter.</p>';
        return;
    }

    doctors.forEach(doc => {
        const statusClass = doc.is_available ? 'color: var(--success)' : 'color: var(--warning)';
        const card = document.createElement('div');
        card.className = 'card';
        card.style.padding = '0';
        card.style.overflow = 'hidden';
        card.innerHTML = `
            <div class="doc-img"><i class="fa-solid fa-user-md"></i></div>
            <div style="padding: 1.5rem;">
                <div style="font-size: 0.8rem; font-weight: 700; ${statusClass}; margin-bottom: 0.5rem;"><i class="fa-solid fa-circle"></i> ${doc.is_available ? 'Available' : 'Busy'}</div>
                <h3 style="margin-bottom: 0;">${doc.name}</h3>
                <p style="color: var(--primary); font-weight: 500; margin-bottom: 1rem;">${doc.specialty}</p>
                <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border); padding-top: 1rem; margin-bottom: 1.5rem; font-size: 0.85rem; color: var(--text-muted);">
                    <span><i class="fa-solid fa-briefcase-medical"></i> ${doc.experience_years} Yrs</span>
                    <span><i class="fa-solid fa-star text-warning"></i> ${doc.rating}</span>
                </div>
                <button class="btn btn-outline btn-block" onclick="selectDoctor(${doc.department_id}, ${doc.id})">Book Appointment</button>
            </div>
        `;
        docsGrid.appendChild(card);
    });
}

function updateDoctorDropdown(doctors) {
    const bookDoc = document.getElementById('bookDoc');
    bookDoc.innerHTML = '<option value="" disabled selected>Select Doctor</option>';
    doctors.forEach(d => {
        const option = new Option(`${d.name} (${d.specialty})`, d.id);
        bookDoc.add(option);
    });
}
