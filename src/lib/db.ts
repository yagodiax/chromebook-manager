
import mysql from "mysql2/promise";

const {
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
} = process.env;

if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
  throw new Error(
    "Configure as variáveis do banco no arquivo .env.local."
  );
}

export const pool = mysql.createPool({
  host: DB_HOST,
  port: Number(DB_PORT || 4000),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  ssl: {
    rejectUnauthorized: true,
  },
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});
