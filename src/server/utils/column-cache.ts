import { query } from "@/src/db/http";

const cache = new Map<string, boolean>();

export const hasColumn = async (table: string, column: string) => {
  const key = `${table}.${column}`;
  const cached = cache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  const result = await query<{ exists: boolean }>(
    `SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = $1 AND column_name = $2
    ) AS exists`,
    [table, column],
  );

  const exists = Boolean(result.rows[0]?.exists);
  cache.set(key, exists);
  return exists;
};
