import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pool } from "./db";

async function migrate() {
  const schemaPath = resolve(process.cwd(), "database", "schema.sql");
  const schema = await readFile(schemaPath, "utf8");

  console.log(`Applying schema from ${schemaPath}`);
  await pool.query(schema);
  console.log("Database schema applied successfully.");
}

migrate()
  .catch((error) => {
    console.error("Database migration failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
