import apiV2Client from "../../client/v2";
import type { RecordFileDto, RecordType } from "./KanbanApi";

export type ArchivedCardDto = { id: string; title: string; authorName: string; recordCount: number; createdAt: string; deletedAt: string };
export type SavedRecordDto = { files?: RecordFileDto[]; type: RecordType; id: number; content: string; cardId: string; cardTitle: string; authorName: string; createdAt: string; savedAt: string };
type PageMeta = { skip: number; totalCount: number; receivedCount: number };
type SavedRecordResponseDto = Omit<SavedRecordDto, "id"> & { recordId: number };
export const GroupArchiveApi = {
  // 삭제된 카드는 최근 삭제순으로 20개씩 받는다.
  async listDeletedGroupCardsPage(groupId: number, skip: number, signal?: AbortSignal): Promise<PageMeta & { cards: ArchivedCardDto[] }> {
    return (await apiV2Client.get<PageMeta & { cards: ArchivedCardDto[] }>(`/groups/${groupId}/deleted-cards`, { params: { skip }, signal })).data;
  },
  async restoreGroupCard(groupId: number, cardId: string, input: { targetListId: string }): Promise<void> {
    await apiV2Client.post(`/groups/${groupId}/deleted-cards/${encodeURIComponent(cardId)}/restore`, input);
  },
  // 보관한 기록은 최근 보관순으로 10개씩 받는다.
  async listSavedGroupRecordsPage(groupId: number, skip: number, signal?: AbortSignal): Promise<PageMeta & { records: SavedRecordDto[] }> {
    const { records, ...meta } = (await apiV2Client.get<PageMeta & { records: SavedRecordResponseDto[] }>(`/groups/${groupId}/saved-records`, { params: { skip }, signal })).data;
    return { ...meta, records: records.map(({ recordId, ...record }) => ({ ...record, id: recordId })) };
  },
  async removeSavedGroupRecord(groupId: number, recordId: number): Promise<void> {
    await apiV2Client.put(`/groups/${groupId}/records/${encodeURIComponent(recordId)}/archive`, { isInUserArchive: false });
  },
};
