import apiV2Client from "../../client/v2";

export type ActivityLogEntryDto = { id: string; memberName: string; message: string; createdAt: string };
export const GroupActivityLogApi = {
  async listGroupLogs(groupId: number): Promise<ActivityLogEntryDto[]> {
    return (await apiV2Client.get<ActivityLogEntryDto[]>(`/groups/${groupId}/logs`)).data;
  },
};
