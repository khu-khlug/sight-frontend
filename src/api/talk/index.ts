import apiV2Client from "../client/v2";
import type { ListTalksRequest, ListTalksResponse } from "./types";

/**
 * 담소 목록 조회
 * @param request 페이지네이션 옵션 (offset, limit)
 */
const listTalks = async (
  request: ListTalksRequest = {}
): Promise<ListTalksResponse> => {
  const { offset = 0, limit = 10 } = request;
  const response = await apiV2Client.get<ListTalksResponse>("/talks", {
    params: { offset, limit },
  });
  return response.data;
};

export const TalkApi = {
  listTalks,
};
