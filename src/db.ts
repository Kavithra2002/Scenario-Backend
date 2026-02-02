import { Client } from "pg";

function ensureString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

const dbConfig = {
  host: ensureString(process.env.DB_HOST, "localhost"),
  port: parseInt(ensureString(process.env.DB_PORT, "5432"), 10),
  database: ensureString(process.env.DB_NAME, "scenario_db"),
  user: ensureString(process.env.DB_USER, "scenario_ui"),
  password: ensureString(process.env.DB_PASSWORD, ""),
};

/**
 * Test database connection. Returns true if connected, false otherwise.
 * Logs result to console.
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    await client.query("SELECT 1");
    await client.end();
    return true;
  } catch (err) {
    try {
      await client.end();
    } catch {
      // ignore
    }
    console.error("[scenario-backend] Database connection error:", (err as Error).message);
    return false;
  }
}

/**
 * Get a new PostgreSQL client (for use in routes). Caller must connect/end.
 */
export function getDbConfig(): typeof dbConfig {
  return { ...dbConfig };
}

export { dbConfig };
