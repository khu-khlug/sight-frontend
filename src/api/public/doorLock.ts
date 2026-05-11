import apiV2Client from "../client/v2";
import type { ScheduleCategory } from "../../components/ScheduleCategoryBadge";

export type DoorLockSchedule = {
  category: Exclude<ScheduleCategory, "일정없음">;
  title: string;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
};

export type DoorLockStatus = {
  todayVisitorCount: number;
  currentRoomCount: number;
};

export const getCurrentSchedule =
  async (): Promise<DoorLockSchedule | null> => {
    // TODO: replace with real API call
    const start = new Date(Date.now() - 23 * 60 * 1000);
    const end = new Date(Date.now() + 97 * 60 * 1000);
    return {
      category: "동아리",
      title: "정기 회의",
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    };
    // return null;
  };

export const getNextSchedule = async (): Promise<DoorLockSchedule | null> => {
  // TODO: replace with real API call
  const start = new Date(Date.now() + (97 + 30) * 60 * 1000);
  const end = new Date(Date.now() + (97 + 30 + 120) * 60 * 1000);
  return {
    category: "세미나",
    title: "Git 입문 세미나",
    startTime: start.toISOString(),
    endTime: end.toISOString(),
  };
  // return null;
};

export const getDoorLockStatus = async (): Promise<DoorLockStatus> => {
  // TODO: replace with real API call
  return {
    todayVisitorCount: 12,
    currentRoomCount: 3,
  };
};

export type AuthResult =
  | { success: true; name: string }
  | { success: false };

export const authenticate = async (studentId: string): Promise<AuthResult> => {
  // TODO: 실제 API 연결 시 아래 목업을 교체
  // const response = await apiV2Client.post<AuthResult>("/door-lock/verify", { studentId });
  // return response.data;
  void apiV2Client; // 실제 연결 전까지 lint 경고 방지
  if (studentId === "0000000000") return { success: false };
  return { success: true, name: "홍길동" };
};
