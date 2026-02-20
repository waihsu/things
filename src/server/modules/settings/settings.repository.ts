import { query } from "@/src/db/http";
import { randomFeedCache } from "@/src/server/lib/random-feed-cache";

export type SettingsRow = {
  user_id: string;
  bio_snippet: string | null;
  email_updates: boolean;
  comment_alerts: boolean;
  weekly_digest: boolean;
  reading_focus: boolean;
  auto_save: boolean;
  profile_visibility: string;
  allow_profile_discovery: boolean;
  created_at: string;
  updated_at: string;
};

export type SettingsInput = {
  bio_snippet: string | null;
  email_updates: boolean;
  comment_alerts: boolean;
  weekly_digest: boolean;
  reading_focus: boolean;
  auto_save: boolean;
  profile_visibility: "public" | "members" | "private";
  allow_profile_discovery: boolean;
};

type SeedSummary = {
  categories: number;
  stories: number;
  poems: number;
  series: number;
  episodes: number;
};

let ensureSettingsTablePromise: Promise<void> | null = null;

const ensureSettingsTable = async () => {
  if (!ensureSettingsTablePromise) {
    ensureSettingsTablePromise = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS user_settings (
          user_id text PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
          bio_snippet text,
          email_updates boolean NOT NULL DEFAULT true,
          comment_alerts boolean NOT NULL DEFAULT true,
          weekly_digest boolean NOT NULL DEFAULT false,
          reading_focus boolean NOT NULL DEFAULT true,
          auto_save boolean NOT NULL DEFAULT true,
          profile_visibility varchar(20) NOT NULL DEFAULT 'public',
          allow_profile_discovery boolean NOT NULL DEFAULT true,
          created_at timestamp NOT NULL DEFAULT NOW(),
          updated_at timestamp NOT NULL DEFAULT NOW()
        )
      `);
    })().catch((error) => {
      ensureSettingsTablePromise = null;
      throw error;
    });
  }

  await ensureSettingsTablePromise;
};

const buildSeedId = (prefix: string, seed: string, order: number) =>
  `${prefix}-${seed}-${String(order).padStart(4, "0")}`;

export const settingsRepository = {
  async findByUserId(userId: string) {
    await ensureSettingsTable();
    const result = await query<SettingsRow>(
      `SELECT
         user_id,
         bio_snippet,
         email_updates,
         comment_alerts,
         weekly_digest,
         reading_focus,
         auto_save,
         profile_visibility,
         allow_profile_discovery,
         created_at,
         updated_at
       FROM user_settings
       WHERE user_id = $1`,
      [userId],
    );
    return result.rows[0] ?? null;
  },

  async upsert(userId: string, input: SettingsInput) {
    await ensureSettingsTable();
    const result = await query<SettingsRow>(
      `INSERT INTO user_settings (
         user_id,
         bio_snippet,
         email_updates,
         comment_alerts,
         weekly_digest,
         reading_focus,
         auto_save,
         profile_visibility,
         allow_profile_discovery
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (user_id) DO UPDATE SET
         bio_snippet = EXCLUDED.bio_snippet,
         email_updates = EXCLUDED.email_updates,
         comment_alerts = EXCLUDED.comment_alerts,
         weekly_digest = EXCLUDED.weekly_digest,
         reading_focus = EXCLUDED.reading_focus,
         auto_save = EXCLUDED.auto_save,
         profile_visibility = EXCLUDED.profile_visibility,
         allow_profile_discovery = EXCLUDED.allow_profile_discovery,
         updated_at = NOW()
       RETURNING
         user_id,
         bio_snippet,
         email_updates,
         comment_alerts,
         weekly_digest,
         reading_focus,
         auto_save,
         profile_visibility,
         allow_profile_discovery,
         created_at,
         updated_at`,
      [
        userId,
        input.bio_snippet,
        input.email_updates,
        input.comment_alerts,
        input.weekly_digest,
        input.reading_focus,
        input.auto_save,
        input.profile_visibility,
        input.allow_profile_discovery,
      ],
    );

    return result.rows[0] ?? null;
  },

  async importFakeData(userId: string): Promise<SeedSummary> {
    await query(`
      CREATE TABLE IF NOT EXISTS story_categories (
        story_id varchar(36) NOT NULL REFERENCES short_stories(id) ON DELETE CASCADE,
        category_id varchar(36) NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        PRIMARY KEY (story_id, category_id)
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS series_categories (
        series_id varchar(36) NOT NULL REFERENCES series(id) ON DELETE CASCADE,
        category_id varchar(36) NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        PRIMARY KEY (series_id, category_id)
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS poem_categories (
        poem_id varchar(36) NOT NULL REFERENCES poems(id) ON DELETE CASCADE,
        category_id varchar(36) NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        PRIMARY KEY (poem_id, category_id)
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS poem_tags (
        poem_id varchar(36) NOT NULL REFERENCES poems(id) ON DELETE CASCADE,
        tag varchar(60) NOT NULL,
        PRIMARY KEY (poem_id, tag)
      )
    `);

    const seed = userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) || "demo0000";

    const categories = [
      { id: "d4fa7294-1161-4eb3-b4fa-85f60fcd1001", name: "ကဗျာ" },
      { id: "d4fa7294-1161-4eb3-b4fa-85f60fcd1002", name: "ဒိုင်ယာရီ" },
      { id: "d4fa7294-1161-4eb3-b4fa-85f60fcd1003", name: "မှတ်တမ်း" },
    ];

    for (const item of categories) {
      await query(
        `INSERT INTO categories (id, name, is_archived)
         VALUES ($1, $2, false)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           is_archived = false`,
        [item.id, item.name],
      );
    }

    const poetryCategoryId = categories[0]?.id;
    const journalCategoryId = categories[1]?.id;
    const memoirCategoryId = categories[2]?.id;
    if (!poetryCategoryId || !journalCategoryId || !memoirCategoryId) {
      throw new Error("Missing default category ids for fake data import");
    }

    const stories = [
      {
        id: buildSeedId("story", seed, 1),
        title: "မိုးရေထဲက နီယွန်လမ်း",
        summary: "ညနက်ပိုင်း မြို့လမ်းလျှောက်ခရီးက အမှတ်တရမြေပုံဖြစ်သွားတဲ့အကြောင်း",
        content:
          "မိုးက မကျသလိုပါပဲ၊ လေထဲမှာပဲ လွင့်နေတယ်။\nလမ်းဘေးကြော်ငြာမီးတိုင်တစ်တိုင်စီကို ထိတိုင်း အရောင်တွေကျဲသွားတယ်။\nထီးမပါဘဲ လမ်းလျှောက်ရင်း မိတ်ဆွေဟောင်းစကားသံတွေကို မီးတိုင်တောက်တောက်အောက်မှာ ပြန်တွေ့ခဲ့တယ်။",
        readCount: 268,
        categoryIds: [poetryCategoryId, journalCategoryId],
      },
      {
        id: buildSeedId("story", seed, 2),
        title: "အင်းယားကန်နား စက္ကူလှေ",
        summary: "ကလေးဘဝဆန္ဒစာတွေကို စက္ကူလှေအဖြစ်ခေါက်ပြီး နေဝင်ချိန်ဆီ လွှတ်လိုက်တဲ့နေ့",
        content:
          "မှတ်စုစာအုပ်ဟောင်းက စာမျက်နှာတွေထဲမှာ ဆန္ဒတွေကို ရေးထားခဲ့ကြတယ်။\nကန်နားရောက်တော့ စက္ကူလှေလေးတွေခေါက်ပြီး ရေမျက်နှာပြင်ပေါ် တင်လိုက်တယ်။\nတချို့က နီးနီးလေးမှာပဲ နစ်သွားတယ်၊ တချို့က အဝေးကို ဆက်လွင့်သွားတယ်။",
        readCount: 214,
        categoryIds: [journalCategoryId],
      },
      {
        id: buildSeedId("story", seed, 3),
        title: "သံလမ်းဘေး မနက်ခင်း",
        summary: "ရထားမလာခင် တိတ်ဆိတ်နေတဲ့စက္ကန့်တွေကို နားထောင်မိခဲ့တဲ့မနက်",
        content:
          "ရထားလာမယ့်အချိန်မနီးခင် သံလမ်းဘေးက တိတ်ဆိတ်မှုက ထူးထူးခြားခြားကြီး။\nလက်ဖက်ရည်ခွက်ထဲက အငွေ့တက်သံကိုတောင် ကြားရသလို ဖြစ်တယ်။\nလှမ်းလာတဲ့လူတိုင်းမှာ သူ့ကိုယ်ပိုင်ခရီးတစ်ခုစီ ရှိနေကြတယ်။",
        readCount: 193,
        categoryIds: [journalCategoryId, memoirCategoryId],
      },
      {
        id: buildSeedId("story", seed, 4),
        title: "မိုးဦးညရဲ့ ဘတ်စ်ကားဂိတ်",
        summary: "မပြည့်စုံသေးတဲ့အိပ်မက်တွေကို ခရီးသည်လို စောင့်နေကြတဲ့ည",
        content:
          "ဘတ်စ်ကားဂိတ်ထဲမှာ လူတွေအများကြီးရှိပေမယ့် တစ်ယောက်ယောက်ရဲ့စကားက တစ်ယောက်ယောက်ကို မထိဘူး။\nမိုးရေစက်တချို့က ခုံတန်းပေါ် တောက်တောက်ဆင်းတယ်။\nအိမ်ပြန်လမ်းကို စောင့်နေသလို အိပ်မက်တချို့ကိုလည်း စောင့်နေတာပဲ။",
        readCount: 221,
        categoryIds: [poetryCategoryId, memoirCategoryId],
      },
      {
        id: buildSeedId("story", seed, 5),
        title: "မန္တလေးညဈေး",
        summary: "မီးအိမ်ရောင်အောက်က လူနေအသက်ရှုသံတွေကို စာဖြစ်အောင်ရေးထားတဲ့မှတ်တမ်း",
        content:
          "ညဈေးတန်းက မီးအိမ်တွေ အပူအေးမညီဘူး။\nခေါက်ဆွဲသံ၊ ကြက်ဥကြော်သံ၊ စျေးဆိုင်ရှင်ရဲ့ခေါ်သံတွေ ပေါင်းပြီး တေးသံလိုဖြစ်နေတယ်။\nအဲ့ဒီညမှာ မြို့တစ်မြို့ဟာ အသက်ရှူနေတာကို အနီးကပ်မြင်ခဲ့တယ်။",
        readCount: 245,
        categoryIds: [journalCategoryId, memoirCategoryId],
      },
      {
        id: buildSeedId("story", seed, 6),
        title: "ရွှေတိဂုံဘေးက လေညင်း",
        summary: "ပြန်မပြောဖြစ်ခဲ့တဲ့စကားတွေကို လေထဲမှာ ချန်ထားခဲ့တဲ့ည",
        content:
          "ဘုရားလမ်းက လေညင်းက အမြဲတမ်းတူတူဖြစ်မယ်လို့ ထင်ခဲ့တယ်။\nဒါပေမယ့် အဲဒီညက လေညင်းထဲမှာ မပြောဖြစ်ခဲ့တဲ့စကားတွေ အများကြီးပေါက်ကွဲနေသလို။\nတချို့ဝါကျတွေကို အသံမထွက်ဘဲ စိတ်ထဲမှာပဲ အဆုံးသတ်လိုက်ရတယ်။",
        readCount: 207,
        categoryIds: [poetryCategoryId],
      },
      {
        id: buildSeedId("story", seed, 7),
        title: "တံတားအောက်က စာကြည့်ခန်း",
        summary: "မုန်တိုင်းနေ့တစ်နေ့မှာ စာအုပ်က လူတစ်ယောက်ကို ကယ်တင်ခဲ့ပုံ",
        content:
          "မိုးကြီးလာတော့ တံတားအောက်က စာကြည့်ခန်းလေးထဲ ဝင်မိတယ်။\nလက်ထဲရောက်လာတဲ့စာအုပ်က အခန်းတိုင်းမှာ ကိုယ့်ဘဝကို ပြန်ဖတ်မိသလို။\nပြင်ပလောကက ရေကြီးနေချိန်မှာ အတွင်းလောကက တည်ငြိမ်လာတယ်။",
        readCount: 186,
        categoryIds: [journalCategoryId, poetryCategoryId],
      },
      {
        id: buildSeedId("story", seed, 8),
        title: "သစ်ရွက်သံနဲ့ စာမက်ဇင်း",
        summary: "ဆောင်းဦးလေထဲက ရွက်ခြောက်သံတွေကြားမှ စာရေးခြင်းကို ပြန်တွေ့ခဲ့တာ",
        content:
          "စာမက်ဇင်းဟောင်းတစ်အုပ်ကို ဖွင့်လိုက်တာနဲ့ မင်နံ့ပဲမဟုတ်ဘဲ အချိန်နံ့တောင် ထွက်လာတယ်။\nပြတင်းပေါက်အပြင်မှာ သစ်ရွက်ခြောက်တွေ သွားလာသံထွက်နေတယ်။\nစာတစ်ကြောင်းရေးပြီးတိုင်း ကိုယ့်အသက်ရှုလှုပ်ရှားမှုပြန်ညီလာတယ်။",
        readCount: 174,
        categoryIds: [memoirCategoryId],
      },
      {
        id: buildSeedId("story", seed, 9),
        title: "မြို့အဟောင်းရဲ့ မျက်နှာစာ",
        summary: "ပျက်သွားတဲ့အဆောက်အအုံမျက်နှာစာတွေထဲက လူငယ်ဘဝအမှတ်တရများ",
        content:
          "နံရံအပေါ်က ဆေးအရောင်တွေ စုတ်ကွဲသွားပေမယ့် အမည်မသိလက်ရေးတွေတော့ ကျန်နေတယ်။\nလမ်းထောင့်တစ်နေရာတိုင်းမှာ သူငယ်ချင်းတစ်ယောက်စီရဲ့ရယ်သံတွေကို မှတ်မိနေတယ်။\nမြို့အဟောင်းဆိုတာ အဆောက်အအုံဟောင်းမဟုတ်ဘဲ အတွေးဟောင်းတွေပါ။",
        readCount: 232,
        categoryIds: [memoirCategoryId, journalCategoryId],
      },
      {
        id: buildSeedId("story", seed, 10),
        title: "မီးဖိုချောင်ထဲက နေရောင်",
        summary: "အိမ်လေးတစ်လုံးရဲ့ နေ့စဉ်အသံနဲ့ အပူချိန်က ဘဝကို ဘယ်လိုတည်ငြိမ်စေသလဲ",
        content:
          "မနက်ခင်းနေရောင်က မီးဖိုချောင်ပြတင်းပေါက်ကနေ ချောချောလိမ့်လိမ့်ဝင်လာတယ်။\nလက်ဖက်ရည်တစ်ခွက်ပူပူ၊ အမေ့အသံတစ်သံ၊ အနံ့တစ်ခုနဲ့တင် နေ့ရက်က စတင်သွားတယ်။\nတစ်ခါတလေ အကြီးစားအောင်မြင်မှုထက် ဒီတိတ်ဆိတ်မှုက ပိုတန်ဖိုးရှိတယ်။",
        readCount: 261,
        categoryIds: [journalCategoryId, poetryCategoryId],
      },
    ];

    for (const item of stories) {
      await query(
        `INSERT INTO short_stories (id, title, summary, content, user_id, read_count)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           summary = EXCLUDED.summary,
           content = EXCLUDED.content,
           user_id = EXCLUDED.user_id,
           read_count = EXCLUDED.read_count,
           updated_at = NOW()`,
        [
          item.id,
          item.title,
          item.summary,
          item.content,
          userId,
          item.readCount,
        ],
      );

      await query(`DELETE FROM story_categories WHERE story_id = $1`, [item.id]);
      for (const categoryId of item.categoryIds) {
        await query(
          `INSERT INTO story_categories (story_id, category_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [item.id, categoryId],
        );
      }
    }

    const poems = [
      {
        id: buildSeedId("poem", seed, 1),
        title: "နောက်ကျဘတ်စ်ကား၊ လမြန်လင်း",
        content:
          "ဘတ်စ်ကားက နောက်ကျတယ်၊\nလကတော့ အရင်ပေါ်လာတယ်၊\nအချိန်ဇယားနဲ့ တိတ်ဆိတ်မှုအကြားမှာ\nစောင့်ခြင်းရဲ့ တန်ဖိုးကို သင်ယူမိတယ်။",
        readCount: 301,
        categoryIds: [poetryCategoryId],
        tags: ["လ", "ည", "မြို့"],
      },
      {
        id: buildSeedId("poem", seed, 2),
        title: "လမ်းဘေးလက်ဖက်ရည်",
        content:
          "လက်ဖက်ရည်အငွေ့က မနက်ဆုတောင်းသံလိုတက်တယ်၊\nခွက်နှစ်ခွက်နဲ့ ခုံတန်းတစ်တန်းမှာ\nမြို့တစ်မြို့လုံးကို ပျော့ပျောင်းစေခဲ့တာက\nသကြားလား၊ စကားလား မသိတော့ဘူး။",
        readCount: 248,
        categoryIds: [journalCategoryId],
        tags: ["လက်ဖက်ရည်", "မနက်", "လမ်း"],
      },
      {
        id: buildSeedId("poem", seed, 3),
        title: "မှတ်စုစာအုပ်အနား",
        content:
          "စာမျက်နှာအနားမှာ နင့်နာမည်ရေးထားတယ်၊\nမမြင်အောင်သေးသေးလေး၊\nမပျောက်အောင်ခိုင်ခိုင်မာမာ၊\nစာမျက်နှာပြောင်းပြီးမှတောင် ကျန်ခဲ့တယ်။",
        readCount: 226,
        categoryIds: [poetryCategoryId, journalCategoryId],
        tags: ["မှတ်ဉာဏ်", "အချစ်", "တိတ်ဆိတ်"],
      },
      {
        id: buildSeedId("poem", seed, 4),
        title: "မိုးတံခါး",
        content:
          "တံခါးကိုဖွင့်လိုက်တိုင်း မိုးနံ့ဝင်လာတယ်၊\nလမ်းထောင့်ကအသံတွေ မျက်နှာပေါ်ကျလာတယ်၊\nနေ့ဟောင်းတွေကို သုတ်ဖယ်မရပေမယ့်\nအသစ်တစ်နေ့ကိုတော့ လက်ခံလို့ရတယ်။",
        readCount: 193,
        categoryIds: [poetryCategoryId],
        tags: ["မိုး", "တံခါး", "နေ့သစ်"],
      },
      {
        id: buildSeedId("poem", seed, 5),
        title: "ရထားလမ်းပေါ်က နေညို",
        content:
          "နေညိုရောင်က သံလမ်းပေါ်မှာ ချောသွားတယ်၊\nလူတွေရဲ့ခြေလှမ်းက မတူပေမယ့်\nအိမ်ပြန်ချင်တဲ့စိတ်က တူနေတယ်၊\nညမရောက်ခင် တစ်ခဏလေး တိတ်တိတ်နေရတယ်။",
        readCount: 207,
        categoryIds: [memoirCategoryId, poetryCategoryId],
        tags: ["နေညို", "ရထား", "အိမ်ပြန်"],
      },
      {
        id: buildSeedId("poem", seed, 6),
        title: "ကြယ်တစ်စင်းနဲ့ စကား",
        content:
          "ကြယ်တစ်စင်းကို ကြည့်ပြီး ပြောလိုက်တဲ့စကားက\nလေထဲမှာပဲ မပျောက်ခဲ့ဘူး၊\nအိပ်မက်ထဲထိ လိုက်ဝင်လာပြီး\nနောက်နေ့မနက်မှာ အမြဲတမ်းအဖြေတစ်ခုထားခဲ့တယ်။",
        readCount: 211,
        categoryIds: [poetryCategoryId],
        tags: ["ကြယ်", "အိပ်မက်", "စကား"],
      },
      {
        id: buildSeedId("poem", seed, 7),
        title: "ဖိနပ်ကြိုး",
        content:
          "ဖိနပ်ကြိုးတစ်ကြိုးချည်နေစဉ်\nအလျင်လိုလောကကို တစ်ခဏရပ်လိုက်တယ်၊\nလမ်းရှည်ကိုကြောက်သော်လည်း\nခြေလှမ်းတစ်လှမ်းကတော့ အမြဲတမ်းစလို့ရတယ်။",
        readCount: 167,
        categoryIds: [journalCategoryId],
        tags: ["ခြေလှမ်း", "လမ်း", "စတင်"],
      },
      {
        id: buildSeedId("poem", seed, 8),
        title: "ပြတင်းပေါက်နံနက်",
        content:
          "ပြတင်းပေါက်ကနေ နေရောင်တန်းတစ်ကြောင်းဝင်လာတယ်၊\nအိမ်အတွင်းဖုန်မှုန့်တွေတောင် ကြယ်လိုလင်းတယ်၊\nအရေးမပါသလိုထင်ခဲ့တဲ့အရာတွေက\nအသက်ရှိကြောင်း နေ့တိုင်းသက်သေပြတယ်။",
        readCount: 185,
        categoryIds: [journalCategoryId, memoirCategoryId],
        tags: ["နေရောင်", "ပြတင်းပေါက်", "နံနက်"],
      },
      {
        id: buildSeedId("poem", seed, 9),
        title: "အပြာရောင်စာရွက်",
        content:
          "အပြာရောင်စာရွက်တစ်ရွက်ပေါ်မှာ\nမပြောဖြစ်ခဲ့တဲ့ဝါကျတွေတင်ထားတယ်၊\nပို့မယ့်သူမရှိလို့ မပို့ဖြစ်ပေမယ့်\nရေးထားခြင်းတင်နဲ့ နှလုံးသားသက်သာသွားတယ်။",
        readCount: 178,
        categoryIds: [memoirCategoryId],
        tags: ["စာရွက်", "ဝါကျ", "သက်သာ"],
      },
      {
        id: buildSeedId("poem", seed, 10),
        title: "ညဘက်မီးတိုင်",
        content:
          "လမ်းမီးတိုင်အောက်မှာ အရိပ်နှစ်ခုတိုင်ခိုက်တယ်၊\nတစ်ခုက အတိတ်၊ တစ်ခုက ရှေ့ဆက်ခြင်း၊\nဘယ်ဟာကိုရွေးမလဲဆိုတာထက်\nခြေလှမ်းမရပ်ဖို့ပဲ အရေးကြီးတယ်။",
        readCount: 233,
        categoryIds: [poetryCategoryId, memoirCategoryId],
        tags: ["မီးတိုင်", "အတိတ်", "ရှေ့ဆက်"],
      },
    ];

    for (const item of poems) {
      await query(
        `INSERT INTO poems (id, title, content, user_id, read_count)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           content = EXCLUDED.content,
           user_id = EXCLUDED.user_id,
           read_count = EXCLUDED.read_count,
           updated_at = NOW()`,
        [item.id, item.title, item.content, userId, item.readCount],
      );

      await query(`DELETE FROM poem_categories WHERE poem_id = $1`, [item.id]);
      for (const categoryId of item.categoryIds) {
        await query(
          `INSERT INTO poem_categories (poem_id, category_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [item.id, categoryId],
        );
      }

      await query(`DELETE FROM poem_tags WHERE poem_id = $1`, [item.id]);
      for (const tag of item.tags) {
        await query(
          `INSERT INTO poem_tags (poem_id, tag)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [item.id, tag],
        );
      }
    }

    const series = [
      {
        id: buildSeedId("serie", seed, 1),
        name: "မနက်ခင်းမတိုင်ခင် စာများ",
        summary: "အိပ်မပျော်သောညတွေထဲက စာတိုများကို စုထားတဲ့စီးရီး",
        readCount: 178,
        categoryIds: [poetryCategoryId, memoirCategoryId],
      },
      {
        id: buildSeedId("serie", seed, 2),
        name: "မြို့တော်ရဲ့ မိုးသံမှတ်စု",
        summary: "မိုးရာသီမြို့တော်ရဲ့ လူသံလမ်းသံကို မှတ်တမ်းတင်ထားခြင်း",
        readCount: 196,
        categoryIds: [journalCategoryId],
      },
      {
        id: buildSeedId("serie", seed, 3),
        name: "လမ်းမပေါ်က အလင်းစက်",
        summary: "နေ့စဉ်ဘဝထဲက သေးငယ်တဲ့အလင်းရောင်တွေကို ရှာဖွေခြင်း",
        readCount: 167,
        categoryIds: [journalCategoryId, poetryCategoryId],
      },
      {
        id: buildSeedId("serie", seed, 4),
        name: "ရထားပြန်ခရီး",
        summary: "ပြန်လည်တွေ့ဆုံမှုနဲ့ ကွာဝေးမှုကြားက ခရီးရှည်မှတ်စု",
        readCount: 154,
        categoryIds: [memoirCategoryId],
      },
      {
        id: buildSeedId("serie", seed, 5),
        name: "ကမ်းနားညစာမေး",
        summary: "ကမ်းနားညတိတ်ဆိတ်မှုထဲက မေးခွန်းတွေကို ဖြေဆိုကြည့်ခြင်း",
        readCount: 149,
        categoryIds: [poetryCategoryId],
      },
      {
        id: buildSeedId("serie", seed, 6),
        name: "သတိရခြင်းစာအုပ်",
        summary: "နာမည်မပါသောအမှတ်တရများကို စုစည်းထားတဲ့အပိုင်းများ",
        readCount: 188,
        categoryIds: [memoirCategoryId, journalCategoryId],
      },
      {
        id: buildSeedId("serie", seed, 7),
        name: "ရာသီလေးပါး လူငယ်",
        summary: "ရာသီပြောင်းလဲမှုနဲ့တူတဲ့ လူငယ်ဘဝအခြေအနေများ",
        readCount: 163,
        categoryIds: [journalCategoryId],
      },
      {
        id: buildSeedId("serie", seed, 8),
        name: "အိမ်ပြန်လမ်းက စကားများ",
        summary: "အိမ်ပြန်လမ်းတိုင်းမှာ မပြောဖြစ်ခဲ့တဲ့စကားတွေ",
        readCount: 172,
        categoryIds: [memoirCategoryId, poetryCategoryId],
      },
      {
        id: buildSeedId("serie", seed, 9),
        name: "အိပ်မက်ခန်း ဆယ်ခန်း",
        summary: "အိပ်မက်နဲ့လက်တွေ့ကြားက တံခါးဆယ်ခုပြောပြသော စီးရီး",
        readCount: 201,
        categoryIds: [poetryCategoryId],
      },
      {
        id: buildSeedId("serie", seed, 10),
        name: "နောက်ဆုံးမီးတိုင်",
        summary: "ညအဆုံးမှာတောင် လမ်းပြပေးမယ့်အလင်းအကြောင်း",
        readCount: 215,
        categoryIds: [poetryCategoryId, journalCategoryId],
      },
    ];

    for (const item of series) {
      await query(
        `INSERT INTO series (id, name, summary, user_id, read_count)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           summary = EXCLUDED.summary,
           user_id = EXCLUDED.user_id,
           read_count = EXCLUDED.read_count,
           updated_at = NOW()`,
        [item.id, item.name, item.summary, userId, item.readCount],
      );

      await query(`DELETE FROM series_categories WHERE series_id = $1`, [item.id]);
      for (const categoryId of item.categoryIds) {
        await query(
          `INSERT INTO series_categories (series_id, category_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [item.id, categoryId],
        );
      }
    }

    const episodes = [
      {
        id: buildSeedId("ep", seed, 1),
        seriesId: buildSeedId("serie", seed, 1),
        name: "အပိုင်း ၁ - မိုးမတိုင်ခင်စာ",
        paragraph:
          "ညမအိပ်ခင် စာကြောင်းအနည်းငယ်ရေးထားရင် နက်ဖြန်နေ့က ပိုပေါ့ပါးလာတတ်တယ်ဆိုတာကို အဲဒီညမှာ သိလိုက်တယ်။",
        order: 1,
      },
      {
        id: buildSeedId("ep", seed, 2),
        seriesId: buildSeedId("serie", seed, 2),
        name: "အပိုင်း ၂ - မိုးသံထဲက မြို့",
        paragraph:
          "မိုးသံတွေကြားထဲမှာ မြို့တော်ရဲ့ အော်သံမကြီးတဲ့အသံတွေကို စတင်ကြားလာတယ်။ လူတိုင်းအလျင်လိုနေတယ်၊ ဒါပေမယ့် တစ်ယောက်ယောက်ကတော့ စောင့်နေဆဲ။",
        order: 1,
      },
      {
        id: buildSeedId("ep", seed, 3),
        seriesId: buildSeedId("serie", seed, 3),
        name: "အပိုင်း ၃ - အလင်းစက်",
        paragraph:
          "လမ်းမပေါ်က မီးတိုင်တစ်တိုင်စီမှာ ကိုယ့်ကို အားပေးနေတဲ့ဝါကျတစ်ကြောင်းစီ ရှိသလိုခံစားရတယ်။",
        order: 1,
      },
      {
        id: buildSeedId("ep", seed, 4),
        seriesId: buildSeedId("serie", seed, 4),
        name: "အပိုင်း ၄ - ပြန်လမ်း",
        paragraph:
          "ပြန်လာတဲ့ရထားခရီးမှာ ထိုင်ခုံဘေးလူမသိပေမယ့် သူ့ရဲ့မျက်နှာအေးချမ်းမှုက ကိုယ့်ကို စိတ်ချမ်းသာစေတယ်။",
        order: 1,
      },
      {
        id: buildSeedId("ep", seed, 5),
        seriesId: buildSeedId("serie", seed, 5),
        name: "အပိုင်း ၅ - ကမ်းနားမေးခွန်း",
        paragraph:
          "ရေမျက်နှာပြင်ကိုကြည့်ပြီး မေးတဲ့မေးခွန်းတွေက အဖြေမလိုဘဲ ကိုယ့်ကို ပြန်လှည့်ကြည့်ခိုင်းတဲ့မေးခွန်းတွေပါ။",
        order: 1,
      },
      {
        id: buildSeedId("ep", seed, 6),
        seriesId: buildSeedId("serie", seed, 6),
        name: "အပိုင်း ၆ - သတိရခြင်း",
        paragraph:
          "အမှတ်တရတွေက မဖျက်ရသေးတဲ့ဖိုင်မဟုတ်ဘဲ အချိန်တိုင်းအသစ်ဖတ်ရတဲ့စာမျက်နှာတွေဖြစ်နေတယ်။",
        order: 1,
      },
      {
        id: buildSeedId("ep", seed, 7),
        seriesId: buildSeedId("serie", seed, 7),
        name: "အပိုင်း ၇ - နွေ၊ မိုး၊ ဆောင်း",
        paragraph:
          "ရာသီပြောင်းသလို ကိုယ့်စိတ်လည်းပြောင်းတယ်။ ဒါပေမယ့် မပြောင်းဘဲကျန်တာက အနာဂတ်ကို မစွန့်ချင်တဲ့စိတ်ပဲ။",
        order: 1,
      },
      {
        id: buildSeedId("ep", seed, 8),
        seriesId: buildSeedId("serie", seed, 8),
        name: "အပိုင်း ၈ - အိမ်ပြန်လမ်း",
        paragraph:
          "အိမ်ပြန်လမ်းပေါ်မှာ မပြောဖြစ်တဲ့စကားတွေများလာပေမယ့် လမ်းကတော့ နေ့တိုင်းတူတူပဲ ပြန်ခေါ်နေတယ်။",
        order: 1,
      },
      {
        id: buildSeedId("ep", seed, 9),
        seriesId: buildSeedId("serie", seed, 9),
        name: "အပိုင်း ၉ - အိပ်မက်တံခါး",
        paragraph:
          "အိပ်မက်တစ်ခါတစ်လေ မဖြစ်နိုင်တာကို မပြောဘူး၊ အခုချိန် မစသေးတာကိုပဲ ပြန်ပြတတ်တယ်။",
        order: 1,
      },
      {
        id: buildSeedId("ep", seed, 10),
        seriesId: buildSeedId("serie", seed, 10),
        name: "အပိုင်း ၁၀ - နောက်ဆုံးမီးတိုင်",
        paragraph:
          "ညအချိန်ဆုံးနီးလာတဲ့အခါ လမ်းမီးတိုင်အလင်းက နည်းနည်းပဲ ကျန်တယ်။ အဲဒီနည်းနည်းကပဲ ရှေ့ဆက်ဖို့လုံလောက်တယ်။",
        order: 1,
      },
    ];

    for (const item of episodes) {
      await query(
        `INSERT INTO episodes (id, name, serie_id, paragraph, "order")
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           serie_id = EXCLUDED.serie_id,
           paragraph = EXCLUDED.paragraph,
           "order" = EXCLUDED."order",
           updated_at = NOW()`,
        [item.id, item.name, item.seriesId, item.paragraph, item.order],
      );
    }

    await Promise.all([
      randomFeedCache.replaceAll(
        "stories",
        stories.map((item) => item.id),
      ),
      randomFeedCache.replaceAll(
        "poems",
        poems.map((item) => item.id),
      ),
      randomFeedCache.replaceAll(
        "series",
        series.map((item) => item.id),
      ),
    ]);

    return {
      categories: categories.length,
      stories: stories.length,
      poems: poems.length,
      series: series.length,
      episodes: episodes.length,
    };
  },
};
