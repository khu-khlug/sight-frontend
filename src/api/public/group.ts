// DTOs
export type GroupLeaderDto = {
  id: string;
  name: string;
};

export type BookmarkedGroupDto = {
  id: string;
  category: string;
  name: string;
  leader: GroupLeaderDto;
};

export type ListBookmarkedGroupsResponseDto = {
  count: number;
  groups: BookmarkedGroupDto[];
};

export type GroupPublicApiDto = {
  BookmarkedGroupDto: BookmarkedGroupDto;
  ListBookmarkedGroupsResponseDto: ListBookmarkedGroupsResponseDto;
};

// Mock 데이터 (실제 API 연동 전까지 사용)
const mockBookmarkedGroups: ListBookmarkedGroupsResponseDto = {
  count: 3,
  groups: [
    {
      id: "group-001",
      category: "스터디",
      name: "알고리즘 스터디",
      leader: {
        id: "user-001",
        name: "홍길동",
      },
    },
    {
      id: "group-002",
      category: "프로젝트",
      name: "웹 개발 프로젝트",
      leader: {
        id: "user-002",
        name: "김철수",
      },
    },
    {
      id: "group-003",
      category: "스터디",
      name: "머신러닝 스터디",
      leader: {
        id: "user-003",
        name: "이영희",
      },
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
 * 즐겨찾기한 그룹 목록 조회
 */
const listBookmarkedGroups = async (): Promise<ListBookmarkedGroupsResponseDto> => {
  // 추후 실제 API 호출로 전환
  // const response = await apiV2Client.get<ListBookmarkedGroupsResponseDto>('/groups', {
  //   params: { bookmarked: true },
  // });
  // return response.data;

  await mockDelay();
  return mockBookmarkedGroups;
};

export const GroupPublicApi = {
  listBookmarkedGroups,
};
