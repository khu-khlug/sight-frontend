import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import QRCode from "qrcode";
import { Box, Heading } from "@chakra-ui/react";
import Container from "../../../components/Container";
import Button from "../../../components/Button";
import ScheduleCategoryBadge from "../../../components/ScheduleCategoryBadge";
import {
  getMembers,
  getCurrentAttendanceSchedules,
  getScheduleAttendees,
  addAttendances,
  removeAttendance,
  type AttendanceMember,
  type CurrentSchedule,
} from "../../../api/manage/attendance";
import {
  getAttendanceHistory,
  getSchedulesByMonth,
  type HistorySchedule,
} from "../../../api/public/attendance";
import styles from "./style.module.css";

// ── QR 팝업 ──────────────────────────────────────────────────────────────────

function QrModal({
  schedule,
  onClose,
}: {
  schedule: CurrentSchedule;
  onClose: () => void;
}) {
  const rendered = useRef(false);

  const renderQr = (el: HTMLCanvasElement | null) => {
    if (!el || rendered.current) return;
    rendered.current = true;
    const url = `${window.location.origin}/attendance/${schedule.id}?code=${schedule.checkCode}`;
    QRCode.toCanvas(el, url, { width: 240, margin: 2 });
  };

  return (
    <div className={styles["modal-overlay"]} onClick={onClose}>
      <div className={styles["modal-box"]} onClick={(e) => e.stopPropagation()}>
        <div className={styles["modal-title"]}>{schedule.title}</div>
        <div className={styles["modal-code"]}>{schedule.checkCode}</div>
        <canvas ref={renderQr} />
        <div className={styles["modal-hint"]}>
          이미지를 꾹 눌러 저장하거나 스크린샷으로 공유하세요
        </div>
        <Button variant="neutral" onClick={onClose} style={{ width: "100%" }}>
          닫기
        </Button>
      </div>
    </div>
  );
}

// ── 현황 섹션 ─────────────────────────────────────────────────────────────────

function CurrentAttendanceCard({ schedule }: { schedule: CurrentSchedule }) {
  const [showQr, setShowQr] = useState(false);

  return (
    <>
      <div className={styles["current-card"]}>
        <div className={styles["current-card-main-row"]}>
          <div className={styles["current-card-info"]}>
            <ScheduleCategoryBadge category={schedule.category} />
            <div
              className={styles["current-card-title"]}
              style={{ fontWeight: 600 }}
            >
              {schedule.title}
            </div>
          </div>
          <div className={styles["current-card-right"]}>
            <Button
              bg="brand.50"
              color="brand.500"
              borderColor="brand.200"
              border="1px solid"
              _hover={{ bg: "brand.100" }}
              onClick={() => setShowQr(true)}
            >
              상세 보기
            </Button>
          </div>
        </div>
      </div>
      {showQr && (
        <QrModal schedule={schedule} onClose={() => setShowQr(false)} />
      )}
    </>
  );
}

