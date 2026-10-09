import { Box, Text } from "@chakra-ui/react";

import { GroupStatus, GroupStatusLabel } from "../../../../../constant";
import { useCurrentUser } from "../../../../../hooks/user/useCurrentUser";
import type { GroupInfo } from "../GroupInfo/types";
import type { OpenSeminarCohort } from "../GroupExposure/types";
import styles from "./style.module.css";

type Props = {
  info: GroupInfo;
  isPending: boolean;
  onInfoChange: (changes: Partial<GroupInfo>) => void;
  openCohort: OpenSeminarCohort | null;
  onOpenCohortChange: (cohort: OpenSeminarCohort | null) => void;
  // 그룹에 속한 값이 아니라 현재 사용자(전역) 값이라 info가 아닌 별도 prop으로 받는다.
  isManager: boolean;
  isManagerPending: boolean;
  onManagerChange: (manager: boolean) => void;
};

const DEFAULT_COHORT: OpenSeminarCohort = {
  id: "development-seminar",
  seminarDate: new Date(new Date().getFullYear(), 11, 1).toISOString(),
  year: new Date().getFullYear(),
  isSummerSeason: false,
  isSpeakAfter: false,
};

export default function GroupDevelopment({ info, isPending, onInfoChange, openCohort, onOpenCohortChange, isManager, isManagerPending, onManagerChange }: Props) {
  const currentUserQuery = useCurrentUser();
  const currentUserId = currentUserQuery.data?.id;
  const isLeader = currentUserId === info.leaderUserId;

  return (
    <Box className={styles.container}>
      <Text fontSize="sm" color="gray.500">일반 그룹 화면에서 직접 변경할 수 없는 목업 상태</Text>
      <div className={styles.row}>
        <span>그룹 중단</span>
        <button
          type="button"
          className={styles.actionButton}
          disabled={isPending || info.status !== GroupStatus.PROGRESS}
          onClick={() => onInfoChange({ status: GroupStatus.STOP })}
        >
          {info.status === GroupStatus.STOP ? "중단 상태" : "중단 상태로 변경"}
        </button>
      </div>
      {info.status !== GroupStatus.PROGRESS && info.status !== GroupStatus.STOP && (
        <Text fontSize="xs" color="gray.500" px="8px">현재 상태가 {GroupStatusLabel[info.status]}이므로 중단할 수 없습니다.</Text>
      )}
      <div className={styles.row}>
        <span>그룹장</span>
        <button
          type="button"
          className={styles.actionButton}
          disabled={isPending || !info.isMember || currentUserId === undefined || isLeader}
          onClick={() => {
            if (currentUserId !== undefined) onInfoChange({ leaderUserId: currentUserId });
          }}
        >
          {isLeader ? "내가 그룹장" : "내가 그룹장 되기"}
        </button>
      </div>
      {!info.isMember && <Text fontSize="xs" color="gray.500" px="8px">먼저 정보 탭에서 그룹에 참여해 주세요.</Text>}
      <div className={styles.row}>
        <span>운영진</span>
        <button
          type="button"
          className={styles.actionButton}
          disabled={isManagerPending}
          onClick={() => onManagerChange(!isManager)}
        >
          {isManager ? "운영진 해제" : "운영진으로 전환"}
        </button>
      </div>
      <label className={styles.row}>
        <span>열린 활동보고</span>
        <input
          type="checkbox"
          checked={openCohort !== null}
          disabled={isPending}
          onChange={(event) => onOpenCohortChange(event.target.checked ? DEFAULT_COHORT : null)}
        />
      </label>
    </Box>
  );
}
