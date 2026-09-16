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
  // 블루투스로 들어온 사람만 집계된 값이라 실제 재실 인원의 하한선이다 — 화면에는 "N+명"으로 표시한다.
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

type RoomConfig = { roomNumber: number; apiKey: string };

let cachedRoomConfig: RoomConfig | null = null;

// 방 번호/키는 빌드 설정으로 갖지 않고 매번 데몬에 물어봐서 얻는다 — 페이지 번들에 SYSTEM
// 권한 값을 정적으로 박아두지 않기 위함.
const getRoomConfig = async (): Promise<RoomConfig | null> => {
  if (cachedRoomConfig !== null) return cachedRoomConfig;
  try {
    const resp = await fetch("http://localhost:8080/room-env-var");
    if (!resp.ok) return null;
    cachedRoomConfig = (await resp.json()) as RoomConfig;
    return cachedRoomConfig;
  } catch {
    return null;
  }
};

const systemHeader = (apiKey: string) => ({ "x-api-key": apiKey });

const SCHEDULES_KEY = "door_lock_schedules";

const cacheSchedules = (schedules: RawSchedule[]): void => {
  localStorage.setItem(SCHEDULES_KEY, JSON.stringify(schedules));
};

const cachedSchedules = (): RawSchedule[] => {
  const raw = localStorage.getItem(SCHEDULES_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as RawSchedule[];
};

const refreshSchedules = async (): Promise<void> => {
  const config = await getRoomConfig();
  if (config === null) return;
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const resp = await apiV2Client.get<{ schedules: RawSchedule[] }>("/schedules", {
      params: { from: startOfDay.toISOString(), limit: 50 },
      headers: systemHeader(config.apiKey),
    });
    cacheSchedules(resp.data.schedules);
  } catch {
    // 실패 시 기존 캐시 유지
  }
};

export const getCurrentSchedule = async (): Promise<DoorLockSchedule | null> => {
  await refreshSchedules();
  const now = new Date();
  const current = cachedSchedules().find(
    (s) =>
      new Date(s.scheduledAt) <= now &&
      (s.endAt === null || new Date(s.endAt) >= now),
  );
  return current ? toSchedule(current) : null;
};

export const getNextSchedule = async (): Promise<DoorLockSchedule | null> => {
  const now = new Date();
  const next = cachedSchedules().find((s) => new Date(s.scheduledAt) > now);
  return next ? toSchedule(next) : null;
};

const getTodayVisitorCount = async (config: RoomConfig): Promise<number | null> => {
  try {
    const resp = await apiV2Client.get<{ count: number }>(
      "/internal/door-lock/daily-visit-count",
      {
        params: { room: config.roomNumber },
        headers: systemHeader(config.apiKey),
      },
    );
    return resp.data.count;
  } catch {
    return null;
  }
};

// 공개 API라 room-env-var 없이도 부를 수 있지만, 실패하면 0으로 표시한다.
const getCurrentRoomCount = async (): Promise<number> => {
  try {
    const resp = await apiV2Client.get<{ occupants: { name: string }[] }>("/occupants");
    return resp.data.occupants.length;
  } catch {
    return 0;
  }
};

export const getDoorLockStatus = async (): Promise<DoorLockStatus | null> => {
  const config = await getRoomConfig();
  if (config === null) return null;
  const [todayVisitorCount, currentRoomCount] = await Promise.all([
    getTodayVisitorCount(config),
    getCurrentRoomCount(),
  ]);
  if (todayVisitorCount === null) return null;
  return { todayVisitorCount, currentRoomCount };
};

const MEMBERS_DATE_KEY = "door_lock_members_date";

const todayString = () => new Date().toISOString().slice(0, 10);

export const getMembersDate = (): string | null =>
  localStorage.getItem(MEMBERS_DATE_KEY);

export const sendDaemonDownAlert = async (): Promise<void> => {
  const config = await getRoomConfig();
  if (config === null) return;
  await apiV2Client
    .post(
      "/internal/door-lock/alert-die",
      { roomNumber: config.roomNumber },
      { headers: systemHeader(config.apiKey) },
    )
    .then(() => {})
    .catch(() => {});
};

// 회원목록은 데몬이 파일로 캐싱한다 — Chromium 프로필이 재설치 시 초기화되면서
// localStorage가 같이 날아가는데, 데몬 파일 캐시는 그 영향을 안 받는다.
export const syncMembers = async (): Promise<void> => {
  const today = todayString();
  if (localStorage.getItem(MEMBERS_DATE_KEY) === today) return;
  const config = await getRoomConfig();
  if (config === null) return;
  try {
    const resp = await apiV2Client.get<{ members: { number: number; name: string }[] }>(
      "/internal/door-lock/members",
      { headers: systemHeader(config.apiKey) },
    );
    await fetch("http://localhost:8080/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ members: resp.data.members }),
    });
    localStorage.setItem(MEMBERS_DATE_KEY, today);
  } catch {
    // 실패 시 날짜 미갱신으로 다음 마운트에서 재시도
  }
};

const lookupLocal = async (studentId: string): Promise<{ found: boolean; name: string }> => {
  try {
    const resp = await fetch("http://localhost:8080/members");
    if (!resp.ok) return { found: false, name: "" };
    const data = (await resp.json()) as { members: { number: number; name: string }[] };
    const member = data.members.find((m) => String(m.number) === studentId);
    return member ? { found: true, name: member.name } : { found: false, name: "" };
  } catch {
    return { found: false, name: "" };
  }
};

const openRelay = (studentId: string): Promise<void> =>
  fetch("http://localhost:8080/unlock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentId }),
  })
    .then(() => {})
    .catch(() => {});

const localFallback = async (
  studentId: string,
  reason: "timeout" | "network" | "signal_failed",
): Promise<AuthResult> => {
  const local = await lookupLocal(studentId);
  if (!local.found) return { success: false, reason, localNotFound: true };
  await openRelay(studentId);
  return { success: true, name: local.name, localUsed: true };
};

export const authenticate = async (studentId: string): Promise<AuthResult> => {
  const config = await getRoomConfig();
  if (config === null) return localFallback(studentId, "signal_failed");

  try {
    const resp = await apiV2Client.post<{ name: string }>(
      "/internal/door-lock/accesses",
      { number: Number(studentId), roomNumber: config.roomNumber },
      { headers: systemHeader(config.apiKey), timeout: 5000 },
    );
    await openRelay(studentId);
    return { success: true, name: resp.data.name };
  } catch (error) {
    if (typeof error === "object" && error !== null && "response" in error) {
      const status = (error as { response?: { status?: number } }).response?.status;
      if (status !== undefined) {
        return { success: false, reason: "unauthorized" };
      }
    }
    const isTimeout =
      typeof error === "object" && error !== null && "code" in error && error.code === "ECONNABORTED";
    return localFallback(studentId, isTimeout ? "timeout" : "network");
  }
};
