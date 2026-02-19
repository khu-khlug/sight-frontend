import apiV2Client from "../client/v2";

// DTOs
export type GroupLeaderDto = {
  userId: number;
  name: string;
};

export type GroupDto = {
  id: number;
  category: string;
  title: string;
  state: string;
  countMember: number;
  allowJoin: boolean;
  createdAt: string;
  leader: GroupLeaderDto;
};

export type ListGroupsResponseDto = {
  count: number;
  groups: GroupDto[];
};

export type ListGroupsRequestDto = {
  offset?: number;
  limit?: number;
  bookmarked?: boolean;
  joined?: boolean;
  orderBy?: "changedAt" | "createdAt";
};

// API functions
/**
 * 그룹 목록 조회
 * @param request 페이지네이션 및 필터 옵션
 */
const listGroups = async (
  request: ListGroupsRequestDto = {}
): Promise<ListGroupsResponseDto> => {
  const { offset = 0, limit = 10, bookmarked, joined, orderBy } = request;
  const response = await apiV2Client.get<ListGroupsResponseDto>("/groups", {
    params: { offset, limit, bookmarked, joined, orderBy },
  });
  return response.data;
};

/**
 * 최근 활동한 그룹 목록 조회 (가입한 그룹 중 최근 변경된 순으로)
 * @param limit 조회할 그룹 수 (기본값: 6)
 */
const listRecentGroups = async (limit: number = 6): Promise<ListGroupsResponseDto> => {
  return listGroups({ joined: true, orderBy: "changedAt", limit });
};

export const GroupPublicApi = {
  listGroups,
  listRecentGroups,
};
