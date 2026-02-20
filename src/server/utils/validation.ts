export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const normalizeOptionalString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
};

export const normalizeUsername = (value: string | null | undefined) => {
  if (!value) return null;
  const cleaned = value.trim().toLowerCase().replace(/\s+/g, "");
  return cleaned.length > 0 ? cleaned : null;
};
