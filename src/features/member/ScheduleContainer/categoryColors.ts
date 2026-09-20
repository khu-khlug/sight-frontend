export const CATEGORY_COLOR: Record<string, string> = {
  CLUB: "#00a0e9",
  ACADEMIC: "#dc2626",
  EXTERNAL: "#ea33bc",
  MANAGEMENT: "#9333ea",
  GROUP_ACTIVITY: "#16a34a",
  BIG_SEMINAR: "#005a8c",
  AFTERPARTY: "#ca8a04",
  OTHER: "#6b7280",
};

export function getCategoryColor(category: string): string {
  return CATEGORY_COLOR[category] ?? "#9ca3af";
}
