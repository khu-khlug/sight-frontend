import apiV2Client from "../client/v2";

// DTOs
export type ScheduleCategory =
  | "ROOM_405"
  | "ROOM_406"
  | "ROOM_410"
  | "CLUB"
  | "ACADEMIC"
  | "EXTERNAL";

export type ScheduleDto = {
  id: string;
  title: string;
  startTime: string; // ISO 8601
  category: ScheduleCategory | null;
};

export type ListSchedulesRequestDto = {
  from?: string; // ISO 8601 datetime (기본값: 현재 시각)
  limit?: number; // 기본값: 5, 최대: 50
};

export type ListSchedulesResponseDto = {
  count: number;
  schedules: ScheduleDto[];
};

// API functions
/**
 * 일정 목록 조회
 * @param request from(시작 시각), limit(조회 개수) 옵션
 */
const listSchedules = async (
  request: ListSchedulesRequestDto = {}
): Promise<ListSchedulesResponseDto> => {
  const { from, limit = 5 } = request;
  const response = await apiV2Client.get<ListSchedulesResponseDto>(
    "/schedules",
    {
      params: { from, limit },
    }
  );
  return response.data;
};

/**
 * 예정된 일정 조회 (현재 시각 이후)
 * @param limit 조회할 일정 개수 (기본값: 5)
 */
const listUpcomingSchedules = async (
  limit = 5
): Promise<ListSchedulesResponseDto> => {
  return listSchedules({ limit });
};

export const SchedulePublicApi = {
  listSchedules,
  listUpcomingSchedules,
};
