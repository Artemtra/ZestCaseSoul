import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");
const migrationsDir = path.join(rootDir, "migrations");
const database = process.env.DB_NAME || "case_editor";

const bootstrap = await mysql.createConnection({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  multipleStatements: true
});

await bootstrap.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
await bootstrap.end();

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database,
  multipleStatements: true
});

await connection.query(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

const [appliedRows] = await connection.query("SELECT filename FROM schema_migrations");
const applied = new Set(appliedRows.map((row) => row.filename));
const files = (await fs.readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();

for (const file of files) {
  if (applied.has(file)) {
    console.log(`skip ${file}`);
    continue;
  }

  const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");
  await connection.beginTransaction();
  try {
    await connection.query(sql);
    await connection.query("INSERT INTO schema_migrations (filename) VALUES (?)", [file]);
    await connection.commit();
    console.log(`applied ${file}`);
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

await connection.end();
