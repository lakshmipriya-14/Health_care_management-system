const db = require('./database');
const bcrypt = require('bcrypt');

console.log('Initializing database tables...');

const hash = (password) => bcrypt.hashSync(password, 10);

async function initDB() {
    try {
        await db.runAsync(`DROP TABLE IF EXISTS bookings;`);
        await db.runAsync(`DROP TABLE IF EXISTS doctors;`);
        await db.runAsync(`DROP TABLE IF EXISTS users;`);
        await db.runAsync(`DROP TABLE IF EXISTS departments;`);

        await db.runAsync(`
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('patient', 'doctor', 'admin')),
                phone TEXT,
                age INTEGER,
                gender TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await db.runAsync(`
            CREATE TABLE departments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                icon TEXT,
                description TEXT
            );
        `);

        await db.runAsync(`
            CREATE TABLE doctors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE NOT NULL,
                department_id INTEGER NOT NULL,
                specialty TEXT NOT NULL,
                experience_years INTEGER NOT NULL,
                rating REAL DEFAULT 5.0,
                is_available BOOLEAN DEFAULT 1,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (department_id) REFERENCES departments (id)
            );
        `);

        await db.runAsync(`
            CREATE TABLE bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                reference_no TEXT UNIQUE NOT NULL,
                patient_id INTEGER NOT NULL,
                doctor_id INTEGER NOT NULL,
                department_id INTEGER NOT NULL,
                appointment_date TEXT NOT NULL,
                appointment_time TEXT NOT NULL,
                notes TEXT,
                status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Approved', 'Rejected')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (patient_id) REFERENCES users (id),
                FOREIGN KEY (doctor_id) REFERENCES doctors (id),
                FOREIGN KEY (department_id) REFERENCES departments (id)
            );
        `);

        console.log('Tables created successfully. Seeding data...');

        // Insert Departments
        const depts = [
            { name: 'Cardiology', icon: 'fa-heart-pulse', desc: 'Heart and cardiovascular care' },
            { name: 'Neurology', icon: 'fa-brain', desc: 'Brain and nervous system' },
            { name: 'Dental', icon: 'fa-tooth', desc: 'Oral care and dental surgery' },
            { name: 'Orthopedics', icon: 'fa-bone', desc: 'Bones, joints, and muscles' },
            { name: 'General Medicine', icon: 'fa-stethoscope', desc: 'Primary health care' },
            { name: 'Pediatrics', icon: 'fa-child-reaching', desc: 'Care for infants and children' },
            { name: 'Blood & Lab Tests', icon: 'fa-flask', desc: 'Diagnostics and lab services' }
        ];

        for (let d of depts) {
            await db.runAsync('INSERT INTO departments (name, icon, description) VALUES (?, ?, ?)', [d.name, d.icon, d.desc]);
        }

        // Insert Admin & Patient
        await db.runAsync('INSERT INTO users (name, email, password, role, phone, age, gender) VALUES (?, ?, ?, ?, ?, ?, ?)', 
            ['Site Admin', 'admin@healthplus.com', hash('Admin123!'), 'admin', '555-000-0000', 40, 'Other']);
        
        const patRes = await db.runAsync('INSERT INTO users (name, email, password, role, phone, age, gender) VALUES (?, ?, ?, ?, ?, ?, ?)', 
            ['Jane Doe', 'patient@healthplus.com', hash('Patient123!'), 'patient', '555-123-4567', 28, 'Female']);
        const patId = patRes.lastID;

        // Insert Doctors
        const doctorsData = [
            { name: 'Dr. Robert Smith', email: 'r.smith@healthplus.com', dept: 1, spec: 'Interventional Cardiology', exp: 15, rating: 4.9 },
            { name: 'Dr. Sarah Williams', email: 's.williams@healthplus.com', dept: 2, spec: 'Neuromuscular Medicine', exp: 12, rating: 4.8 },
            { name: 'Dr. Michael Lee', email: 'm.lee@healthplus.com', dept: 3, spec: 'Orthodontics', exp: 8, rating: 4.7 },
            { name: 'Dr. Emily Davis', email: 'e.davis@healthplus.com', dept: 4, spec: 'Joint Replacement', exp: 20, rating: 5.0 },
            { name: 'Dr. James Wilson', email: 'j.wilson@healthplus.com', dept: 5, spec: 'Family Medicine', exp: 10, rating: 4.6 },
            { name: 'Dr. Olivia Brown', email: 'o.brown@healthplus.com', dept: 6, spec: 'Neonatology', exp: 14, rating: 4.9 },
            { name: 'Dr. William Garcia', email: 'w.garcia@healthplus.com', dept: 7, spec: 'Pathology', exp: 22, rating: 4.8 },
            { name: 'Dr. Sophia Martinez', email: 's.martinez@healthplus.com', dept: 1, spec: 'Echocardiography', exp: 9, rating: 4.7 }
        ];

        for (let d of doctorsData) {
            const uRes = await db.runAsync('INSERT INTO users (name, email, password, role, phone, age, gender) VALUES (?, ?, ?, ?, ?, ?, ?)', 
                [d.name, d.email, hash('Doctor123!'), 'doctor', '555-999-0000', 45, 'Other']);
            
            await db.runAsync('INSERT INTO doctors (user_id, department_id, specialty, experience_years, rating) VALUES (?, ?, ?, ?, ?)', 
                [uRes.lastID, d.dept, d.spec, d.exp, d.rating]);
        }

        // Dummy Booking
        const doc1 = await db.getAsync("SELECT * FROM doctors WHERE department_id = 1");
        await db.runAsync('INSERT INTO bookings (reference_no, patient_id, doctor_id, department_id, appointment_date, appointment_time, notes) VALUES (?, ?, ?, ?, ?, ?, ?)', 
            ['HBK-2024-ABC1', patId, doc1.id, 1, '2026-10-15', '10:30 AM', 'Initial consultation for checkup']);

        console.log('Database initialization and seeding completed successfully!');
    } catch (err) {
        console.error('Initialization failed:', err);
    } finally {
        // give it a second to close properly then exit
        setTimeout(() => process.exit(0), 1000); 
    }
}

initDB();
