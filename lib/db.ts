// // lib/db.ts

// import mysql from 'mysql2/promise';

// export const db = mysql.createPool({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME,
//     port: Number(process.env.DB_PORT) || 3306,
// });

import mysql, { Pool } from 'mysql2/promise';

const pool: Pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
});

const originalExecute = pool.execute.bind(pool);

pool.execute = async function (...args: any[]) {
  const retries = 3;
  const delayMs = 1000;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Cast to any to bypass overload checking
      return await (originalExecute as any).apply(pool, args);
    } catch (error: any) {
      const transientErrors = ['PROTOCOL_SEQUENCE_TIMEOUT', 'ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED'];

      if (attempt < retries && transientErrors.includes(error.code)) {
        console.warn(`DB execute error "${error.code}", retrying attempt ${attempt + 1}...`);
        await new Promise((r) => setTimeout(r, delayMs));
      } else {
        throw error;
      }
    }
  }

  throw new Error('Failed to execute DB query after retries');
};

export const db = pool;
