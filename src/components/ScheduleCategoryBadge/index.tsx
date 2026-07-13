import { Badge } from "@chakra-ui/react";

export type ScheduleCategory =
  | "동아리"
  | "학사"
  | "외부"
  | "운영"
  | "총회"
  | "그룹활동"
  | "뒷풀이"
  | "기타"
  | "일정없음";

const CATEGORY_CODE_TO_LABEL: Record<string, ScheduleCategory> = {
  CLUB: "동아리",
  ACADEMIC: "학사",
  EXTERNAL: "외부",
  MANAGEMENT: "운영",
  GROUP_ACTIVITY: "그룹활동",
  BIG_SEMINAR: "총회",
  AFTERPARTY: "뒷풀이",
  OTHER: "기타",
};

const CATEGORY_PALETTE: Record<ScheduleCategory, string> = {
  동아리: "blue",
  학사: "red",
  외부: "pink",
  운영: "purple",
  그룹활동: "green",
  총회: "blue",
  뒷풀이: "yellow",
  기타: "gray",
  일정없음: "gray",
};

type Props = {
  category: ScheduleCategory | string;
};

export default function ScheduleCategoryBadge({ category }: Props) {
  const label = (CATEGORY_CODE_TO_LABEL[category] ?? category) as ScheduleCategory;
  return (
    <Badge colorPalette={CATEGORY_PALETTE[label] ?? "gray"} size="sm">
      {label}
    </Badge>
  );
}
