
import mysql from 'mysql2/promise';

// Helper to handle SSL certificate string formatting for Aiven/Vercel
const getSSLConfig = () => {
  const ca = process.env.DB_SSL_CA;
  if (!ca) return undefined;
  
  // Replace literal \n strings or handle actual newlines
  const formattedCa = ca.replace(/\\n/g, '\n');
  
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
  connectTimeout: 10000, // 10s timeout
});

export default pool;
