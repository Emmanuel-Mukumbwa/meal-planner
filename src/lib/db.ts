
import mysql from 'mysql2/promise';

/**
 * Flexible SSL configuration for Aiven/Vercel.
 */
const getSSLConfig = () => {
  const ca = process.env.DB_SSL_CA;
  
  if (!ca) {
    // Fallback for secure connection without explicit certificate validation
    return {
      rejectUnauthorized: false
    };
  }
  
  // Clean up common issues with certificate strings from env variables
  const formattedCa = ca
    .replace(/\\n/g, '\n')
    .replace(/\r/g, '')
    .trim();
  
  return {
    ca: formattedCa,
    rejectUnauthorized: false, 
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
