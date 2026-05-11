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
  뒷풀이: { bg: "#ffffff00", color: "#ed64a688", border: "2px solid #ed64a688" },
  학사:   { bg: "#ffffff00", color: "#981E3288", border: "2px solid #981E3288" },
  기타:   { bg: "#ffffff00", color: "#22222288", border: "2px solid #22222288" },
  그룹활동: { bg: "#ffffff00", color: "#0077b688", border: "2px solid #0077b688" },
  동아리: { bg: "#ffffff00", color: "#1ab1ff88", border: "2px solid #1ab1ff88" },
  운영:   { bg: "#ffffff00", color: "#C9A84C88", border: "2px solid #C9A84C88" },
  외부:   { bg: "#ffffff00", color: "#7c3aed88", border: "2px solid #7c3aed88" },
  일정없음: { bg: "#ffffff00", color: "#9ca3af88", border: "2px solid #9ca3af88" },
  세미나: { bg: "#ffffff00", color: "#16a34a88", border: "2px solid #16a34a88" },
};

type Props = {
  category: ScheduleCategory;
};

export default function ScheduleCategoryBadge({ category }: Props) {
  const { bg, color, border } = CATEGORY_STYLE[category];
  return (
    <chakra.span
      display="inline-block"
      alignSelf="flex-start"
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
