import { Badge } from "@chakra-ui/react";
import { LucideIcon, Check, Play, Pause, X } from "lucide-react";

import { GroupStatus, GroupStatusLabel } from "../../constant";

// 초록(진행)-주황(중단, 주의)-파랑(성공 종료)-빨강(실패 종료) 순으로 직관적인 색을 매핑한다.
const GROUP_STATUS_PALETTE: Record<GroupStatus, string> = {
  [GroupStatus.PROGRESS]: "blue",
  [GroupStatus.STOP]: "orange",
  [GroupStatus.SUCCESS]: "green",
  [GroupStatus.FAIL]: "red",
};

export const GROUP_STATUS_ICON: Record<GroupStatus, LucideIcon> = {
  [GroupStatus.PROGRESS]: Play,
  [GroupStatus.STOP]: Pause,
  [GroupStatus.SUCCESS]: Check,
  [GroupStatus.FAIL]: X,
};

type Props = {
  status: GroupStatus;
};

export default function GroupStatusBadge({ status }: Props) {
  const Icon = GROUP_STATUS_ICON[status];
  return (
    <Badge colorPalette={GROUP_STATUS_PALETTE[status]} size="sm">
      <Icon size={ 16 } />
      {GroupStatusLabel[status]}
    </Badge>
  );
}
