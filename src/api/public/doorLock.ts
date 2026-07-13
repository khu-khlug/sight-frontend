import apiV2Client from "../client/v2";
import type { ScheduleCategory } from "../../components/ScheduleCategoryBadge";

export type DoorLockSchedule = {
  category: Exclude<ScheduleCategory, "일정없음"> | null;
  title: string;
  scheduledAt: string; // ISO 8601
  endAt: string | null; // ISO 8601
};

export type DoorLockStatus = {
  todayVisitorCount: number;
  currentRoomCount: number;
};

export type AuthResult =
  | { success: true; name: string; localUsed?: true }
  | { success: false; reason: "unauthorized" }
  | { success: false; reason: "timeout" | "network" | "signal_failed"; localNotFound: boolean };

type RawSchedule = {
  title: string;
  category: string | null;
  scheduledAt: string;
  endAt: string | null;
};

const toSchedule = (s: RawSchedule): DoorLockSchedule => ({
  category: s.category as DoorLockSchedule["category"],
  title: s.title,
  scheduledAt: s.scheduledAt,
  endAt: s.endAt,
});

const SYSTEM_HEADER = { "x-api-key": import.meta.env.VITE_DOOR_LOCK_API_KEY };

export const getCurrentSchedule = async (): Promise<DoorLockSchedule | null> => {
  try {
    const resp = await fetch("http://localhost:8080/schedules/now");
    if (!resp.ok) return null;
    const data = await resp.json() as RawSchedule | null;
    return data ? toSchedule(data) : null;
  } catch {
    return null;
  }
};

export const getNextSchedule = async (): Promise<DoorLockSchedule | null> => {
  try {
    const resp = await fetch("http://localhost:8080/schedules/next");
    if (!resp.ok) return null;
    const data = await resp.json() as RawSchedule | null;
    return data ? toSchedule(data) : null;
  } catch {
    return null;
  }
};

export const getDoorLockStatus = async (): Promise<DoorLockStatus | null> => {
  return null;
};

const MEMBERS_KEY = "door_lock_members";
const MEMBERS_DATE_KEY = "door_lock_members_date";

const todayString = () => new Date().toISOString().slice(0, 10);

export const getMembersDate = (): string | null =>
  localStorage.getItem(MEMBERS_DATE_KEY);

export const sendDaemonDownAlert = (): Promise<void> =>
  apiV2Client
    .post("/internal/door-lock/alert-die", null, { headers: SYSTEM_HEADER })
    .then(() => {})
    .catch(() => {});

export const syncMembers = async (): Promise<void> => {
  const today = todayString();
  if (localStorage.getItem(MEMBERS_DATE_KEY) === today) return;
  try {
    const resp = await apiV2Client.get<{ members: { number: number; name: string }[] }>(
      "/internal/door-lock/members",
      { headers: SYSTEM_HEADER },
    );
    const map: Record<string, string> = {};
    for (const m of resp.data.members) map[String(m.number)] = m.name;
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(map));
    localStorage.setItem(MEMBERS_DATE_KEY, today);
  } catch {
    // 실패 시 기존 캐시 유지, 날짜 미갱신으로 다음 마운트에서 재시도
  }
};

const lookupLocal = (studentId: string): { found: boolean; name: string } => {
  const raw = localStorage.getItem(MEMBERS_KEY);
  if (!raw) return { found: false, name: "" };
  const map = JSON.parse(raw) as Record<string, string>;
  if (!(studentId in map)) return { found: false, name: "" };
  return { found: true, name: map[studentId] };
};

const localFallback = (
  studentId: string,
  reason: "timeout" | "network" | "signal_failed",
): AuthResult => {
  const local = lookupLocal(studentId);
  return local.found
    ? { success: true, name: local.name, localUsed: true }
    : { success: false, reason, localNotFound: true };
};

export const authenticate = async (studentId: string): Promise<AuthResult> => {
  try {
    const resp = await fetch("http://localhost:8080/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: studentId }),
    });

    if (resp.ok) {
      const data = await resp.json().catch(() => ({})) as { name?: string };
      return { success: true, name: data.name ?? "" };
    }

    const data = await resp.json().catch(() => ({})) as { message?: string };
    if (resp.status === 504 || data.message === "timeout")
      return localFallback(studentId, "timeout");
    if (resp.status === 502 || data.message === "network")
      return localFallback(studentId, "network");
    return { success: false, reason: "unauthorized" };
  } catch {
    return localFallback(studentId, "signal_failed");
  }
};
