const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to SQLite database. Creates the file if it doesn't exist.
const dbPath = path.resolve(__dirname, 'hospital.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        // Enable foreign keys
        db.run('PRAGMA foreign_keys = ON');
    }
});

// Helper for Promisifying db.get
db.getAsync = function (sql, params = []) {
    return new Promise((resolve, reject) => {
        this.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

// Helper for Promisifying db.all
db.allAsync = function (sql, params = []) {
    return new Promise((resolve, reject) => {
        this.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

// Helper for Promisifying db.run
db.runAsync = function (sql, params = []) {
    return new Promise((resolve, reject) => {
        this.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this); // 'this' contains lastID and changes
        });
    });
};

module.exports = db;
