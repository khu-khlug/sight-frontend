// DTOs
export type ScheduleType = "PERSONAL" | "CLUB" | "GROUP";

export type ScheduleRelatedEntityDto = {
  id: string;
  name: string;
};

export type ScheduleDto = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  type: ScheduleType;
  relatedEntity?: ScheduleRelatedEntityDto | null;
};

export type ListUpcomingSchedulesResponseDto = {
  count: number;
  schedules: ScheduleDto[];
};

export type SchedulePublicApiDto = {
  ScheduleDto: ScheduleDto;
  ListUpcomingSchedulesResponseDto: ListUpcomingSchedulesResponseDto;
};

// Mock 데이터 (실제 API 연동 전까지 사용)
const mockUpcomingSchedules: ListUpcomingSchedulesResponseDto = {
  count: 5,
  schedules: [
    {
      id: "schedule-001",
      title: "정기 모임",
      startTime: "2026-01-22T14:00:00",
      endTime: "2026-01-22T16:00:00",
      type: "GROUP",
      relatedEntity: {
        id: "group-001",
        name: "알고리즘 스터디",
      },
    },
    {
      id: "schedule-002",
      title: "동아리 MT",
      startTime: "2026-01-25T10:00:00",
      endTime: "2026-01-26T18:00:00",
      type: "CLUB",
      relatedEntity: null,
    },
    {
      id: "schedule-003",
      title: "개인 학습",
      startTime: "2026-01-23T19:00:00",
      endTime: "2026-01-23T21:00:00",
      type: "PERSONAL",
      relatedEntity: null,
    },
    {
      id: "schedule-004",
      title: "프로젝트 회의",
      startTime: "2026-01-24T15:00:00",
      endTime: "2026-01-24T17:00:00",
      type: "GROUP",
      relatedEntity: {
        id: "group-002",
        name: "웹 개발 프로젝트",
      },
    },
    {
      id: "schedule-005",
      title: "세미나 참석",
      startTime: "2026-01-27T13:00:00",
      endTime: "2026-01-27T15:00:00",
      type: "CLUB",
      relatedEntity: null,
    },
  ],
};

// Mock 딜레이
const MOCK_DELAY_MS = import.meta.env.VITE_MOCK_DELAY_MS
  ? Number(import.meta.env.VITE_MOCK_DELAY_MS)
  : 300;

const mockDelay = () => new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

// API functions
/**
 * 예정된 일정 조회
 * @param limit 조회할 일정 개수 (기본값: 5)
 */
const listUpcomingSchedules = async (
  limit = 5
): Promise<ListUpcomingSchedulesResponseDto> => {
  // 추후 실제 API 호출로 전환
  // const response = await apiV2Client.get<ListUpcomingSchedulesResponseDto>('/schedules/upcoming', {
  //   params: { limit },
  // });
  // return response.data;

  await mockDelay();
  return {
    ...mockUpcomingSchedules,
    schedules: mockUpcomingSchedules.schedules.slice(0, limit),
    count: Math.min(mockUpcomingSchedules.count, limit),
  };
};

export const SchedulePublicApi = {
  listUpcomingSchedules,
};
