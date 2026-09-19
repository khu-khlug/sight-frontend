import { useMemo } from "react";
import dayjs from "dayjs";
import styles from "./MonthlyCalendar.module.css";

type Props = {
  anchorDate: string; // YYYY-MM-DD
  scheduleDots?: Record<string, string[]>; // dateStr → 카테고리 색상 배열
  onDateSelect: (date: string) => void;
  onMonthChange: (firstDayOfMonth: string) => void;
  onReselect?: () => void; // 이미 선택된 날짜를 다시 클릭할 때
};

export default function MonthlyCalendar({
  anchorDate,
  scheduleDots = {},
  onDateSelect,
  onMonthChange,
  onReselect,
}: Props) {
  const anchor = dayjs(anchorDate);
  const currentMonth = anchor.startOf("month");

  // 일요일 시작 기준 주 범위
  const weekStart = anchor.subtract(anchor.day(), "day");
  const weekEnd = weekStart.add(6, "day");

  const calendarDays = useMemo(() => {
    const startOfMonth = currentMonth.startOf("month");
    const endOfMonth = currentMonth.endOf("month");

    // day()는 0=일, 1=월 ... 6=토. 일요일 시작이므로 그대로 사용
    const startDay = startOfMonth.day();
    const calendarStart = startOfMonth.subtract(startDay, "day");

    const days: dayjs.Dayjs[] = [];
    let current = calendarStart;
    const totalDays = startDay + endOfMonth.date() > 35 ? 42 : 35;
    for (let i = 0; i < totalDays; i++) {
      days.push(current);
      current = current.add(1, "day");
    }
    return days;
  }, [currentMonth]);

  const today = dayjs().format("YYYY-MM-DD");

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => onMonthChange(currentMonth.subtract(1, "month").format("YYYY-MM-DD"))}
        >
          ◀
        </button>
        <span className={styles.monthLabel}>
          {currentMonth.format("YYYY년 M월")}
        </span>
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => onMonthChange(currentMonth.add(1, "month").format("YYYY-MM-DD"))}
        >
          ▶
        </button>
      </div>

      <div className={styles.weekdays}>
        {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
          <div
            key={d}
            className={`${styles.weekday} ${i === 0 ? styles.weekdaySun : ""} ${i === 6 ? styles.weekdaySat : ""}`}
          >
            {d}
          </div>
        ))}
      </div>

      <div className={styles.days}>
        {calendarDays.map((day) => {
          const dateStr = day.format("YYYY-MM-DD");
          const isOtherMonth = !day.isSame(currentMonth, "month");
          const isToday = dateStr === today;
          const isSelected = dateStr === anchorDate;
          const isInSelectedWeek = !day.isBefore(weekStart, "day") && !day.isAfter(weekEnd, "day");
          const dots = scheduleDots[dateStr] ?? [];

          return (
            <button
              key={dateStr}
              type="button"
              className={[
                styles.day,
                isInSelectedWeek && !isSelected ? styles.dayInSelectedWeek : "",
                isOtherMonth ? styles.dayOtherMonth : "",
                isToday ? styles.dayToday : "",
                isSelected ? styles.daySelected : "",
              ].join(" ")}
              onClick={() => {
                if (isOtherMonth) return;
                if (isSelected) onReselect?.();
                else onDateSelect(dateStr);
              }}
            >
              <span className={styles.dayNum}>{day.date()}</span>
              {dots.length > 0 && (
                <span className={styles.dotsWrapper}>
                  <span className={styles.dots}>
                    {dots.slice(0, 3).map((color, idx) => (
                      <span
                        key={idx}
                        className={styles.dot}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </span>
                  {dots.length > 3 && (
                    <span className={styles.dotsMore}>+{dots.length - 3}</span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
