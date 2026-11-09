import type { InfiniteData, QueryClient } from "@tanstack/react-query";

import { GroupArchiveApi } from "../../../api/public/group/GroupArchiveApi";
import { KanbanApi, type RecordPageDto } from "../../../api/public/group/KanbanApi";

// 보관 여부는 기록 응답의 isInUserArchive가 알려 준다. 바꾼 뒤 카드 창이 이미 받아 둔 기록 목록에도 바로 반영하고,
// 나머지(보관한 기록 탭 등)는 useGroupAction이 그룹 쿼리를 무효화해 다시 받는다.
function setRecordSaved(client: QueryClient, groupId: string, recordId: string, isInUserArchive: boolean) {
  client.setQueriesData<InfiniteData<RecordPageDto>>({ queryKey: ["group-detail", groupId, "kanban"] }, (data) => {
    if (!data || !Array.isArray(data.pages) || !data.pages.every((page) => Array.isArray(page?.records))) return data;
    return {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        records: page.records.map((record) => record.id === recordId ? { ...record, isInUserArchive } : record),
      })),
    };
  });
}

export const groupSavedRecords = {
  async insert(client: QueryClient, groupId: string, recordId: string): Promise<void> {
    await KanbanApi.saveGroupRecord(groupId, recordId);
    setRecordSaved(client, groupId, recordId, true);
    await client.invalidateQueries({ queryKey: ["saved-records-page"] });
    await client.invalidateQueries({ queryKey: ["group-detail", groupId] });
  },
  async remove(client: QueryClient, groupId: string, recordId: string): Promise<void> {
    await GroupArchiveApi.removeSavedGroupRecord(groupId, recordId);
    setRecordSaved(client, groupId, recordId, false);
    await client.invalidateQueries({ queryKey: ["saved-records-page"] });
    await client.invalidateQueries({ queryKey: ["group-detail", groupId] });
  },
};
