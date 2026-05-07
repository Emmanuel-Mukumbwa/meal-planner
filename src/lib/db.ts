
import mysql from 'mysql2/promise';

/**
 * Flexible SSL configuration.
 * If DB_SSL_CA is provided, it uses it for strict verification.
 * Otherwise, it uses a generic SSL connection which is often sufficient for cloud databases.
 */
const getSSLConfig = () => {
  const ca = process.env.DB_SSL_CA;
  
  if (!ca) {
    // Return simple SSL enabled if no CA provided - works for most cloud MySQL
    return {
      rejectUnauthorized: false
    };
  }
  
  // Clean and format the CA string if provided
  const formattedCa = ca
    .replace(/\\n/g, '\n')
    .replace(/\r/g, '')
    .trim();
  
  return {
    ca: formattedCa,
    rejectUnauthorized: true,
  };
};

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '19004'),
  ssl: getSSLConfig(),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 20000,
});

export default pool;
