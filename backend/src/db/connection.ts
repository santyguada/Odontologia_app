import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

// Pool de conexiones. dateStrings: las fechas llegan como texto 'YYYY-MM-DD' (sin corrimientos de zona horaria)
export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  dateStrings: true,
  connectionLimit: 10,
});
