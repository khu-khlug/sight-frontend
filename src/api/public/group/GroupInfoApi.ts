import apiV2Client from "../../client/v2";
import type { GroupInfoDto, GroupInfoResponseDto } from "./types";

export const GroupInfoApi = {
  async getGroup(groupId: number): Promise<GroupInfoDto> {
    const info = (await apiV2Client.get<GroupInfoResponseDto>(`/groups/${groupId}/info`)).data;
    const { requesterInfo, activity, exposure } = info;
    return {
      id: info.id, title: info.title, category: info.category, status: info.status, visibility: info.visibility,
      isLeader: requesterInfo.userRole === "LEADER", isMember: requesterInfo.userRole !== "NONE",
      hasChatRoom: info.hasChatRoom, isChatParticipant: requesterInfo.isInChatRoom, isBookmarked: requesterInfo.isBookmarked,
      chatRoomUrl: info.chatRoomUrl ?? null,
      memberCount: info.memberCount, description: info.description ?? "", interests: info.interests ?? [],
      techStack: info.techStack ?? [], allowJoin: info.allowJoin, repositoryUrls: info.repositoryUrls ?? [],
      hasPublishedPortfolio: exposure.isPortfolioPublished,
      specialOrganizations: info.specialOrganization ? [info.specialOrganization] : [],
      listCount: activity.listCount, cardCount: activity.cardCount, recordCount: activity.recordCount,
      seminarCount: exposure.seminarCount, reportCount: exposure.reportCount,
      portfolioListCount: exposure.portfolioListCount, portfolioCardCount: exposure.portfolioCardCount,
      createdAt: info.createdAt, lastActivityAt: info.lastActivityAt,
    };
  },
  async joinGroup(groupId: number): Promise<void> {
    await apiV2Client.post(`/groups/${groupId}/members/@me`);
  },
  async addGroupBookmark(groupId: number): Promise<void> {
    await apiV2Client.post(`/groups/${groupId}/bookmark`);
  },
  async removeGroupBookmark(groupId: number): Promise<void> {
    await apiV2Client.delete(`/groups/${groupId}/bookmark`);
  },
};
