import apiV2Client from "../../client/v2";
import type { GroupInfoDto } from "./types";

export const GroupInfoApi = {
  async getGroup(groupId: number): Promise<GroupInfoDto> {
    return (await apiV2Client.get<GroupInfoDto>(`/groups/${groupId}`)).data;
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
