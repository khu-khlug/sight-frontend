import apiV2Client from "../../client/v2";
import type { SavedRecordDto } from "./GroupArchiveApi";

export type CardLabelDto = "red" | "yellow" | "green" | "blue" | "purple" | "lightGray" | "gray" | "black";
export type KanbanCardDto = {
  id: string;
  title: string;
  authorName: string;
  recordCount: number;
  hasDescription: boolean;
  portfolio: boolean;
  assigneeName: string | null;
  assigneeUserId: number | null;
  inheritedFrom: string | null;
  coverImageUrl: string | null;
  labels: CardLabelDto[];
  disabled: boolean;
  createdAt: string;
};
export type KanbanListDto = {
  id: string;
  title: string;
  description: string;
  cards: KanbanCardDto[];
};
export type CardCoverImageUploadLinkDto = { url: string; fileUploadId: string };
export type CardCoverImageInput = { coverImageUrl: string | null } | { fileUploadId: string };
// fileUrl은 업로드가 끝난 뒤 기록 본문(img/audio src, 파일 다운로드 링크)에 그대로 넣는 주소다.
export type RecordMediaUploadLinkDto = { url: string; fileUploadId: string; fileUrl: string };
export type RecordType = "tiptap" | "legacy";
export type RecordDto = {
  type: RecordType;
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
};
export type RecordWithCardDto = RecordDto & { cardId: string; cardTitle: string };
export type RecordSortOrder = "newest" | "oldest" | "recentlyUpdated";
export type RecordPageDto = { records: RecordDto[]; count: number };

