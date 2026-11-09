import apiV2Client from "../../client/v2";

export type GroupMemberDto = {
  userId: number;
  name: string;
  college: string;
  isLeader: boolean;
  cardCount: number;
  recordCount: number;
};
// 서버는 그룹장을 맨 앞에 두고 나머지를 실명순으로 정렬해 보낸다.
type GroupMembersResponseDto = { leaderUserId: number | null; members: Omit<GroupMemberDto, "isLeader">[] };
export const GroupMemberListApi = {
  async listGroupMembers(groupId: string): Promise<GroupMemberDto[]> {
    const response = (await apiV2Client.get<GroupMembersResponseDto>(`/groups/${groupId}/members`)).data;
    return response.members.map((member) => ({ ...member, isLeader: member.userId === response.leaderUserId }));
  },
  async kickGroupMember(groupId: string, memberId: number): Promise<void> {
    await apiV2Client.delete(`/groups/${groupId}/members/${memberId}`);
  },
  async delegateGroupLeader(groupId: string, memberId: number): Promise<void> {
    await apiV2Client.put(`/groups/${groupId}/leader`, { userId: memberId });
  },
};
