import apiV2Client from "../client/v2";

// DTOs
export type GetCurrentTipResponseDto = {
  content: string;
};

export type TipPublicApiDto = {
  GetCurrentTipResponseDto: GetCurrentTipResponseDto;
};

// API functions
/**
 * 현재 표시할 팁 조회
 */
const getCurrentTip = async (): Promise<GetCurrentTipResponseDto> => {
  const response = await apiV2Client.get<GetCurrentTipResponseDto>("/tip");
  return response.data;
};

export const TipPublicApi = {
  getCurrentTip,
};
