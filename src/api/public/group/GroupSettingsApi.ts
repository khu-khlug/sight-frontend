import apiV2Client from "../../client/v2";
import type { GroupInfoDto } from "./types";

export type UpdateGroupRequestDto = Pick<GroupInfoDto, "title" | "category" | "description" | "interests" | "techStack" | "repositoryUrls" | "allowJoin" | "visibility">;
export const GroupSettingsApi = {
  async updateGroup(groupId: number, input: UpdateGroupRequestDto): Promise<void> {
    await apiV2Client.put(`/groups/${groupId}`, input);
  },
  async updateGroupState(groupId: number, input: { status: GroupInfoDto["status"] }): Promise<void> {
    await apiV2Client.patch(`/groups/${groupId}/state`, input);
  },
  async updateGroupStateAsManager(groupId: number, input: { status: GroupInfoDto["status"] }): Promise<void> {
    await apiV2Client.patch(`/manager/groups/${groupId}/state`, input);
  },
  async leaveGroup(groupId: number): Promise<void> {
    await apiV2Client.delete(`/groups/${groupId}/members/@me`);
  },
};
