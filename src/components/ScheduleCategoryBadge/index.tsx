import { chakra } from "@chakra-ui/react";

export type ScheduleCategory =
  | "동아리"
  | "학사"
  | "외부"
  | "운영"
  | "세미나"
  | "그룹활동"
  | "뒷풀이"
  | "기타"
  | "일정없음";

const CATEGORY_STYLE: Record<
  ScheduleCategory,
  { bg: string; color: string; border?: string }
> = {
  뒷풀이: {
    bg: "#ffffff00",
    color: "var(--chakra-colors-pink-500)",
    border: "2px solid var(--chakra-colors-pink-500)",
  },
  학사: { bg: "#ffffff00", color: "#981E32", border: "2px solid #981E32" },
  기타: { bg: "#ffffff00", color: "#222222", border: "2px solid #222222" },
  그룹활동: {
    bg: "#ffffff00",
    color: "var(--chakra-colors-brand-600)",
    border: "2px solid var(--chakra-colors-brand-600)",
  },
  동아리: {
    bg: "#ffffff00",
    color: "var(--chakra-colors-brand-400)",
    border: "2px solid var(--chakra-colors-brand-400)",
  },
  운영: {
    bg: "#ffffff00",
    color: "#C9A84C",
    border: "2px solid #C9A84C",
  }, //C9A84C
  외부: { bg: "#ffffff00", color: "#7c3aed", border: "2px solid #7c3aed" },
  일정없음: { bg: "#ffffff00", color: "#9ca3af", border: "2px solid #9ca3af" },
  세미나: { bg: "#ffffff00", color: "#16a34a", border: "2px solid #16a34a" },
};

type Props = {
  category: ScheduleCategory;
};

export default function ScheduleCategoryBadge({ category }: Props) {
  const { bg, color, border } = CATEGORY_STYLE[category];
  return (
    <chakra.span
      display="inline-block"
      px={2}
      py="2px"
      borderRadius="full"
      fontSize="sm"
      fontWeight="bold"
      alignContent="center"
      style={{ backgroundColor: bg, color, border }}
    >
      {category}
    </chakra.span>
  );
}
