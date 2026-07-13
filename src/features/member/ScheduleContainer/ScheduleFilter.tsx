import { getCategoryColor } from "./categoryColors";
import ScheduleFloorPlan from "./ScheduleFloorPlan";
import styles from "./ScheduleFilter.module.css";

const CATEGORIES: { code: string; label: string }[] = [
  { code: "CLUB", label: "동아리" },
  { code: "BIG_SEMINAR", label: "총회" },
  { code: "ACADEMIC", label: "학사" },
  { code: "EXTERNAL", label: "외부" },
  { code: "GROUP_ACTIVITY", label: "그룹활동" },
  { code: "AFTERPARTY", label: "뒷풀이" },
  { code: "MANAGEMENT", label: "운영" },
  { code: "OTHER", label: "기타" },
];

type Props = {
  activeCategories: Set<string>;
  selectedRooms: Set<string>;
  onCategoryToggle: (code: string) => void;
  onRoomToggle: (roomId: string) => void;
};

export default function ScheduleFilter({
  activeCategories,
  selectedRooms,
  onCategoryToggle,
  onRoomToggle,
}: Props) {
  const isGroupActivityActive = activeCategories.has("GROUP_ACTIVITY");

  return (
    <div className={styles.filter}>
      <div className={styles.section}>
        <div className={styles.sectionLabel}>카테고리</div>
        <div className={styles.categoryRow}>
          {CATEGORIES.map(({ code, label }) => {
            const isActive = activeCategories.has(code);
            const color = getCategoryColor(code);
            return (
              <button
                key={code}
                type="button"
                className={styles.categoryBtn}
                style={
                  isActive
                    ? {
                        backgroundColor: color + "10",
                        borderColor: color + "88",
                        color: color + "dd",
                      }
                    : {
                        backgroundColor: "#f1f5f9",
                        borderColor: "#e2e8f0",
                        color: "#94a3b8",
                      }
                }
                onClick={() => onCategoryToggle(code)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className={`${styles.section} ${styles.sectionFloorPlan}`}>
        <div
          className={!isGroupActivityActive ? styles.sectionDimmed : undefined}
        >
          <ScheduleFloorPlan
            selectedRoomIds={isGroupActivityActive ? selectedRooms : new Set()}
            onToggleRoom={isGroupActivityActive ? onRoomToggle : () => {}}
          />
        </div>
        {!isGroupActivityActive && (
          <div className={styles.floorplanOverlay}>
            그룹활동 카테고리를 활성화하면
            <br />
            장소 필터를 사용할 수 있습니다.
          </div>
        )}
      </div>
    </div>
  );
}
