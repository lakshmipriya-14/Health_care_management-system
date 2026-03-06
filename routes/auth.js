const express = require('express');
const router = express.Router();
const db = require('../db/database');
const bcrypt = require('bcrypt');

// Validation helper
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone, age, gender } = req.body;

        // Basic validation
        if (!name || !email || !password || !phone || !age || !gender) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // Check if user exists
        const existingUser = await db.getAsync('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert patient
        const result = await db.runAsync(`
            INSERT INTO users (name, email, password, role, phone, age, gender) 
            VALUES (?, ?, ?, 'patient', ?, ?, ?)
        `, [name, email, hashedPassword, phone, parseInt(age), gender]);

        // Auto-login after registration
        req.session.user = {
            id: result.lastID,
            name: name,
            email: email,
            role: 'patient'
        };

        res.status(201).json({ 
            message: 'Registration successful',
            user: req.session.user 
        });

    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const user = await db.getAsync('SELECT * FROM users WHERE email = ?', [email]);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Set session
        let sessionUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        // If doctor, also attach doctor_id
        if (user.role === 'doctor') {
            const doctor = await db.getAsync('SELECT id FROM doctors WHERE user_id = ?', [user.id]);
            if (doctor) {
                sessionUser.doctor_id = doctor.id;
            }
        }

        req.session.user = sessionUser;

        res.json({
            message: 'Login successful',
            user: sessionUser
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out successfully' });
    });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    res.json({ user: req.session.user });
});

module.exports = router;
