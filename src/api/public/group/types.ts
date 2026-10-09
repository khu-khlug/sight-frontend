import type { GroupCategory, GroupInterest, GroupStatus, GroupVisibility, SpecialOrganization } from "../../../constant";

// 정보·설정·활동공개·개발용 API에서 함께 사용하는 그룹 정보 타입.
export type GroupInfoDto = {
  id: number;
  title: string;
  category: GroupCategory;
  status: GroupStatus;
  visibility: GroupVisibility;
  leaderUserId: number;
  isMember: boolean;
  hasChatRoom: boolean;
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
  archivedCardCount: number;
  savedRecordCount: number;
  createdAt: string;
  lastActivityAt: string;
};
