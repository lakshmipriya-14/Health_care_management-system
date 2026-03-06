const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Middleware to ensure user is logged in
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized: Please log in' });
    }
    next();
};

const requireDoctor = (req, res, next) => {
    if (!req.session.user || req.session.user.role !== 'doctor') {
        return res.status(403).json({ error: 'Forbidden: Doctor access only' });
    }
    next();
};

const requireAdmin = (req, res, next) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admin access only' });
    }
    next();
};

// ==========================================
// Public Endpoints
// ==========================================

router.get('/departments', async (req, res) => {
    try {
        const departments = await db.allAsync('SELECT * FROM departments');
        res.json(departments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/doctors', async (req, res) => {
    try {
        const { department } = req.query;
        let query = `
            SELECT d.id, u.name, u.email, u.phone, dep.name as department, 
                   d.specialty, d.experience_years, d.rating, d.is_available, d.department_id
            FROM doctors d
            JOIN users u ON d.user_id = u.id
            JOIN departments dep ON d.department_id = dep.id
        `;
        let doctors;
        
        if (department && department !== 'all') {
            query += ' WHERE d.department_id = ?';
            doctors = await db.allAsync(query, [department]);
        } else {
            doctors = await db.allAsync(query);
        }
        
        res.json(doctors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/doctors/:id', async (req, res) => {
    try {
        const doctor = await db.getAsync(`
            SELECT d.id, u.name, dep.name as department, d.specialty, 
                   d.experience_years, d.rating, d.is_available
            FROM doctors d
            JOIN users u ON d.user_id = u.id
            JOIN departments dep ON d.department_id = dep.id
            WHERE d.id = ?
        `, [req.params.id]);

        if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
        res.json(doctor);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ==========================================
// Protected Endpoints
// ==========================================

router.post('/bookings', requireAuth, async (req, res) => {
    try {
        const { doctor_id, department_id, date, time, notes } = req.body;
        
        if (!doctor_id || !department_id || !date || !time) {
            return res.status(400).json({ error: 'Missing required booking fields' });
        }

        const year = new Date().getFullYear();
        const randStr = Math.random().toString(36).substr(2, 4).toUpperCase();
        const refNo = `HBK-${year}-${randStr}`;

        const result = await db.runAsync(`
            INSERT INTO bookings (reference_no, patient_id, doctor_id, department_id, appointment_date, appointment_time, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [refNo, req.session.user.id, doctor_id, department_id, date, time, notes || '']);

        res.status(201).json({
            message: 'Booking request submitted successfully',
            referenceId: refNo,
            bookingId: result.lastID
        });

    } catch (err) {
        console.error('Booking error:', err);
        res.status(500).json({ error: 'Failed to create booking' });
    }
});

router.get('/bookings/mine', requireAuth, async (req, res) => {
    try {
        const bookings = await db.allAsync(`
            SELECT b.*, u.name as doctor_name, dep.name as department_name
            FROM bookings b
            JOIN doctors d ON b.doctor_id = d.id
            JOIN users u ON d.user_id = u.id
            JOIN departments dep ON b.department_id = dep.id
            WHERE b.patient_id = ?
            ORDER BY b.created_at DESC
        `, [req.session.user.id]);
        
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/bookings/requests', requireDoctor, async (req, res) => {
    try {
        const docId = req.session.user.doctor_id;
        if (!docId) return res.status(400).json({ error: 'Valid doctor ID not found in session' });

        const requests = await db.allAsync(`
            SELECT b.*, p.name as patient_name, p.email, p.phone, p.age, p.gender, dep.name as department_name
            FROM bookings b
            JOIN users p ON b.patient_id = p.id
            JOIN departments dep ON b.department_id = dep.id
            WHERE b.doctor_id = ?
            ORDER BY b.created_at DESC
        `, [docId]);

        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.patch('/bookings/:id/status', requireDoctor, async (req, res) => {
    try {
        const docId = req.session.user.doctor_id;
        const bookingId = req.params.id;
        const { status } = req.body;

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Must be Approved or Rejected' });
        }

        const booking = await db.getAsync('SELECT id FROM bookings WHERE id = ? AND doctor_id = ?', [bookingId, docId]);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found or not assigned to you' });
        }

        await db.runAsync('UPDATE bookings SET status = ? WHERE id = ?', [status, bookingId]);

        res.json({ message: `Booking ${status.toLowerCase()} successfully` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/admin/bookings', requireAdmin, async (req, res) => {
    try {
        const bookings = await db.allAsync(`
            SELECT b.*, p.name as patient_name, d_u.name as doctor_name, dep.name as department_name
            FROM bookings b
            JOIN users p ON b.patient_id = p.id
            JOIN doctors d ON b.doctor_id = d.id
            JOIN users d_u ON d.user_id = d_u.id
            JOIN departments dep ON b.department_id = dep.id
            ORDER BY b.created_at DESC
        `);
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
