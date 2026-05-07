
import mysql from 'mysql2/promise';

/**
 * Flexible SSL configuration.
 * Hardened for Vercel deployment where DB_SSL_CA might be literal string or escaped.
 */
const getSSLConfig = () => {
  const ca = process.env.DB_SSL_CA;
  
  if (!ca) {
    // Aiven and many cloud providers require SSL. 
    // This allows insecure fallback if CA is missing but SSL is required.
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
    rejectUnauthorized: false, // Set to false to allow connection if certificate verification fails
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
