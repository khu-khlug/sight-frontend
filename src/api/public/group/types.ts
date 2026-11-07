import type { GroupCategory, GroupInterest, GroupStatus, GroupVisibility, SpecialOrganization } from "../../../constant";

// 정보·설정·활동공개·개발용 API에서 함께 사용하는 그룹 정보 타입.
export type GroupInfoDto = {
  id: string;
  title: string;
  category: GroupCategory;
  status: GroupStatus;
  visibility: GroupVisibility;
  isLeader: boolean;
  isMember: boolean;
  hasChatRoom: boolean;
  chatRoomUrl: string | null;
  isChatParticipant: boolean;
  isBookmarked: boolean;
  memberCount: number;
  description: string;
  interests: GroupInterest[];
  techStack: string[];
  allowJoin: boolean;
  repositoryUrls: string[];
  hasPublishedPortfolio: boolean;
  specialOrganizations: SpecialOrganization[];
  listCount: number;
  cardCount: number;
  recordCount: number;
  seminarCount: number;
  reportCount: number;
  portfolioListCount: number;
  portfolioCardCount: number;
  createdAt: string;
  lastActivityAt: string;
};

// 그룹 정보 조회 API의 응답 형태. GroupInfoApi가 화면용 GroupInfoDto로 바꾼다.
export type GroupInfoResponseDto = {
  id: string;
  title: string;
  description: string | null;
  category: GroupCategory;
  status: GroupStatus;
  requesterInfo: { userRole: "NONE" | "MEMBER" | "LEADER"; isBookmarked: boolean; isInChatRoom: boolean };
  specialOrganization: SpecialOrganization | null;
  interests: GroupInterest[] | null;
  techStack: string[] | null;
  repositoryUrls: string[] | null;
  memberCount: number;
  activity: { listCount: number; cardCount: number; recordCount: number };
  createdAt: string;
  lastActivityAt: string;
  allowJoin: boolean;
  visibility: GroupVisibility;
  exposure: { isPortfolioPublished: boolean; portfolioListCount: number; portfolioCardCount: number; seminarCount: number; reportCount: number };
  hasChatRoom: boolean;
  chatRoomUrl: string | null;
};
// 개발용 시나리오에서 바꿀 수 있는 그룹 정보. 그룹장 지정은 목업 서버가 회원 아이디로 처리한다.
export type GroupScenarioInfo = Partial<Omit<GroupInfoDto, "isLeader">> & { leaderUserId?: number };
