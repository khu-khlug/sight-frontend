// DTOs
export type TipType = "INFO" | "WARNING";

export type TipDto = {
  id: string | null;
  content: string | null;
  type: TipType | null;
};

export type TipPublicApiDto = {
  TipDto: TipDto;
};

// Mock 데이터 (실제 API 연동 전까지 사용)
const mockCurrentTip: TipDto = {
  id: "tip-001",
  content: "그룹 활동에 적극적으로 참여하면 포인트를 획득할 수 있습니다!",
  type: "INFO",
};

// Mock 딜레이
const MOCK_DELAY_MS = import.meta.env.VITE_MOCK_DELAY_MS
  ? Number(import.meta.env.VITE_MOCK_DELAY_MS)
  : 300;

const mockDelay = () => new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

// API functions
/**
 * 현재 표시할 팁 조회
 */
const getCurrentTip = async (): Promise<TipDto> => {
  // 추후 실제 API 호출로 전환
  // const response = await apiV2Client.get<TipDto>('/tips/current');
  // return response.data;

  await mockDelay();
  return mockCurrentTip;
};

export const TipPublicApi = {
  getCurrentTip,
};
