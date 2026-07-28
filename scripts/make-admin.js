import "dotenv/config";
import mysql from "mysql2/promise";

const email = String(process.argv[2] || process.env.ADMIN_EMAIL || "").trim().toLowerCase();

if (!email) {
  console.error("Usage: npm run make-admin -- user@example.com");
  process.exit(1);
}

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "case_editor"
});

const [result] = await connection.query("UPDATE users SET role = 'admin' WHERE email = ?", [email]);
await connection.end();

if (result.affectedRows === 0) {
  console.error(`User not found: ${email}`);
  process.exit(1);
}

console.log(`Admin role granted to ${email}`);