export const KanbanApi = {
  async listGroupLists(groupId: number): Promise<KanbanListDto[]> {
    return (await apiV2Client.get<KanbanListDto[]>(`/groups/${groupId}/kanban`)).data;
  },
  async createGroupList(groupId: number, input: { title: string }): Promise<void> {
    await apiV2Client.post(`/groups/${groupId}/lists`, input);
  },
  async updateGroupList(groupId: number, listId: string, input: { title: string; description: string }): Promise<void> {
    await apiV2Client.patch(`/groups/${groupId}/lists/${encodeURIComponent(listId)}`, input);
  },
  async deleteGroupList(groupId: number, listId: string): Promise<void> {
    await apiV2Client.delete(`/groups/${groupId}/lists/${encodeURIComponent(listId)}`);
  },
  async moveGroupList(groupId: number, listId: string, input: { beforeListId: string | null }): Promise<void> {
    await apiV2Client.patch(`/groups/${groupId}/lists/${encodeURIComponent(listId)}/position`, input);
  },
  async createGroupCard(groupId: number, input: { listId: string; title: string }): Promise<void> {
    await apiV2Client.post(`/groups/${groupId}/cards`, input);
  },
  async moveGroupCard(groupId: number, cardId: string, input: { targetListId: string; beforeCardId: string | null }): Promise<void> {
    await apiV2Client.patch(`/groups/${groupId}/cards/${encodeURIComponent(cardId)}/position`, input);
  },
  async updateGroupCardPortfolio(groupId: number, cardId: string, input: { portfolio: boolean }): Promise<void> {
    await apiV2Client.patch(`/groups/${groupId}/cards/${encodeURIComponent(cardId)}/portfolio`, input);
  },
  async updateGroupCardLabels(groupId: number, cardId: string, input: { labels: CardLabelDto[] }): Promise<void> {
    await apiV2Client.patch(`/groups/${groupId}/cards/${encodeURIComponent(cardId)}/labels`, input);
  },
  async updateGroupCardAssignee(groupId: number, cardId: string, input: { assigneeUserId: number | null }): Promise<void> {
    await apiV2Client.patch(`/groups/${groupId}/cards/${encodeURIComponent(cardId)}/assignee`, input);
  },
  async updateGroupCardDisabled(groupId: number, cardId: string, input: { disabled: boolean }): Promise<void> {
    await apiV2Client.patch(`/groups/${groupId}/cards/${encodeURIComponent(cardId)}/disabled`, input);
  },
  // GroupExposureApi.issueActivityReportUploadLink와 같은 presigned URL 패턴 — 파일
  // 업로드/드래그앤드롭/붙여넣기는 이 링크로 먼저 올린 뒤 fileUploadId로 커밋한다.
  async issueCardCoverImageUploadLink(groupId: number, cardId: string, input: { fileName: string; contentType: string }): Promise<CardCoverImageUploadLinkDto> {
    return (await apiV2Client.post<CardCoverImageUploadLinkDto>(`/groups/${groupId}/cards/${encodeURIComponent(cardId)}/cover-image/upload-link`, input)).data;
  },
  async uploadCardCoverImageFile(url: string, file: File): Promise<void> {
    const response = await fetch(url, { method: "PUT", body: file });
    if (!response.ok) throw new Error("이미지 업로드에 실패했습니다.");
  },
  // URL은 coverImageUrl로, 업로드한 파일은 fileUploadId로 설정하고 null로 커버를 제거한다.
  async updateGroupCardCoverImage(groupId: number, cardId: string, input: CardCoverImageInput): Promise<void> {
    await apiV2Client.patch(`/groups/${groupId}/cards/${encodeURIComponent(cardId)}/cover-image`, input);
  },
  // 완전 삭제가 아니라 아카이브다 — 보드에서 빠지고 GroupArchiveApi로 복구할 수 있다.
  async archiveGroupCard(groupId: number, cardId: string): Promise<void> {
    await apiV2Client.delete(`/groups/${groupId}/cards/${encodeURIComponent(cardId)}`);
  },
  async listGroupRecords(groupId: number, cardId: string): Promise<RecordDto[]> {
    return (await apiV2Client.get<RecordDto[]>(`/groups/${groupId}/cards/${encodeURIComponent(cardId)}/records`)).data;
  },
  async listGroupRecordsPage(groupId: number, cardId: string, input: {
    offset: number; limit: number; sortOrder: RecordSortOrder; includeDeleted: boolean;
  }, signal?: AbortSignal): Promise<RecordPageDto> {
    return (await apiV2Client.get<RecordPageDto>(`/groups/${groupId}/cards/${encodeURIComponent(cardId)}/records`, {
      params: input, signal,
    })).data;
  },
  async archiveGroupRecord(groupId: number, cardId: string, recordId: string): Promise<void> {
    await apiV2Client.delete(`/groups/${groupId}/cards/${encodeURIComponent(cardId)}/records/${encodeURIComponent(recordId)}`);
  },
  async restoreGroupRecord(groupId: number, cardId: string, recordId: string): Promise<void> {
    await apiV2Client.post(`/groups/${groupId}/cards/${encodeURIComponent(cardId)}/records/${encodeURIComponent(recordId)}/restoration`);
  },
  // TODO(mock): 기록 이동/개인 보관은 백엔드 계약 확정 전 개발 목업 경로다.
  async moveGroupRecord(groupId: number, cardId: string, recordId: string, input: { targetCardId: string }): Promise<void> {
    await apiV2Client.patch(`/groups/${groupId}/cards/${encodeURIComponent(cardId)}/records/${encodeURIComponent(recordId)}/card`, input);
  },
  async saveGroupRecord(groupId: number, cardId: string, recordId: string): Promise<SavedRecordDto> {
    return (await apiV2Client.post<SavedRecordDto>(`/groups/${groupId}/cards/${encodeURIComponent(cardId)}/records/${encodeURIComponent(recordId)}/saving`)).data;
  },
  // TODO(mock): 기록 단건조회는 아직 백엔드 계약이 없다(knowledge/frontend/
  // group-detail-api-design.md의 getGroupRecord 참고). 역방향(기록id -> 카드id) 조회 API가
  // 생기기 전까지, 이미 있는 목록 API로 전체 카드를 뒤져서 같은 모양의 응답을 흉내낸다.
  async getGroupRecord(groupId: number, recordId: string): Promise<RecordWithCardDto | null> {
    const lists = await KanbanApi.listGroupLists(groupId);
    for (const list of lists) {
      for (const card of list.cards) {
        const records = await KanbanApi.listGroupRecords(groupId, card.id);
        const record = records.find((item) => item.id === recordId);
        if (record) return { ...record, cardId: card.id, cardTitle: card.title };
      }
    }
    return null;
  },
  async createGroupRecord(groupId: number, cardId: string, input: { content: string }): Promise<RecordDto> {
    return (await apiV2Client.post<RecordDto>(`/groups/${groupId}/cards/${encodeURIComponent(cardId)}/records`, input)).data;
  },
  async updateGroupRecord(groupId: number, cardId: string, recordId: string, input: { content: string }): Promise<void> {
    await apiV2Client.patch(`/groups/${groupId}/cards/${encodeURIComponent(cardId)}/records/${encodeURIComponent(recordId)}`, input);
  },
  // TODO(mock): 기록 본문 첨부(이미지·오디오·파일) 업로드는 아직 백엔드 계약이 없다. 커버 이미지와
  // 같은 presigned URL 패턴으로 목업 서버가 응답한다 — 계약이 정해지면 이 두 함수의 본문만 바꾼다.
  async issueRecordMediaUploadLink(groupId: number, cardId: string, input: { fileName: string; contentType: string }): Promise<RecordMediaUploadLinkDto> {
    return (await apiV2Client.post<RecordMediaUploadLinkDto>(`/groups/${groupId}/cards/${encodeURIComponent(cardId)}/records/media/upload-link`, input)).data;
  },
  async uploadRecordMediaFile(url: string, file: File, signal?: AbortSignal): Promise<void> {
    const response = await fetch(url, { method: "PUT", body: file, signal });
    if (!response.ok) throw new Error("파일 업로드에 실패했습니다.");
  },
};
