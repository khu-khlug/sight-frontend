import { useMemo } from "react";
import dayjs from "dayjs";
import { getCategoryColor } from "./categoryColors";
import styles from "./WeeklySchedule.module.css";

export type ScheduleItem = {
  id: number;
  title: string;
  category: string;
  location: string | null;
  state: string;
  scheduledAt: string; // ISO 8601
  endAt: string; // ISO 8601
  expoint: number;
  author: number;
  groupId: number | null;
};

type Props = {
  anchorDate: string; // YYYY-MM-DD — 이 날짜가 속한 주를 표시
  schedules: ScheduleItem[];
  isLoading: boolean;
  onWeekChange: (newAnchorDate: string) => void;
  onDateSelect?: (date: string) => void;
  onScheduleClick?: (schedule: ScheduleItem) => void;
};

export default function WeeklySchedule({
  anchorDate,
  schedules,
  isLoading,
  onWeekChange,
  onDateSelect,
  onScheduleClick,
}: Props) {
  const weekDays = useMemo(() => {
    const anchor = dayjs(anchorDate);
    // 일요일 시작: anchor.day()=0이면 그 주 일요일이 anchor 자신
    const sunday = anchor.subtract(anchor.day(), "day");
    return Array.from({ length: 7 }, (_, i) => sunday.add(i, "day"));
  }, [anchorDate]);

  const weekLabel = `${weekDays[0].format("M/D")} ~ ${weekDays[6].format("M/D")}`;
  const today = dayjs().format("YYYY-MM-DD");
  const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];

  const getSchedulesForDay = (date: dayjs.Dayjs): ScheduleItem[] => {
    const dateStr = date.format("YYYY-MM-DD");
    return schedules
      .filter((s) => dayjs(s.scheduledAt).format("YYYY-MM-DD") === dateStr)
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  };

  if (isLoading) {
    return <div className={styles.loading}>일정을 불러오는 중...</div>;
  }

  return (
    <div className={styles.weekly}>
      <div className={styles.header}>
        <div className={styles.title}>주간 일정</div>
        <div className={styles.weekNav}>
          <button
            className={styles.navBtn}
            onClick={() => onWeekChange(dayjs(anchorDate).subtract(7, "day").format("YYYY-MM-DD"))}
          >
            ◀
          </button>
          <span className={styles.weekLabel}>{weekLabel}</span>
          <button
            className={styles.navBtn}
            onClick={() => onWeekChange(dayjs(anchorDate).add(7, "day").format("YYYY-MM-DD"))}
          >
            ▶
          </button>
        </div>
      </div>

      <div className={styles.grid}>
        {weekDays.map((date, idx) => {
          const dateStr = date.format("YYYY-MM-DD");
          const isToday = dateStr === today;
          const daySchedules = getSchedulesForDay(date);

          const isSelected = dateStr === anchorDate;

          return (
            <div
              key={dateStr}
              className={[styles.dayCol, isToday ? styles.dayColToday : "", isSelected ? styles.dayColSelected : ""].join(" ")}
              onClick={() => onDateSelect?.(dateStr)}
              style={{ cursor: onDateSelect ? "pointer" : undefined }}
            >
              <div
                className={[
                  styles.dayHeader,
                  isToday ? styles.dayHeaderToday : "",
                  isSelected ? styles.dayHeaderSelected : "",
                  idx === 0 ? styles.dayHeaderSun : "",
                  idx === 6 ? styles.dayHeaderSat : "",
                ].join(" ")}
              >
                {dayLabels[idx]} {date.format("D")}
              </div>
              {daySchedules.length === 0 ? (
                <div className={styles.empty}>-</div>
              ) : (
                daySchedules.map((schedule) => {
                  const start = dayjs(schedule.scheduledAt).format("HH:mm");
                  const end = dayjs(schedule.endAt).format("HH:mm");
                  return (
                    <div
                      key={schedule.id}
                      className={styles.scheduleBlock}
                      style={{
                        backgroundColor: getCategoryColor(schedule.category) + "18",
                        borderLeft: `3px solid ${getCategoryColor(schedule.category)}`,
                        color: getCategoryColor(schedule.category),
                      }}
                      onClick={() => onScheduleClick?.(schedule)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          onScheduleClick?.(schedule);
                      }}
                      title={`${schedule.title} (${start}~${end})`}
                    >
                      <div className={styles.scheduleTime}>{start}~{end}</div>
                      <div className={styles.scheduleTitle}>{schedule.title}</div>
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
