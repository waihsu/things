import { db } from "@/src/db/http";
import { sql } from "drizzle-orm";

export type CategoryRow = {
  id: string;
  name: string;
};

export const categoriesRepository = {
  async listActive() {
    const result = await db.execute<CategoryRow>(sql`
      SELECT id, name
      FROM categories
      WHERE is_archived = false
      ORDER BY name ASC
    `);
    return result.rows;
  },
};
