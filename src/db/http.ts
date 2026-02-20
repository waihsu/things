import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

export const db = drizzle(databaseUrl);

type QueryResult<T> = {
  rows: T[];
  rowCount: number;
};

const TX_COMMANDS = new Set(["BEGIN", "COMMIT", "ROLLBACK"]);

const buildSql = (text: string, params: unknown[]) => {
  if (!params.length) {
    return sql.raw(text);
  }

  const chunks: any[] = [];
  const pattern = /\$(\d+)/g;
  let cursor = 0;

  for (const match of text.matchAll(pattern)) {
    const token = match[0];
    const idx = Number(match[1]);
    const start = match.index ?? -1;

    if (start < 0) continue;
    if (start > cursor) {
      chunks.push(sql.raw(text.slice(cursor, start)));
    }

    if (!Number.isInteger(idx) || idx < 1 || idx > params.length) {
      throw new Error(`Invalid SQL placeholder ${token} in query`);
    }
    chunks.push(sql.param(params[idx - 1]));
    cursor = start + token.length;
  }

  if (cursor < text.length) {
    chunks.push(sql.raw(text.slice(cursor)));
  }

  return sql.join(chunks);
};

export async function query<
  T extends Record<string, unknown> = Record<string, unknown>,
>(text: string, params: unknown[] = []): Promise<QueryResult<T>> {
  const command = text.trim().toUpperCase();

  // neon-http doesn't keep transaction session state across separate calls.
  if (TX_COMMANDS.has(command)) {
    return { rows: [], rowCount: 0 };
  }

  const statement = buildSql(text, params);
  const result = await db.execute<T>(statement);
  return {
    rows: result.rows,
    rowCount: result.rowCount ?? result.rows.length,
  };
}
