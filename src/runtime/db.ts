import { Pool, type PoolClient, type QueryResultRow } from "pg";

const hasPgEnvironment =
  process.env.PGHOST ||
  process.env.PGPORT ||
  process.env.PGDATABASE ||
  process.env.PGUSER ||
  process.env.PGPASSWORD;

export const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : hasPgEnvironment
      ? {}
      : { connectionString: "postgresql://automation:automation@localhost:5432/automation" }
);

export async function withTransaction<T>(
  work: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function queryOne<T extends QueryResultRow>(
  text: string,
  values: unknown[] = []
): Promise<T | null> {
  const result = await pool.query<T>(text, values);
  return result.rows[0] ?? null;
}
