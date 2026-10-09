import apiV2Client from "../../client/v2";

export type GroupMemberDto = {
  userId: number;
  name: string;
  college: string;
  isLeader: boolean;
  cardCount: number;
  recordCount: number;
};
export const GroupMemberListApi = {
  async listGroupMembers(groupId: number): Promise<GroupMemberDto[]> {
    return (await apiV2Client.get<GroupMemberDto[]>(`/groups/${groupId}/members`)).data;
  },
  async kickGroupMember(groupId: number, memberId: number): Promise<void> {
    await apiV2Client.delete(`/groups/${groupId}/members/${memberId}`);
  },
  async delegateGroupLeader(groupId: number, memberId: number): Promise<void> {
    await apiV2Client.patch(`/groups/${groupId}/master`, { memberId });
  },
};
