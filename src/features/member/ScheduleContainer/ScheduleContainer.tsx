import { useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { useQueryClient } from "@tanstack/react-query";
import MonthlyCalendar from "./MonthlyCalendar";
import WeeklySchedule, { type ScheduleItem } from "./WeeklySchedule";
import ScheduleFilter from "./ScheduleFilter";
import ScheduleDetailPopup from "./ScheduleDetailPopup";
import ScheduleForm from "./ScheduleForm";
import { getCategoryColor } from "./categoryColors";
import { useSchedules } from "./useSchedules";
import type { GetScheduleResponseDto } from "../../../api/public/schedule";
import styles from "./ScheduleContainer.module.css";

const ALL_CATEGORIES = ["CLUB", "ACADEMIC", "EXTERNAL", "MANAGEMENT", "GROUP_ACTIVITY", "BIG_SEMINAR", "AFTERPARTY", "OTHER"];
const SELECTABLE_ROOM_IDS = ["405", "406", "410"];

type Props = {
  anchorDate: string;
  onAnchorDateChange: (date: string) => void;
};

export default function ScheduleContainer({ anchorDate, onAnchorDateChange }: Props) {
  const weeklyRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set(ALL_CATEGORIES));
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set(SELECTABLE_ROOM_IDS));
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);
  const [editScheduleDetail, setEditScheduleDetail] = useState<GetScheduleResponseDto | null>(null);
  const [editAnchorDate, setEditAnchorDate] = useState("");

  const { data: schedules = [], isLoading } = useSchedules(anchorDate);

  const handleCategoryToggle = (code: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const handleRoomToggle = (roomId: string) => {
    setSelectedRooms((prev) => {
      const next = new Set(prev);
      if (next.has(roomId)) next.delete(roomId);
      else next.add(roomId);
      return next;
    });
  };

  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      if (!activeCategories.has(s.category)) return false;
      if (s.category === "GROUP_ACTIVITY") {
        return !s.location || selectedRooms.has(s.location);
      }
      return true;
    });
  }, [schedules, activeCategories, selectedRooms]);

  const scheduleDots = useMemo(() => {
    const dots: Record<string, string[]> = {};
    for (const s of filteredSchedules) {
      const date = dayjs(s.scheduledAt).format("YYYY-MM-DD");
      const color = getCategoryColor(s.category);
      if (!dots[date]) dots[date] = [];
      if (!dots[date].includes(color)) dots[date].push(color);
    }
    return dots;
  }, [filteredSchedules]);

  return (
    <>
      {selectedSchedule && (
        <ScheduleDetailPopup
          schedule={selectedSchedule}
          onClose={() => setSelectedSchedule(null)}
          onDelete={() => {
            queryClient.invalidateQueries({ queryKey: ["schedules", "monthly"] });
            setSelectedSchedule(null);
          }}
          onEdit={(detail) => {
            setSelectedSchedule(null);
            setEditScheduleDetail(detail);
            setEditAnchorDate(dayjs(detail.scheduledAt).format("YYYY-MM-DD"));
          }}
        />
      )}
      {editScheduleDetail && (
        <div className={styles.editOverlay} onClick={() => setEditScheduleDetail(null)}>
          <div className={styles.editPanel} onClick={(e) => e.stopPropagation()}>
            <ScheduleForm
              anchorDate={editAnchorDate}
              onDateChange={setEditAnchorDate}
              editSchedule={editScheduleDetail}
              onClose={() => setEditScheduleDetail(null)}
            />
          </div>
        </div>
      )}
      <div className={styles.container}>
        <div className={styles.calendarPanel}>
          <MonthlyCalendar
            anchorDate={anchorDate}
            scheduleDots={scheduleDots}
            onDateSelect={(date) => onAnchorDateChange(date)}
            onMonthChange={(firstDay) => onAnchorDateChange(firstDay)}
            onReselect={() => weeklyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          />
        </div>
        <div className={styles.filterPanel}>
          <ScheduleFilter
            activeCategories={activeCategories}
            selectedRooms={selectedRooms}
            onCategoryToggle={handleCategoryToggle}
            onRoomToggle={handleRoomToggle}
          />
        </div>
        <div className={styles.weeklyPanel} ref={weeklyRef}>
          <WeeklySchedule
            anchorDate={anchorDate}
            schedules={filteredSchedules}
            isLoading={isLoading}
            onWeekChange={(newDate) => onAnchorDateChange(newDate)}
            onDateSelect={(date) => onAnchorDateChange(date)}
            onScheduleClick={(s) => setSelectedSchedule(s)}
          />
        </div>
      </div>
    </>
  );
}
