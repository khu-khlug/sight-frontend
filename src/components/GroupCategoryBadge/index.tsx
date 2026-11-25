import { Badge } from "@chakra-ui/react";
import { LucideIcon, BookOpen, CodeXml, FileText, School, UsersRound, Wrench } from "lucide-react";

import { GroupCategory, GroupCategoryLabel } from "../../constant";

// ScheduleCategoryBadge(src/components/ScheduleCategoryBadge)와 같은 패턴: 카테고리별 고정 색.
const GROUP_CATEGORY_PALETTE: Record<GroupCategory, string> = {
  [GroupCategory.STUDY]: "yellow",
  [GroupCategory.PROJECT]: "orange",
  [GroupCategory.DOCUMENTATION]: "green",
  [GroupCategory.MANAGE]: "purple",
  [GroupCategory.EDUCATION]: "blue",
  [GroupCategory.PROGRAM]: "cyan",
};

export const GROUP_CATEGORY_ICON: Record<GroupCategory, LucideIcon> = {
  [GroupCategory.STUDY]: BookOpen,
  [GroupCategory.PROJECT]: CodeXml,
  [GroupCategory.DOCUMENTATION]: FileText,
  [GroupCategory.MANAGE]: Wrench,
  [GroupCategory.EDUCATION]: School,
  [GroupCategory.PROGRAM]: UsersRound,
};

type Props = {
  category: GroupCategory;
};

export default function GroupCategoryBadge({ category }: Props) {
  const Icon = GROUP_CATEGORY_ICON[category];
  return (
    <Badge colorPalette={GROUP_CATEGORY_PALETTE[category]} size="sm">
      <Icon size={16} />
      {GroupCategoryLabel[category]}
    </Badge>
  );
}
