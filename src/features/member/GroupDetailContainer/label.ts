export const LABEL_COLORS = [
  "red",
  "yellow",
  "green",
  "blue",
  "purple",
  "lightGray",
  "gray",
  "black",
] as const;
export type LabelColor = (typeof LABEL_COLORS)[number];

// 각 라벨 색의 대표(중간 톤) hex — 필요하면 이 맵만 바꾸면 된다.
export const LABEL_COLOR_HEX: Record<LabelColor, string> = {
  red: "#F42222",
  yellow: "#FAD000",
  green: "green.500",
  blue: "blue.500",
  purple: "purple.500",
  lightGray: "gray.300",
  gray: "gray.400",
  black: "black",
};

export const LABEL_COLOR_NAME: Record<LabelColor, string> = {
  red: "적색",
  yellow: "황색",
  green: "녹색",
  blue: "청색",
  purple: "자색",
  lightGray: "연한 회색",
  gray: "회색",
  black: "검정",
};

// 라벨 필터 토글의 키 — 8가지 라벨 색 + "라벨이 아예 없는 카드"를 나타내는 별도 키.
export const NO_LABEL_FILTER_KEY = "none" as const;
export type LabelFilterKey = LabelColor | typeof NO_LABEL_FILTER_KEY;
export const LABEL_FILTER_KEYS: LabelFilterKey[] = [...LABEL_COLORS, NO_LABEL_FILTER_KEY];

// 카드 하나의 라벨들과 현재 켜진 필터를 보고, 칸반 상에서 어둡게 보여야 하는지 계산한다.
// 라벨이 없는 카드는 "라벨없음(X)" 토글로, 라벨이 있는 카드는 그 라벨 색들로 판단한다.
export function isCardDimmed(labels: LabelColor[], enabledFilters: Set<LabelFilterKey>): boolean {
  if (labels.length === 0) {
    return !enabledFilters.has(NO_LABEL_FILTER_KEY);
  }
  return labels.some((color) => !enabledFilters.has(color));
}
