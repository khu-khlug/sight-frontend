import apiV2Client from "../../client/v2";
import type { RecordType } from "./KanbanApi";

export type ArchivedCardDto = { id: string; title: string; authorName: string; recordCount: number; createdAt: string; deletedAt: string };
export type SavedRecordDto = { type: RecordType; id: string; content: string; cardId: string; cardTitle: string; authorName: string; createdAt: string; savedAt: string };
export const GroupArchiveApi = {
  async listArchivedGroupCards(groupId: number): Promise<ArchivedCardDto[]> {
    return (await apiV2Client.get<ArchivedCardDto[]>(`/groups/${groupId}/archived-cards`)).data;
  },
  async restoreGroupCard(groupId: number, cardId: string, input: { targetListId: string }): Promise<void> {
    await apiV2Client.post(`/groups/${groupId}/archived-cards/${encodeURIComponent(cardId)}/restoration`, input);
  },
  async listSavedGroupRecords(groupId: number): Promise<SavedRecordDto[]> {
    return (await apiV2Client.get<SavedRecordDto[]>(`/groups/${groupId}/saved-records`)).data;
  },
  async removeSavedGroupRecord(groupId: number, recordId: string): Promise<void> {
    await apiV2Client.delete(`/groups/${groupId}/saved-records/${encodeURIComponent(recordId)}`);
  },
};
