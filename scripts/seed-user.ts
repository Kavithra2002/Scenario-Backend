/**
 * Seed a default user for development.
 * Run: npx tsx scripts/seed-user.ts
 *
 * Default: admin@example.com / admin123
 */
import "dotenv/config";
import bcrypt from "bcrypt";
import { Client } from "pg";

async function seed() {
  const client = new Client({
    host: process.env.DB_HOST ?? "localhost",
    port: parseInt(process.env.DB_PORT ?? "5432", 10),
    database: process.env.DB_NAME ?? "scenario_db",
    user: process.env.DB_USER ?? "scenario_ui",
    password: process.env.DB_PASSWORD ?? "",
  });

  try {
    await client.connect();

    // Ensure users table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'authorizer', 'system-admin')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    const email = "admin@example.com";
    const password = "admin123";
    const hash = await bcrypt.hash(password, 10);

    await client.query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [email, hash, "Admin", "system-admin"]
    );

    console.log(`[seed] User created: ${email} / ${password}`);
    console.log("[seed] You can now log in with these credentials.");
  } catch (err) {
    console.error("[seed] Error:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
