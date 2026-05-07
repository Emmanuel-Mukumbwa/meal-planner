
import mysql from 'mysql2/promise';

/**
 * Robust SSL configuration for Aiven/Vercel.
 * Handles certificate strings with both literal newlines and escaped \n characters.
 */
const getSSLConfig = () => {
  const ca = process.env.DB_SSL_CA;
  if (!ca) return undefined;
  
  // Clean and format the CA string to handle Vercel environment variable quirks
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
  connectTimeout: 20000, // Increased timeout for cloud connections
});

export default pool;
