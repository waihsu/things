import { query } from "@/src/db/http";

export type EpisodeRow = {
  id: string;
  name: string;
  serie_id: string;
  paragraph: string;
  order: number | null;
  created_at: string;
  updated_at: string;
  series_name: string | null;
  series_user_id: string | null;
};

export const episodesRepository = {
  async list(seriesId?: string) {
    const result = await query<EpisodeRow>(
      `SELECT
        e.id,
        e.name,
        e.serie_id,
        e.paragraph,
        e."order",
        e.created_at,
        e.updated_at,
        s.name AS series_name,
        s.user_id AS series_user_id
      FROM episodes e
      LEFT JOIN series s ON s.id = e.serie_id
      ${seriesId ? "WHERE e.serie_id = $1" : ""}
      ORDER BY e."order" ASC, e.created_at ASC`,
      seriesId ? [seriesId] : [],
    );
    return result.rows;
  },

  async findById(id: string) {
    const result = await query<EpisodeRow>(
      `SELECT
        e.id,
        e.name,
        e.serie_id,
        e.paragraph,
        e."order",
        e.created_at,
        e.updated_at,
        s.name AS series_name,
        s.user_id AS series_user_id
      FROM episodes e
      LEFT JOIN series s ON s.id = e.serie_id
      WHERE e.id = $1`,
      [id],
    );
    return result.rows[0] ?? null;
  },

  async findSeriesOwner(seriesId: string) {
    const result = await query<{ user_id: string }>(
      `SELECT user_id FROM series WHERE id = $1`,
      [seriesId],
    );
    return result.rows[0] ?? null;
  },

  async findEpisodeOwner(episodeId: string) {
    const result = await query<{ user_id: string }>(
      `SELECT s.user_id
       FROM episodes e
       JOIN series s ON s.id = e.serie_id
       WHERE e.id = $1`,
      [episodeId],
    );
    return result.rows[0] ?? null;
  },

  async create(input: {
    id: string;
    name: string;
    seriesId: string;
    paragraph: string;
    order: number;
  }) {
    await query(
      `INSERT INTO episodes (id, name, serie_id, paragraph, "order")
       VALUES ($1, $2, $3, $4, $5)`,
      [input.id, input.name, input.seriesId, input.paragraph, input.order],
    );
  },

  async update(input: {
    id: string;
    name: string;
    paragraph: string;
    order: number;
  }) {
    await query(
      `UPDATE episodes
       SET name = $1,
           paragraph = $2,
           "order" = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [input.name, input.paragraph, input.order, input.id],
    );
  },

  async remove(id: string) {
    await query(`DELETE FROM episodes WHERE id = $1`, [id]);
  },
};
