import apiV2Client from "../client/v2";
import type { ScheduleCategory } from "../../components/ScheduleCategoryBadge";
import { CATEGORY_MAP } from "../public/attendance";

export type AttendanceMember = {
  id: number;
  name: string;
  number: string;
};

export type CurrentSchedule = {
  id: number;
  title: string;
  category: ScheduleCategory;
  scheduledAt: string;
  checkCode: string;
};

export type ScheduleAttendee = {
  userId: number;
  isChecked: boolean;
};

type RawScheduleDto = {
  id: number;
  title: string;
  category: string;
  scheduledAt: string;
};

type RawGetScheduleResponse = {
  id: number;
  title: string;
  category: string;
  scheduledAt: string;
  checkCode: string | null;
};

export const getMembers = async (): Promise<AttendanceMember[]> => {
  type RawUser = { id: number; profile: { name: string; number: number | null } };
  const limit = 50;
  let offset = 0;
  const all: RawUser[] = [];

  while (true) {
    const res = await apiV2Client.get<{ users: RawUser[] }>("/manager/users", {
      params: { limit, offset },
    });
    all.push(...res.data.users);
    if (res.data.users.length < limit) break;
    offset += limit;
  }

  return all.map((u) => ({
    id: u.id,
    name: u.profile.name,
    number: u.profile.number?.toString() ?? "",
  }));
};

export const getCurrentAttendanceSchedules = async (): Promise<CurrentSchedule[]> => {
  const res = await apiV2Client.get<{ schedules: RawScheduleDto[] }>("/active-attendances");
  const detailed = await Promise.all(
    res.data.schedules.map((s) =>
      apiV2Client.get<RawGetScheduleResponse>(`/schedules/${s.id}`)
    )
  );
  return detailed
    .map((r) => r.data)
    .filter((s) => s.checkCode !== null)
    .map((s) => ({
      id: s.id,
      title: s.title,
      category: CATEGORY_MAP[s.category] ?? "기타",
      scheduledAt: s.scheduledAt,
      checkCode: s.checkCode!,
    }));
};

export const getScheduleAttendees = async (
  scheduleId: number
): Promise<ScheduleAttendee[]> => {
  const res = await apiV2Client.get<{ attendances: ScheduleAttendee[] }>(
    `/schedules/${scheduleId}/attendances`
  );
  return res.data.attendances;
};

export const addAttendances = async (
  scheduleId: number,
  userIds: number[]
): Promise<void> => {
  if (userIds.length === 0) return;
  await apiV2Client.post(`/schedules/${scheduleId}/attendances`, { userIds });
};

export const removeAttendance = async (
  scheduleId: number,
  userId: number
): Promise<void> => {
  await apiV2Client.delete(`/schedules/${scheduleId}/attendances/${userId}`);
};