function CurrentAttendanceSection() {
  const { data: schedules = [] } = useQuery({
    queryKey: ["current-attendance-schedules"],
    queryFn: getCurrentAttendanceSchedules,
  });

  return (
    <div>
      <Heading as="h3" size="md" className={styles["section-title"]}>
        현재 출석체크
      </Heading>
      {schedules.length === 0 ? (
        <p className={styles["empty-text"]}>현재 열린 출석체크가 없습니다.</p>
      ) : (
        <div className={styles["current-card-list"]}>
          {schedules.map((s) => (
            <CurrentAttendanceCard key={s.id} schedule={s} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── 수동 출석 체크 폼 ──────────────────────────────────────────────────────────────

function ManualGrantSection() {
  const now = new Date();
  const queryClient = useQueryClient();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [originalAttendees, setOriginalAttendees] = useState<Set<number>>(
    new Set(),
  );
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [scheduleId, setScheduleId] = useState<number | "">("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: members = [] } = useQuery({
    queryKey: ["attendance-members"],
    queryFn: getMembers,
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ["manage-schedules", year, month],
    queryFn: () => getSchedulesByMonth(year, month),
  });

  useEffect(() => {
    setScheduleId(schedules[0]?.id ?? "");
  }, [schedules]);

  const { data: attendances } = useQuery({
    queryKey: ["schedule-attendees", scheduleId],
    queryFn: () => getScheduleAttendees(scheduleId as number),
    enabled: scheduleId !== "",
  });

  useEffect(() => {
    const ids = new Set(
      (attendances ?? []).filter((a) => a.isChecked).map((a) => a.userId),
    );
    setSelected(new Set(ids));
    setOriginalAttendees(new Set(ids));
  }, [attendances]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openDropdown = () => {
    if (triggerRef.current) {
      setDropdownRect(triggerRef.current.getBoundingClientRect());
    }
    setDropdownOpen((v) => !v);
  };

  const filtered = members
    .filter((m) => m.name.includes(search))
    .sort((a, b) => a.name.localeCompare(b.name));

  const toggleMember = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (scheduleId === "") return;
    try {
      const toAdd = Array.from(selected).filter(
        (id) => !originalAttendees.has(id),
      );
      const toRemove = Array.from(originalAttendees).filter(
        (id) => !selected.has(id),
      );
      await Promise.all([
        addAttendances(scheduleId as number, toAdd),
        ...toRemove.map((id) => removeAttendance(scheduleId as number, id)),
      ]);
      setOriginalAttendees(new Set(selected));
      queryClient.invalidateQueries({ queryKey: ["attendance-history"] });
      queryClient.invalidateQueries({
        queryKey: ["schedule-attendees", scheduleId],
      });
      toast.success("출석이 지급되었습니다.", {
        autoClose: 1000,
        hideProgressBar: true,
      });
    } catch {
      toast.error("출석 지급에 실패했습니다.", {
        autoClose: 2000,
        hideProgressBar: true,
      });
    }
  };

  const currentYear = now.getFullYear();
  const yearOptions = Array.from(
    { length: currentYear - 1998 },
    (_, i) => 1999 + i,
  );

  return (
    <div>
      <Heading as="h3" size="md" className={styles["section-title"]}>
        수동 출석체크
      </Heading>
      <form onSubmit={handleSubmit}>
        <div className={styles["form-row"]}>
          <label>연월</label>
          <div className={styles["schedule-selects"]}>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className={styles["borderless-select"]}
            >
              {[...yearOptions].reverse().map((y) => (
                <option key={y} value={y}>
                  {y}년
                </option>
              ))}
            </select>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className={styles["borderless-select"]}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {m}월
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles["form-row"]}>
          <label>일정</label>
          <select
            value={scheduleId}
            onChange={(e) => setScheduleId(Number(e.target.value))}
            disabled={schedules.length === 0}
            style={{
              flex: 1,
              padding: "6px 8px",
              height: 36,
              fontSize: "medium",
              border: "1px solid #ddd",
              boxSizing: "border-box",
            }}
          >
            {schedules.length === 0 ? (
              <option value="">일정 없음</option>
            ) : (
              schedules.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))
            )}
          </select>
        </div>

        <div className={styles["form-row"]}>
          <label>회원</label>
          <div className={styles["member-dropdown"]}>
            <button
              ref={triggerRef}
              type="button"
              className={styles["member-dropdown-trigger"]}
              onClick={openDropdown}
            >
              <span
                className={
                  selected.size > 0
                    ? styles["trigger-active"]
                    : styles["trigger-placeholder"]
                }
              >
                {selected.size > 0
                  ? `${selected.size}명 선택됨`
                  : "회원을 선택하세요"}
              </span>
              <span className={styles["trigger-arrow"]}>
                {dropdownOpen ? "▲" : "▼"}
              </span>
            </button>
            {dropdownOpen && dropdownRect && (
              <div
                ref={panelRef}
                className={styles["member-dropdown-panel"]}
                style={{
                  position: "fixed",
                  top: dropdownRect.bottom + 2,
                  left: dropdownRect.left,
                  width: dropdownRect.width,
                }}
              >
                <div className={styles["dropdown-search"]}>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="이름으로 검색"
                    autoFocus
                  />
                </div>
                <div className={styles["member-list"]}>
                  {filtered.length === 0 ? (
                    <div
                      className={styles["member-item"]}
                      style={{ color: "#9ca3af" }}
                    >
                      검색 결과 없음
                    </div>
                  ) : (
                    filtered.map((m) => {
                      const isOriginal = originalAttendees.has(m.id);
                      const isSelected = selected.has(m.id);
                      const isRemoved = isOriginal && !isSelected;
                      const isNewlySelected = !isOriginal && isSelected;
                      const itemClass = [
                        styles["member-item"],
                        isRemoved ? styles["removed"] : "",
                        isNewlySelected ? styles["selected"] : "",
                      ].join(" ");
                      return (
                        <div
                          key={m.id}
                          className={itemClass}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => toggleMember(m.id)}
                        >
                          <div
                            className={`${styles["checkbox"]} ${isSelected ? styles["checked"] : ""}`}
                          />
                          <span>{m.name}</span>
                          <span className={styles["member-number"]}>
                            {m.number}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles["form-footer"]}>
          <span />
          <Button type="submit" disabled={scheduleId === ""}>
            출석 체크
          </Button>
        </div>
      </form>
    </div>
  );
}

// ── 내역 카드 ─────────────────────────────────────────────────────────────────

function HistoryCard({
  schedule,
  members,
}: {
  schedule: HistorySchedule;
  members: AttendanceMember[];
}) {
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  const { data: attendances, isLoading } = useQuery({
    queryKey: ["schedule-attendees", schedule.id],
    queryFn: () => getScheduleAttendees(schedule.id),
    enabled: hasOpened,
  });

  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.id, m.name])),
    [members],
  );

  const checkedNames = useMemo(
    () =>
      (attendances ?? [])
        .filter((a) => a.isChecked)
        .map((a) => memberMap.get(a.userId) ?? `#${a.userId}`)
        .sort((a, b) => a.localeCompare(b, "ko")),
    [attendances, memberMap],
  );

  const handleToggle = () => {
    if (!hasOpened) setHasOpened(true);
    setOpen((v) => !v);
  };

  const date = new Date(schedule.scheduledAt);

  return (
    <div className={styles["history-card"]}>
      <div className={styles["history-card-header"]} onClick={handleToggle}>
        <div className={styles["history-card-meta"]} style={{ flex: 1 }}>
          {schedule.category && (
            <ScheduleCategoryBadge category={schedule.category} />
          )}
          <span className={styles["history-card-title"]}>{schedule.title}</span>
        </div>
        <div className={styles["history-card-right"]}>
          <span className={styles["history-card-date"]}>
            {date.toLocaleDateString("ko-KR", {
              month: "long",
              day: "numeric",
              weekday: "short",
            })}{" "}
            {date.toLocaleTimeString("ko-KR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
            {schedule.endAt && (
              <>
                {" ~ "}
                {new Date(schedule.endAt).toLocaleTimeString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </>
            )}
          </span>
          <span className={styles["history-card-count"]}>
            {attendances
              ? checkedNames.length > 0
                ? `${checkedNames.length}명`
                : ""
              : ""}
          </span>
          <span>{open ? "▲" : "▼"}</span>
        </div>
      </div>
      {open && (
        <div className={styles["history-card-body"]}>
          {isLoading ? (
            <span className={styles["no-attendee"]}>불러오는 중...</span>
          ) : checkedNames.length === 0 ? (
            <span className={styles["no-attendee"]}>출석자 없음</span>
          ) : (
            <div className={styles["attendee-list"]}>
              {checkedNames.map((name) => (
                <span key={name} className={styles["attendee-chip"]}>
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── 메인 컨테이너 ─────────────────────────────────────────────────────────────

export default function AttendanceManageContainer() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const [historyYear, setHistoryYear] = useState(currentYear);
  const yearOptions = Array.from(
    { length: currentYear - 1998 },
    (_, i) => 1999 + i,
  );

  const { data: members = [] } = useQuery({
    queryKey: ["attendance-members"],
    queryFn: getMembers,
  });

  const { data: history = [] } = useQuery({
    queryKey: ["attendance-history", historyYear],
    queryFn: () => getAttendanceHistory(historyYear),
  });

  const sorted = [...history].sort(
    (a, b) =>
      new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
  );

  return (
    <Box mt="4">
      <Container>
        <Heading as="h2" size="xl" className={styles["section-title"]}>
          출석 관리
        </Heading>
        <div className={styles["manage-columns"]}>
          <CurrentAttendanceSection />
          <ManualGrantSection />
        </div>
      </Container>
      <Container>
        <div className={styles["history-header"]}>
          <Heading as="h2" size="xl">
            출석 내역
          </Heading>
          <select
            value={historyYear}
            onChange={(e) => setHistoryYear(Number(e.target.value))}
            className={styles["year-select"]}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}년
              </option>
            ))}
          </select>
        </div>
        <div className={styles["history-list"]}>
          {sorted.map((s) => (
            <HistoryCard key={s.id} schedule={s} members={members} />
          ))}
        </div>
      </Container>
    </Box>
  );
}
