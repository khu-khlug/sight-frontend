import apiV2Client from "../client/v2";
import type { ScheduleCategory } from "../../components/ScheduleCategoryBadge";

export type AttendanceSchedule = {
  id: number;
  title: string;
  category: Exclude<ScheduleCategory, "일정없음"> | null;
  scheduledAt: string;
  endAt: string | null;
};

export type HistorySchedule = {
  id: number;
  title: string;
  category: ScheduleCategory | null;
  scheduledAt: string;
  endAt: string | null;
};

export type CheckAttendanceResult =
  | { status: "success"; expointGranted: number }
  | { status: "already" }
  | { status: "wrong_code" }
  | { status: "not_open" }
  | { status: "not_found" }
  | { status: "error" };

type RawSchedule = {
  id: number;
  title: string;
  category: string;
  scheduledAt: string;
  endAt: string | null;
};

export const CATEGORY_MAP: Partial<Record<string, Exclude<ScheduleCategory, "일정없음">>> = {
  CLUB: "동아리",
  ACADEMIC: "학사",
  EXTERNAL: "외부",
  MANAGEMENT: "운영",
  GROUP_ACTIVITY: "그룹활동",
  BIG_SEMINAR: "총회",
  AFTERPARTY: "뒷풀이",
  OTHER: "기타",
};

function toAttendanceSchedule(raw: RawSchedule): AttendanceSchedule {
  return {
    id: raw.id,
    title: raw.title,
    category: CATEGORY_MAP[raw.category] ?? null,
    scheduledAt: raw.scheduledAt,
    endAt: raw.endAt,
  };
}

export const getActiveSchedule = async (): Promise<AttendanceSchedule | null> => {
  try {
    const resp = await apiV2Client.get<{ schedule: RawSchedule | null }>("/active-attendances");
    const s = resp.data.schedule;
    return s ? toAttendanceSchedule(s) : null;
  } catch {
    return null;
  }
};

export const getSchedule = async (scheduleId: string): Promise<AttendanceSchedule | null> => {
  try {
    const resp = await apiV2Client.get<RawSchedule>(`/schedules/${scheduleId}`);
    return toAttendanceSchedule(resp.data);
  } catch {
    return null;
  }
};

export const getSchedulesByMonth = async (
  year: number,
  month: number
): Promise<{ id: number; title: string; scheduledAt: string }[]> => {
  const from = new Date(year, month - 1, 1).toISOString().slice(0, 19);
  const res = await apiV2Client.get<{ schedules: RawSchedule[] }>("/schedules", {
    params: { from, limit: 50 },
  });
  const end = new Date(year, month, 1).getTime();
  return res.data.schedules
    .filter((s) => new Date(s.scheduledAt).getTime() < end)
    .map((s) => ({ id: s.id, title: s.title, scheduledAt: s.scheduledAt }));
};

export const getAttendanceHistory = async (year: number): Promise<HistorySchedule[]> => {
  const from = `${year}-01-01T00:00:00`;
  const res = await apiV2Client.get<{ schedules: RawSchedule[] }>("/schedules", {
    params: { from, limit: 50 },
  });
  const end = new Date(year + 1, 0, 1).getTime();
  return res.data.schedules
    .filter((s) => new Date(s.scheduledAt).getTime() < end)
    .map((s) => ({
      id: s.id,
      title: s.title,
      category: CATEGORY_MAP[s.category] ?? null,
      scheduledAt: s.scheduledAt,
      endAt: s.endAt,
    }));
};

export const checkAttendance = async (
  scheduleId: string,
  code: string,
): Promise<CheckAttendanceResult> => {
  try {
    const resp = await apiV2Client.post<{ expointGranted: number }>(
      `/schedules/${scheduleId}/attendances/@me`,
      { code },
    );
    return { status: "success", expointGranted: resp.data.expointGranted };
  } catch (err: unknown) {
    const e = err as { response?: { status: number; data?: { message?: string } } };
    const status = e.response?.status;
    if (status === 409) return { status: "already" };
    if (status === 401) return { status: "wrong_code" };
    if (status === 400) return { status: "not_open" };
    if (status === 404) return { status: "not_found" };
    return { status: "error" };
  }
};
