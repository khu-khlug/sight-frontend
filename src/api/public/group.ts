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
};

// API functions
/**
 * 그룹 목록 조회
 * @param request 페이지네이션 및 필터 옵션
 */
const listGroups = async (
  request: ListGroupsRequestDto = {}
): Promise<ListGroupsResponseDto> => {
  const { offset = 0, limit = 10, bookmarked } = request;
  const response = await apiV2Client.get<ListGroupsResponseDto>("/groups", {
    params: { offset, limit, bookmarked },
  });
  return response.data;
};

/**
 * 즐겨찾기한 그룹 목록 조회
 */
const listBookmarkedGroups = async (): Promise<ListGroupsResponseDto> => {
  return listGroups({ bookmarked: true });
};

export const GroupPublicApi = {
  listGroups,
  listBookmarkedGroups,
};
