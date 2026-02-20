export type ProfileVisibility = "public" | "members" | "private";

export type Settings = {
  bioSnippet: string;
  emailUpdates: boolean;
  commentAlerts: boolean;
  weeklyDigest: boolean;
  readingFocus: boolean;
  autoSave: boolean;
  profileVisibility: ProfileVisibility;
  allowProfileDiscovery: boolean;
};

export type SettingsResponse = {
  settings: Settings;
  isAdmin: boolean;
};

export type UpdateSettingsInput = Settings;

export type FakeImportResult = {
  categories: number;
  stories: number;
  poems: number;
  series: number;
  episodes: number;
};

