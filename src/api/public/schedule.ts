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

export type ScheduleListItemDto = {
  id: number;
  title: string;
  category: string;
  location: string | null;
  state: string;
  scheduledAt: string;
  endAt: string;
  expoint: number;
  author: number;
  groupId: number | null;
};

export type ListSchedulesRequestDto = {
  from?: string; // ISO 8601 datetime (기본값: 현재 시각)
  limit?: number; // 기본값: 5, 최대: 50
};

export type ListSchedulesResponseDto = {
  count: number;
  schedules: ScheduleListItemDto[];
};

export type GetScheduleResponseDto = {
  id: number;
  title: string;
  category: string;
  location: string | null;
  state: string;
  scheduledAt: string;
  endAt: string;
  expoint: number;
  checkCode: string | null; // 운영진에게만 노출
  author: number;
  authorName: string | null;
  groupId: number | null;
  groupTitle: string | null;
  createdAt: string;
  updatedAt: string;
  // BIG_SEMINAR 카테고리에 한해 포함
  isSummerSeason?: boolean;
  isSpeakAfter?: boolean;
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
  const from = new Date().toISOString().slice(0, 19);
  return listSchedules({ from, limit });
};

const getSchedule = async (scheduleId: number): Promise<GetScheduleResponseDto> => {
  const response = await apiV2Client.get<GetScheduleResponseDto>(`/schedules/${scheduleId}`);
  return response.data;
};

const createSchedule = async (body: {
  title: string;
  category: string;
  location: string;
  scheduledAt: string;
  endAt: string;
  expoint: number;
  generateCheckCode: boolean;
}): Promise<void> => {
  await apiV2Client.post("/schedules", body);
};

const createGroupActivitySchedule = async (body: {
  title: string;
  location: string;
  scheduledAt: string;
  endAt: string;
  groupId: number;
}): Promise<void> => {
  await apiV2Client.post("/schedules/group-activity", body);
};

const createBigSeminarSchedule = async (body: {
  title: string;
  location: string;
  scheduledAt: string;
  endAt: string;
  expoint: number;
  generateCheckCode: boolean;
  isSummerSeason: boolean;
  isSpeakAfter: boolean;
}): Promise<void> => {
  await apiV2Client.post("/schedules/big-seminar", body);
};

const updateSchedule = async (scheduleId: number, body: {
  title: string;
  location: string | null;
  scheduledAt: string;
  endAt: string;
  expoint: number;
}): Promise<void> => {
  await apiV2Client.patch(`/schedules/${scheduleId}`, body);
};

const updateGroupActivitySchedule = async (scheduleId: number, body: {
  title: string;
  location: string | null;
  scheduledAt: string;
  endAt: string;
}): Promise<void> => {
  await apiV2Client.patch(`/schedules/group-activity/${scheduleId}`, body);
};

const updateBigSeminarSchedule = async (scheduleId: number, body: {
  title: string;
  location: string | null;
  scheduledAt: string;
  endAt: string;
  expoint: number;
  isSummerSeason: boolean;
  isSpeakAfter: boolean;
}): Promise<void> => {
  await apiV2Client.patch(`/schedules/big-seminar/${scheduleId}`, body);
};

const updateScheduleCategory = async (scheduleId: number, body: {
  category: string;
  isSummerSeason?: boolean;
  isSpeakAfter?: boolean;
}): Promise<void> => {
  await apiV2Client.patch(`/schedules/${scheduleId}/category`, body);
};

const deleteSchedule = async (scheduleId: number): Promise<void> => {
  await apiV2Client.delete(`/schedules/${scheduleId}`);
};

const deleteGroupActivitySchedule = async (scheduleId: number): Promise<void> => {
  await apiV2Client.delete(`/schedules/group-activity/${scheduleId}`);
};

const deleteBigSeminarSchedule = async (scheduleId: number): Promise<void> => {
  await apiV2Client.delete(`/schedules/big-seminar/${scheduleId}`);
};

export const SchedulePublicApi = {
  listSchedules,
  listUpcomingSchedules,
  getSchedule,
  createSchedule,
  createGroupActivitySchedule,
  createBigSeminarSchedule,
  updateSchedule,
  updateGroupActivitySchedule,
  updateBigSeminarSchedule,
  updateScheduleCategory,
  deleteSchedule,
  deleteGroupActivitySchedule,
  deleteBigSeminarSchedule,
};
