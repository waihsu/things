import "dotenv/config";

import { query } from "./src/db/http";

const categories = [
  { id: "1b2d2a90-0c2f-4b6f-9d47-5b3b4c0c8a01", name: "Fantasy" },
  { id: "2f1f1a1e-6a0d-4f2a-8f5e-0b6b2d4a9c02", name: "Sci-Fi" },
  { id: "3c0f2b3a-9d3d-4a14-9a76-2d8a4f2c1e03", name: "Romance" },
  { id: "4a5d0e6b-5f4a-4b2c-8d9e-1c2a3b4d5e04", name: "Mystery" },
  { id: "5e9a1b2c-1f2a-4c3d-8e9f-0a1b2c3d4e05", name: "Horror" },
  { id: "6d3c2b1a-7f6e-4d5c-9b8a-2c1d0e9f8a06", name: "Thriller" },
  { id: "7a8b9c0d-1e2f-4a3b-8c9d-0e1f2a3b4c07", name: "Adventure" },
  { id: "8c7b6a5d-4e3f-2a1b-9d8c-7e6f5a4b3c08", name: "Slice of Life" },
];


async function seed() {
  try {
    const categoryValues = categories.flatMap((c) => [c.id, c.name, false]);
    const categoryPlaceholders = categories
      .map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`)
      .join(", ");

    await query(
      `INSERT INTO categories (id, name, is_archived)
       VALUES ${categoryPlaceholders}
       ON CONFLICT (id) DO NOTHING`,
      categoryValues,
    );
    console.log("Seeding complete.");
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  }
}

await seed();
