const mysql = require('mysql2');

const dotenv = require('dotenv').config();

console.log(`Connecting to Database ${process.env.DB_NAME}`);

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
    idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
});

async function testConnection() {
    try {
        await pool.execute('SHOW TABLES', (err, rows) => {
            if (err) {
                console.error('Error connecting to database: ', err);
                return;
            }
            console.log('Connected to database: ', rows);
        });
    } catch (error) {
        console.error('Error connecting to database: ', error);
    }
}

testConnection();

module.exports = pool.promise();