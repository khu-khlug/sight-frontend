import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Badge } from "@chakra-ui/react";
import { getCategoryColor } from "./categoryColors";
import { SchedulePublicApi, type GetScheduleResponseDto } from "../../../api/public/schedule";
import { useIsManager } from "../../../hooks/user/useIsManager";
import { useCurrentUser } from "../../../hooks/user/useCurrentUser";
import type { ScheduleItem } from "./WeeklySchedule";
import styles from "./ScheduleDetailPopup.module.css";

const CATEGORY_COLOR: Record<string, string> = {
  CLUB: "blue",
  ACADEMIC: "red",
  EXTERNAL: "purple",
  MANAGEMENT: "green",
  GROUP_ACTIVITY: "orange",
  BIG_SEMINAR: "blue",
  AFTERPARTY: "yellow",
  OTHER: "gray",
};

const CATEGORY_LABEL: Record<string, string> = {
  CLUB: "동아리",
  ACADEMIC: "학사",
  EXTERNAL: "외부",
  MANAGEMENT: "운영",
  GROUP_ACTIVITY: "그룹활동",
  BIG_SEMINAR: "총회",
  AFTERPARTY: "뒷풀이",
  OTHER: "기타",
};

type Props = {
  schedule: ScheduleItem;
  onClose: () => void;
  onDelete?: () => void;
  onEdit?: (detail: GetScheduleResponseDto) => void;
};

export default function ScheduleDetailPopup({ schedule, onClose, onDelete, onEdit }: Props) {
  const color = getCategoryColor(schedule.category);
  const start = dayjs(schedule.scheduledAt);
  const end = dayjs(schedule.endAt);
  const { isManager } = useIsManager();
  const { data: currentUser } = useCurrentUser();

  const isGroupActivity = schedule.category === "GROUP_ACTIVITY";
  const isAuthor = currentUser?.id !== undefined && currentUser.id === schedule.author;
  const canEdit = (isManager && !isGroupActivity) || (isGroupActivity && isAuthor);
  const canDelete = isManager || (isGroupActivity && isAuthor);

  const [detail, setDetail] = useState<GetScheduleResponseDto | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      if (schedule.category === "BIG_SEMINAR") {
        await SchedulePublicApi.deleteBigSeminarSchedule(schedule.id);
      } else if (schedule.category === "GROUP_ACTIVITY") {
        await SchedulePublicApi.deleteGroupActivitySchedule(schedule.id);
      } else {
        await SchedulePublicApi.deleteSchedule(schedule.id);
      }
      onDelete?.();
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    setLoadingDetail(true);
    SchedulePublicApi.getSchedule(schedule.id)
      .then(setDetail)
      .finally(() => setLoadingDetail(false));
  }, [schedule.id]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        <div className={styles.colorBar} style={{ backgroundColor: color }} />
        <div className={styles.body}>
          <div className={styles.header}>
            <Badge colorPalette={CATEGORY_COLOR[schedule.category] ?? "gray"} size="sm">
              {CATEGORY_LABEL[schedule.category] ?? schedule.category}
            </Badge>
            <button className={styles.closeBtn} onClick={onClose}>✕</button>
          </div>
          <div className={styles.title}>{schedule.title}</div>
          <div className={styles.rows}>
            <div className={styles.row}>
              <span className={styles.rowLabel}>날짜</span>
              <span className={styles.rowValue}>{start.format("YYYY년 M월 D일")}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.rowLabel}>시간</span>
              <span className={styles.rowValue}>{start.format("HH:mm")} ~ {end.format("HH:mm")}</span>
            </div>
            {schedule.location && (
              <div className={styles.row}>
                <span className={styles.rowLabel}>장소</span>
                <span className={styles.rowValue}>{schedule.location}</span>
              </div>
            )}
            {loadingDetail ? (
              <div className={styles.detailLoading}>상세 정보 불러오는 중...</div>
            ) : detail && (
              <>
                <div className={styles.divider} />
                <div className={styles.row}>
                  <span className={styles.rowLabel}>경험치</span>
                  <span className={styles.rowValue}>{detail.expoint > 0 ? `+${detail.expoint} XP` : "없음"}</span>
                </div>
                <div className={styles.row}>
                  <span className={styles.rowLabel}>작성자</span>
                  <span className={styles.rowValue}>{detail.authorName ?? `#${detail.author}`}</span>
                </div>
                {detail.groupTitle && (
                  <div className={styles.row}>
                    <span className={styles.rowLabel}>그룹</span>
                    <span className={styles.rowValue}>{detail.groupTitle}</span>
                  </div>
                )}
                {detail.checkCode && (
                  <div className={styles.row}>
                    <span className={styles.rowLabel}>출석 코드</span>
                    <span className={`${styles.rowValue} ${styles.checkCode}`}>{detail.checkCode}</span>
                  </div>
                )}
                {detail.isSummerSeason !== undefined && (
                  <div className={styles.row}>
                    <span className={styles.rowLabel}>시즌</span>
                    <span className={styles.rowValue}>{detail.isSummerSeason ? "여름" : "겨울"} 빅세미나</span>
                  </div>
                )}
              </>
            )}
          </div>
          {(canEdit || canDelete) && (
            <div className={styles.footer}>
              <div className={styles.footerLeft}>
                {canEdit && (
                  <button
                    className={styles.editBtn}
                    onClick={() => detail && onEdit?.(detail)}
                    disabled={loadingDetail || !detail}
                  >
                    수정
                  </button>
                )}
              </div>
              <div className={styles.footerRight}>
                {canDelete && (confirmDelete ? (
                  <>
                    <button className={styles.cancelBtn} onClick={() => setConfirmDelete(false)} disabled={deleting}>취소</button>
                    <button className={styles.deleteConfirmBtn} onClick={handleDelete} disabled={deleting}>
                      {deleting ? "삭제 중..." : "삭제 확인"}
                    </button>
                  </>
                ) : (
                  <button className={styles.deleteBtn} onClick={handleDelete}>삭제</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
