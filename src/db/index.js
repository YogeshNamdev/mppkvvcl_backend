import mysql from 'mysql2/promise';
import { DB_NAME } from '../constants.js';

let pool;

try {
  pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  console.log('Database connection pool created successfully.');
} catch (error) {
  console.error('Error creating database connection pool:', error.message);
  process.exit(1); 
}

export default pool;
