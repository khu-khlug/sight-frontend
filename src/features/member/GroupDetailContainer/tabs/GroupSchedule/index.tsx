import { Button, ScrollArea, Text } from "@chakra-ui/react";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

import { SchedulePublicApi, type GetScheduleResponseDto, type ScheduleListItemDto } from "../../../../../api/public/schedule";
import { GroupCategory } from "../../../../../constant";
import HoverScrollbar from "../../../../../components/HoverScrollbar";
import { extractErrorMessage } from "../../../../../util/extractErrorMessage";
import { getCategoryColor } from "../../../ScheduleContainer/categoryColors";
import MonthlyCalendar from "../../../ScheduleContainer/MonthlyCalendar";
import ScheduleForm from "../../../ScheduleContainer/ScheduleForm";
import { useSchedules } from "../../../ScheduleContainer/useSchedules";
import styles from "./style.module.css";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const ROOM_IDS = ["405", "406", "410"];

const toDateKey = (dateTime: string) => dayjs(dateTime).format("YYYY-MM-DD");
const formatLocation = (location: string) => (ROOM_IDS.includes(location) ? `${location}호` : location);

export default function GroupSchedule({ groupId, category, isMember }: { groupId: string; category: GroupCategory; isMember: boolean }) {
  const [anchorDate, setAnchorDate] = useState(() => dayjs().format("YYYY-MM-DD"));
  const [byRoom, setByRoom] = useState(false);
  const [formMounted, setFormMounted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [pendingOpen, setPendingOpen] = useState(false);
  const [editSchedule, setEditSchedule] = useState<GetScheduleResponseDto | null>(null);
  const [editDate, setEditDate] = useState("");
  const formRef = useRef<HTMLDivElement>(null);

  // 폼을 접힌 상태로 먼저 그린 다음 프레임에 펼쳐야 여는 전환이 동작한다.
  useEffect(() => {
    if (!pendingOpen) return;
    const id = requestAnimationFrame(() => {
      setShowForm(true);
      setPendingOpen(false);
    });
    return () => cancelAnimationFrame(id);
  }, [pendingOpen]);

  // 목록 아래쪽 일정을 눌러도 수정 폼이 바로 보이도록 폼 위치로 스크롤한다.
  useEffect(() => {
    if (editSchedule) formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [editSchedule]);

  const openForm = () => {
    setFormMounted(true);
    setPendingOpen(true);
  };

  const handleToggleForm = () => {
    if (showForm) setShowForm(false);
    else openForm();
  };

  const handleEditSchedule = async (scheduleId: number) => {
    try {
      const detail = await SchedulePublicApi.getSchedule(scheduleId);
      setEditDate(toDateKey(detail.scheduledAt));
      setEditSchedule(detail);
      openForm();
    } catch (error) {
      toast.error(extractErrorMessage(error as Error));
    }
  };

  const weekDays = useMemo(() => {
    const anchor = dayjs(anchorDate);
    const sunday = anchor.subtract(anchor.day(), "day");
    return Array.from({ length: 7 }, (_, index) => sunday.add(index, "day"));
  }, [anchorDate]);

  // 일정은 월 단위로 조회하므로, 주가 두 달에 걸치면 양쪽 달을 함께 받는다.
  const firstMonthQuery = useSchedules(weekDays[0].format("YYYY-MM-DD"));
  const lastMonthQuery = useSchedules(weekDays[6].format("YYYY-MM-DD"));
  const isLoading = firstMonthQuery.isLoading || lastMonthQuery.isLoading;
  const isError = firstMonthQuery.isError || lastMonthQuery.isError;

  const schedules = useMemo(() => {
    const byId = new Map([...(firstMonthQuery.data ?? []), ...(lastMonthQuery.data ?? [])].map((schedule) => [schedule.id, schedule]));
    return [...byId.values()].sort((left, right) => dayjs(left.scheduledAt).valueOf() - dayjs(right.scheduledAt).valueOf());
  }, [firstMonthQuery.data, lastMonthQuery.data]);

  const weekSchedules = useMemo(() => {
    const first = weekDays[0].format("YYYY-MM-DD");
    const last = weekDays[6].format("YYYY-MM-DD");
    return schedules.filter((schedule) => {
      const date = toDateKey(schedule.scheduledAt);
      return date >= first && date <= last;
    });
  }, [schedules, weekDays]);

  const scheduleDots = useMemo(() => {
    const dots: Record<string, string[]> = {};
    for (const schedule of schedules) {
      const date = toDateKey(schedule.scheduledAt);
      const color = getCategoryColor(schedule.category);
      if (!dots[date]) dots[date] = [];
      if (!dots[date].includes(color)) dots[date].push(color);
    }
    return dots;
  }, [schedules]);

  const today = dayjs().format("YYYY-MM-DD");
  const calendar = (
    <MonthlyCalendar
      anchorDate={anchorDate}
      scheduleDots={scheduleDots}
      onDateSelect={setAnchorDate}
      onMonthChange={setAnchorDate}
    />
  );

  const renderItems = (items: ScheduleListItemDto[], timeFormat: (schedule: ScheduleListItemDto) => string) => (
    items.length === 0 ? (
      <Text fontSize="sm" color="gray.500">일정 없음</Text>
    ) : items.map((schedule) => {
      const dot = <span className={styles.dot} style={{ backgroundColor: getCategoryColor(schedule.category) }} />;
      if (!isMember || schedule.groupId !== groupId) {
        return (
          <div key={schedule.id} className={styles.item}>
            {dot}
            <Text as="span" fontSize="sm" color="gray.500" flex="none">{timeFormat(schedule)}</Text>
            <Text as="span" fontSize="sm" minW={0}>{schedule.title}</Text>
          </div>
        );
      }
      const details = [
        `${timeFormat(schedule)} ~ ${dayjs(schedule.endAt).format("HH:mm")}`,
        ...(schedule.location ? [formatLocation(schedule.location)] : []),
      ].join(" · ");
      return (
        <button
          key={schedule.id}
          type="button"
          className={`${styles.item} ${styles.itemOwnGroup}`}
          aria-label={`${schedule.title} 일정 수정`}
          onClick={() => void handleEditSchedule(schedule.id)}
        >
          {dot}
          <span className={styles.itemBody}>
            <Text as="span" fontSize="sm" fontWeight="bold">{schedule.title}</Text>
            <Text as="span" fontSize="xs" color="gray.600">{details}</Text>
          </span>
        </button>
      );
    })
  );

  const otherSchedules = weekSchedules.filter((schedule) => !schedule.location || !ROOM_IDS.includes(schedule.location));
  const formatDateTime = (schedule: ScheduleListItemDto) => dayjs(schedule.scheduledAt).format(`M/D (${DAY_LABELS[dayjs(schedule.scheduledAt).day()]}) HH:mm`);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button
          size="sm"
          variant="outline"
          flex="1"
          minW={0}
          aria-pressed={byRoom}
          bg={byRoom ? "gray.200" : undefined}
          onClick={() => setByRoom((previous) => !previous)}
          _active={{ transform: "scale(0.97)" }}
        >
          장소별 보기
        </Button>
        <Button size="sm" variant="outline" flex="1" minW={0} disabled={!isMember} onClick={handleToggleForm} _active={{ transform: "scale(0.97)" }}>
          {showForm ? "✕ 닫기" : "+ 일정 예약"}
        </Button>
      </div>
      {/* 달력은 고정하고 일정만 스크롤한다. 폼이 있으면 높이가 모자라므로 달력도 함께 스크롤한다. */}
      {!formMounted && <div className={styles.calendar}>{calendar}</div>}
      <ScrollArea.Root className={styles.listArea} size="sm" variant="hover">
        <ScrollArea.Viewport h="100%" style={{ overflowX: "hidden" }}>
          <ScrollArea.Content w="100%" className={styles.list}>
            {formMounted && <div className={styles.calendarInScroll}>{calendar}</div>}
            {formMounted && (
              <div
                ref={formRef}
                className={`${styles.formWrapper} ${showForm ? styles.formWrapperOpen : ""}`}
                onTransitionEnd={(event) => {
                  if (event.propertyName === "grid-template-rows" && !showForm) {
                    setFormMounted(false);
                    setEditSchedule(null);
                  }
                }}
              >
                <div className={styles.formWrapperInner}>
                  <ScheduleForm
                    key={editSchedule?.id ?? "new"}
                    anchorDate={editSchedule ? editDate : anchorDate}
                    onDateChange={editSchedule ? setEditDate : setAnchorDate}
                    onClose={() => setShowForm(false)}
                    editSchedule={editSchedule ?? undefined}
                    fixedGroupId={category === GroupCategory.MANAGE ? undefined : groupId}
                  />
                </div>
              </div>
            )}
            {isLoading ? (
              <Text fontSize="sm" color="gray.500">일정을 불러오는 중입니다.</Text>
            ) : isError ? (
              <Text fontSize="sm" color="gray.500">일정을 불러오지 못했습니다.</Text>
            ) : byRoom ? (
              <>
                {ROOM_IDS.map((room) => (
                  <section key={room} className={styles.day}>
                    <Text fontSize="sm" fontWeight="medium" color="gray.600">{room}호</Text>
                    {renderItems(weekSchedules.filter((schedule) => schedule.location === room), formatDateTime)}
                  </section>
                ))}
                {otherSchedules.length > 0 && (
                  <section className={styles.day}>
                    <Text fontSize="sm" fontWeight="medium" color="gray.600">기타</Text>
                    {renderItems(otherSchedules, formatDateTime)}
                  </section>
                )}
              </>
            ) : weekDays.map((day) => {
              const date = day.format("YYYY-MM-DD");
              return (
                <section key={date} className={styles.day}>
                  <div className={styles.dayHeader}>
                    <Text fontSize="sm" fontWeight="medium" color="gray.600">
                      {day.format("M월 D일")} ({DAY_LABELS[day.day()]})
                    </Text>
                    {date === today && <span className={styles.todayBadge}>오늘</span>}
                  </div>
                  {renderItems(
                    weekSchedules.filter((schedule) => toDateKey(schedule.scheduledAt) === date),
                    (schedule) => dayjs(schedule.scheduledAt).format("HH:mm"),
                  )}
                </section>
              );
            })}
          </ScrollArea.Content>
        </ScrollArea.Viewport>
        <HoverScrollbar />
      </ScrollArea.Root>
    </div>
  );
}
