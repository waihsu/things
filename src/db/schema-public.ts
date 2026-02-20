import {
  pgTable,
  pgEnum,
  varchar,
  text,
  timestamp,
  date,
  boolean,
  integer,
  numeric,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";
import { user } from "./schema-private";

export const userPublic = pgTable("userPublic", {
  id: text("id").primaryKey(),
  name: text("name"),
  username: text("username"),
  image: text("image"),
  joinedAt: timestamp("joinedAt", { mode: "string" }).defaultNow().notNull(),
});

export const userState = pgTable("userState", {
  userId: text("userId").primaryKey(),
  darkMode: boolean("darkMode").notNull().default(false),
});

export const userSettings = pgTable("user_settings", {
  user_id: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  bio_snippet: text("bio_snippet"),
  email_updates: boolean("email_updates").notNull().default(true),
  comment_alerts: boolean("comment_alerts").notNull().default(true),
  weekly_digest: boolean("weekly_digest").notNull().default(false),
  reading_focus: boolean("reading_focus").notNull().default(true),
  auto_save: boolean("auto_save").notNull().default(true),
  profile_visibility: varchar("profile_visibility", { length: 20 })
    .notNull()
    .default("public"),
  allow_profile_discovery: boolean("allow_profile_discovery")
    .notNull()
    .default(true),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// ----------- Profiles -----------
export const profiles = pgTable("profiles", {
  id: varchar("id", { length: 36 }).primaryKey(),
  user_id: varchar("user_id", { length: 36 })
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  phone_number: varchar("phone_number", { length: 20 }),
  street: varchar("street", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  zip_code: varchar("zip_code", { length: 20 }),
  country: varchar("country", { length: 100 }),
  bio: text("bio"),
  avatarUrl: varchar("avatar_url", { length: 255 }),
  urls: text("urls"), // JSON string array
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ----------- Categories -----------
export const categories = pgTable("categories", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  isArchived: boolean("is_archived").default(false).notNull(),
});

// ----------- ShortStories -----------
export const shortStories = pgTable("short_stories", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  summary: text("summary"),
  user_id: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  read_count: integer("read_count").default(0).notNull(),
  is_banned: boolean("is_banned").notNull().default(false),
  banned_at: timestamp("banned_at"),
  banned_reason: text("banned_reason"),
  banned_by: varchar("banned_by", { length: 36 }).references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ----------- Poems -----------
export const poems = pgTable(
  "poems",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    summary: text("summary"),
    content: text("content").notNull(),
    user_id: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    read_count: integer("read_count").default(0).notNull(),
    is_banned: boolean("is_banned").notNull().default(false),
    banned_at: timestamp("banned_at"),
    banned_reason: text("banned_reason"),
    banned_by: varchar("banned_by", { length: 36 }).references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("poems_user_id_idx").on(table.user_id),
  }),
);

// ----------- PoemCategories (Many-to-Many) -----------
export const poemCategories = pgTable(
  "poem_categories",
  {
    poem_id: varchar("poem_id", { length: 36 })
      .notNull()
      .references(() => poems.id, { onDelete: "cascade" }),
    category_id: varchar("category_id", { length: 36 })
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey(table.poem_id, table.category_id),
  }),
);

// ----------- PoemTags -----------
export const poemTags = pgTable(
  "poem_tags",
  {
    poem_id: varchar("poem_id", { length: 36 })
      .notNull()
      .references(() => poems.id, { onDelete: "cascade" }),
    tag: varchar("tag", { length: 60 }).notNull(),
  },
  (table) => ({
    pk: primaryKey(table.poem_id, table.tag),
  }),
);

// ----------- Series -----------
export const series = pgTable("series", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  summary: text("summary"),
  user_id: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  read_count: integer("read_count").default(0).notNull(),
  is_banned: boolean("is_banned").notNull().default(false),
  banned_at: timestamp("banned_at"),
  banned_reason: text("banned_reason"),
  banned_by: varchar("banned_by", { length: 36 }).references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ----------- Episodes -----------
export const episodes = pgTable("episodes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  serie_id: varchar("serie_id", { length: 36 })
    .notNull()
    .references(() => series.id, { onDelete: "cascade" }),
  paragraph: text("paragraph").notNull(),
  order: integer("order").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ----------- Comments -----------
export const comments = pgTable("comments", {
  id: varchar("id", { length: 36 }).primaryKey(),
  user_id: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  story_id: varchar("story_id", { length: 36 }).references(
    () => shortStories.id,
    { onDelete: "cascade" },
  ),
  series_id: varchar("series_id", { length: 36 }).references(() => series.id, {
    onDelete: "cascade",
  }),
  episode_id: varchar("episode_id", { length: 36 }).references(
    () => episodes.id,
    { onDelete: "cascade" },
  ),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ----------- Likes -----------
export const likes = pgTable("likes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  user_id: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  story_id: varchar("story_id", { length: 36 }).references(
    () => shortStories.id,
    { onDelete: "cascade" },
  ),
  series_id: varchar("series_id", { length: 36 }).references(() => series.id, {
    onDelete: "cascade",
  }),
  episode_id: varchar("episode_id", { length: 36 }).references(
    () => episodes.id,
    { onDelete: "cascade" },
  ),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ----------- Public Chat -----------
export const chatMessages = pgTable(
  "chat_messages",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    user_id: varchar("user_id", { length: 255 }).references(() => user.id, {
      onDelete: "set null",
    }),
    user_name: varchar("user_name", { length: 100 }).notNull(),
    user_avatar: text("user_avatar"),
    user_username: varchar("user_username", { length: 200 }),
    is_guest: boolean("is_guest").notNull().default(false),
    content: text("content").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    createdAtIdx: index("chat_messages_created_at_idx").on(
      table.created_at,
      table.id,
    ),
  }),
);

// ----------- StoryCategories (Many-to-Many) -----------
export const storyCategories = pgTable(
  "story_categories",
  {
    story_id: varchar("story_id", { length: 36 })
      .notNull()
      .references(() => shortStories.id, { onDelete: "cascade" }),
    category_id: varchar("category_id", { length: 36 })
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey(table.story_id, table.category_id),
  }),
);

// ----------- SeriesCategories (Many-to-Many) -----------
export const seriesCategories = pgTable(
  "series_categories",
  {
    series_id: varchar("series_id", { length: 36 })
      .notNull()
      .references(() => series.id, { onDelete: "cascade" }),
    category_id: varchar("category_id", { length: 36 })
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey(table.series_id, table.category_id),
  }),
);
