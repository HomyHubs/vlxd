import { Kysely, PostgresDialect, sql, type Transaction } from "kysely";
import pg from "pg";
import type { Config } from "../config.js";
import type { Database } from "./schema.js";

export * from "./schema.js";

const { Pool } = pg;

export interface DatabaseHealthResult {
  connected: boolean;
  error?: string;
}

export function createDatabase(config: Config): Kysely<Database> {
  if (!config.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }

  const pool = new Pool({
    connectionString: config.DATABASE_URL,
    min: config.DATABASE_POOL_MIN,
    max: config.DATABASE_POOL_MAX,
    ssl: config.DATABASE_SSL ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: config.DATABASE_CONNECTION_TIMEOUT_MS,
    idleTimeoutMillis: config.DATABASE_IDLE_TIMEOUT_MS,
  });

  const dialect = new PostgresDialect({
    pool,
  });

  return new Kysely<Database>({
    dialect,
  });
}

export async function closeDatabase(db: Kysely<Database>): Promise<void> {
  await db.destroy();
}

export async function checkDatabaseHealth(
  db: Kysely<Database>,
  timeoutMs = 3000,
): Promise<DatabaseHealthResult> {
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Database health check timed out")), timeoutMs),
    );

    const queryPromise = sql`SELECT 1`.execute(db);

    await Promise.race([queryPromise, timeoutPromise]);
    return { connected: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { connected: false, error: errorMsg };
  }
}

export async function withTransaction<T>(
  db: Kysely<Database>,
  callback: (trx: Transaction<Database>) => Promise<T>,
): Promise<T> {
  return db.transaction().execute(callback);
}

export interface TenantContext {
  tenantId: string;
}

export function createTenantScope(tenantId: string): TenantContext {
  if (!tenantId || tenantId.trim().length === 0) {
    throw new Error("Invalid tenant ID for tenant scope");
  }
  return { tenantId };
}
