import apiV2Client from "../../client/v2";

// actor는 시스템이 남긴 로그면 null이다. logData는 logType에 대응하는 객체이며, LEGACY는 { html }이다.
export type ActivityLogEntryDto = {
  id: number;
  actor: { userId: number; name: string } | null;
  logType: string;
  logData: Record<string, unknown>;
  createdAt: string;
};
export type ActivityLogPageDto = { page: number; totalCount: number; receivedCount: number; logs: ActivityLogEntryDto[] };

export const GroupActivityLogApi = {
  // 최신 로그부터 50개씩 받는다.
  async listGroupLogsPage(groupId: number, page: number, signal?: AbortSignal): Promise<ActivityLogPageDto> {
    return (await apiV2Client.get<ActivityLogPageDto>(`/groups/${groupId}/logs`, { params: { page }, signal })).data;
  },
};
