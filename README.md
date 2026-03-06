# Hospital Booking Platform (Full-Stack)

A complete, production-ready hospital checkup booking platform with a real backend, authentication system, and doctor workflow.

## Tech Stack
- **Frontend**: Vanilla JS, HTML, Custom CSS
- **Backend / API**: Node.js, Express
- **Database**: SQLite (via `better-sqlite3`)
- **Authentication**: Session-based with `bcrypt` password hashing

## Project Structure
- `/db` - SQLite initialization, connection setup, and seed schema
- `/public` - All frontend static files (HTML, CSS, UI logic scripts)
- `/routes` - Express API routers (`auth.js` for login/register, `api.js` for rest)
- `server.js` - Main entry-point configuring middleware and handling traffic

## Setup & Running

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Initialize Database**
   This script securely hashes passwords and populates demo patients, departments, and 8 unique doctors.
   ```bash
   npm run seed
   ```

3. **Start the Server**
   ```bash
   npm start
   ```

4. **Visit the App**
   Open `http://localhost:3000` in your browser.

## Demo Credentials

All test accounts use the same secure password: `Password123!` (or specific seeded password)

**Patient Details (Can Book Appointments)**
- Email: `patient@healthplus.com`
- Password: `Patient123!`

**Doctor Detail Examples (Can Approve/Reject Bookings)**
- Email: `r.smith@healthplus.com` (Cardiology)
- Email: `e.davis@healthplus.com` (Orthopedics)
- Password: `Doctor123!`

**Admin Details (View all bookings via API - /api/admin/bookings)**
- Email: `admin@healthplus.com`
- Password: `Admin123!`
