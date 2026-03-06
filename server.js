const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: 'healthplus-super-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
}));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Pass session to views (middleware)
app.use((req, res, next) => {
    // We attach the user to response locals so routes could use it, but for our REST API we typically just return JSON
    next();
});

// Import Routes
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// Fallback HTML route for SPA-like behavior or explicitly serving files
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));
app.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    const role = req.session.user.role;
    if (role === 'patient') return res.sendFile(path.join(__dirname, 'public', 'patient-dashboard.html'));
    if (role === 'doctor') return res.sendFile(path.join(__dirname, 'public', 'doctor-dashboard.html'));
    if (role === 'admin') return res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
    res.redirect('/');
});


app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
