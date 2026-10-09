import { queryOptions, type QueryClient } from "@tanstack/react-query";

import { GroupArchiveApi, type SavedRecordDto } from "../../../api/public/group/GroupArchiveApi";
import { KanbanApi } from "../../../api/public/group/KanbanApi";

const queryKey = (groupId: number) => ["group-detail", groupId, "saved-records"] as const;

// 목록의 단일 소유자는 QueryClient 캐시다. 기록 버튼과 보관함은 같은 조회/변경 진입점을 쓴다.
export const groupSavedRecords = {
  queryOptions(groupId: number) {
    return queryOptions({
      queryKey: queryKey(groupId),
      queryFn: () => GroupArchiveApi.listSavedGroupRecords(groupId),
      staleTime: 30_000,
    });
  },
  async insert(client: QueryClient, groupId: number, record: Omit<SavedRecordDto, "savedAt">): Promise<void> {
    await client.ensureQueryData(groupSavedRecords.queryOptions(groupId));
    const saved = await KanbanApi.saveGroupRecord(groupId, record.cardId, record.id);
    await client.cancelQueries({ queryKey: queryKey(groupId), exact: true });
    client.setQueryData<SavedRecordDto[]>(queryKey(groupId), (records = []) =>
      records.some((item) => item.id === saved.id)
        ? records.map((item) => item.id === saved.id ? saved : item) : [saved, ...records]);
  },
  async remove(client: QueryClient, groupId: number, recordId: string): Promise<void> {
    await GroupArchiveApi.removeSavedGroupRecord(groupId, recordId);
    await client.cancelQueries({ queryKey: queryKey(groupId), exact: true });
    client.setQueryData<SavedRecordDto[]>(queryKey(groupId), (records) =>
      records?.filter((record) => record.id !== recordId));
  },
};
