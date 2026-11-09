import apiV2Client from "../../client/v2";
import { resolveApiUrl } from "../../client/resolveApiUrl";
import { requireIntegerId } from "../../../util/integerId";

export type CardLabelDto = "red" | "yellow" | "green" | "blue" | "purple" | "lightGray" | "gray" | "black";
export type KanbanCardDto = {
  id: string;
  title: string;
  authorName: string;
  recordCount: number;
  hasDescription: boolean;
  isInPortfolio: boolean;
  assigneeName: string | null;
  assigneeUserId: number | null;
  // 서버가 제공하는 영구 읽기 주소. 레거시 커버는 /image/{name}을 사용한다.
  coverImageUrl: string | null;
  labels: CardLabelDto[];
  isDisabled: boolean;
  createdAt: string;
};
export type KanbanListDto = {
  id: string;
  title: string;
  description: string;
  cardCount: number;
  cards: KanbanCardDto[];
};
// 고정 크기 목록은 0부터 시작하는 페이지 번호를 사용한다.
type PageMeta = { page: number; totalCount: number; receivedCount: number };
export type KanbanListPageDto = PageMeta & { lists: KanbanListDto[] };
export type KanbanCardPageDto = PageMeta & { cards: KanbanCardDto[] };
export type KanbanCardDetailDto = KanbanCardDto & { listId: string; listTitle: string; description: string; recordSort: RecordSort };
export type CardCoverImageUploadLinkDto = { url: string; fileUploadId: string };
export type CardCoverImageInput = { fileUploadId: string } | null;
export type RecordType = "tiptap" | "legacy";
export function normalizeRecordType(type: string): RecordType {
  if (type.toUpperCase() === "LEGACY") return "legacy";
  if (type.toUpperCase() === "TIPTAP") return "tiptap";
  throw new Error("기록 본문 형식을 확인할 수 없습니다.");
}
export type RecordDto = {
  type: RecordType;
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  isInPortfolio: boolean;
  // 요청자 본인이 이 기록을 개인 보관했는지 여부.
  isInUserArchive: boolean;
  files: RecordFileDto[];
};
// url은 업로드가 끝난 파일의 영구 읽기 주소이며, 업로드되지 않았으면 null이다.
export type RecordFileDto = { id: string; fileId: string; url: string | null; name: string; size: number; contentType: string };
export type RecordWithCardDto = RecordDto & { cardId: string; cardTitle: string; listId: string; listTitle: string };
export type RecordSort = "NEWEST" | "OLDEST" | "RECENTLY_UPDATED";
// 기록 본문이 참조하는 파일 하나. 새 파일은 fileId가 null이고 name·size·contentType을 함께 보낸다.
export type RecordFileInput = { id: string; fileId: string | null; name: string; size: number; contentType: string };
// 새 파일마다 파일 아이디·영구 읽기 주소와 임시 PUT 업로드 주소를 돌려준다.
export type RecordUploadDto = { id: string; fileId: string; url: string; uploadUrl: string };
export type RecordFilesUploadedResultDto = { fileId: string; isSuccess: boolean; reason: "NOT_FOUND" | "FORBIDDEN" | "DELETED" | "NOT_UPLOADED" | null };
// 기록 정렬은 카드마다 저장되는 공통 설정이다. 카드 정보 변경으로 바꾸고, 기록 목록은 서버가 그 설정으로 정렬한다.
export type RecordSortOrder = RecordSort;
export type RecordPageDto = { offset: number; totalCount: number; receivedCount: number } & { records: RecordDto[] };

export const KanbanApi = {
  async listGroupLists(groupId: string, page = 0, signal?: AbortSignal): Promise<KanbanListPageDto> {
    const data = (await apiV2Client.get<KanbanListPageDto>(`/groups/${groupId}/lists`, { params: { page }, signal })).data;
    return { ...data, lists: data.lists.map((list) => ({ ...list, id: requireIntegerId(list.id), cards: list.cards.map((card) => ({ ...card, id: requireIntegerId(card.id), coverImageUrl: card.coverImageUrl ? resolveApiUrl(card.coverImageUrl) : null })) })) };
  },
  async listGroupCards(groupId: string, listId: string, page: number, signal?: AbortSignal): Promise<KanbanCardPageDto> {
    const data = (await apiV2Client.get<KanbanCardPageDto>(`/groups/${groupId}/lists/${encodeURIComponent(listId)}/cards`, { params: { page }, signal })).data;
    return { ...data, cards: data.cards.map((card) => ({ ...card, id: requireIntegerId(card.id), coverImageUrl: card.coverImageUrl ? resolveApiUrl(card.coverImageUrl) : null })) };
  },
  async getGroupCard(groupId: string, cardId: string): Promise<KanbanCardDetailDto> {
    const card = (await apiV2Client.get<KanbanCardDetailDto>(`/groups/${groupId}/cards/${encodeURIComponent(cardId)}`)).data;
    return { ...card, id: requireIntegerId(card.id), coverImageUrl: card.coverImageUrl ? resolveApiUrl(card.coverImageUrl) : null, listId: requireIntegerId(card.listId) };
  },
  async createGroupList(groupId: string, input: { title: string }): Promise<void> {
    await apiV2Client.post(`/groups/${groupId}/lists`, input);
  },
  async updateGroupList(groupId: string, listId: string, input: { title: string; description: string }): Promise<void> {
    await apiV2Client.patch(`/groups/${groupId}/lists/${encodeURIComponent(listId)}`, input);
  },
  async deleteGroupList(groupId: string, listId: string): Promise<void> {
    await apiV2Client.delete(`/groups/${groupId}/lists/${encodeURIComponent(listId)}`);
  },
  async moveGroupList(groupId: string, listId: string, input: { beforeListId: string | null }): Promise<void> {
    await apiV2Client.patch(`/groups/${groupId}/lists/${encodeURIComponent(listId)}/position`, { insertBeforeListId: input.beforeListId ?? undefined });
  },
  // 생략한 필드는 그대로 둔다. 빈 문자열 설명은 설명을 지운다.
  async updateGroupCard(groupId: string, cardId: string, input: { title?: string; description?: string; recordSort?: RecordSort }): Promise<void> {
    await apiV2Client.patch(`/groups/${groupId}/cards/${encodeURIComponent(cardId)}`, input);
  },
  async createGroupCard(groupId: string, input: { listId: string; title: string }): Promise<void> {
    await apiV2Client.post(`/groups/${groupId}/lists/${encodeURIComponent(input.listId)}/cards`, { title: input.title });
  },
  async moveGroupCard(groupId: string, cardId: string, input: { targetListId: string; beforeCardId: string | null }): Promise<void> {
    await apiV2Client.patch(`/groups/${groupId}/cards/${encodeURIComponent(cardId)}/position`, {
      listId: input.targetListId,
      insertBeforeCardId: input.beforeCardId ?? undefined,
    });
  },
  async updateGroupCardPortfolio(groupId: string, cardId: string, input: { isInPortfolio: boolean }): Promise<void> {
    await apiV2Client.put(`/groups/${groupId}/cards/${encodeURIComponent(cardId)}/portfolio`, input);
  },
  async updateGroupCardLabels(groupId: string, cardId: string, input: { labels: CardLabelDto[] }): Promise<void> {
    await apiV2Client.put(`/groups/${groupId}/cards/${encodeURIComponent(cardId)}/labels`, input);
  },
  async updateGroupCardAssignee(groupId: string, cardId: string, input: { assigneeUserId: number | null }): Promise<void> {
    await apiV2Client.put(`/groups/${groupId}/cards/${encodeURIComponent(cardId)}/assignee`, input);
  },
  async updateGroupCardDisabled(groupId: string, cardId: string, input: { isDisabled: boolean }): Promise<void> {
    await apiV2Client.put(`/groups/${groupId}/cards/${encodeURIComponent(cardId)}/disabled`, input);
  },
  // GroupExposureApi.issueActivityReportUploadLink와 같은 presigned URL 패턴 — 파일
  // 업로드/드래그앤드롭/붙여넣기는 이 링크로 먼저 올린 뒤 fileUploadId로 커밋한다.
  async issueCardCoverImageUploadLink(groupId: string, cardId: string, input: { fileName: string; contentType: string }): Promise<CardCoverImageUploadLinkDto> {
    return (await apiV2Client.post<CardCoverImageUploadLinkDto>(`/groups/${groupId}/cards/${encodeURIComponent(cardId)}/cover-image/upload-link`, input)).data;
  },
  async uploadCardCoverImageFile(url: string, file: File): Promise<void> {
    const response = await fetch(resolveApiUrl(url), { method: "PUT", body: file });
    if (!response.ok) throw new Error("이미지 업로드에 실패했습니다.");
  },
  // 업로드한 파일 ID로 커버를 지정하고, null 입력은 커버 제거 요청으로 보낸다.
  async updateGroupCardCoverImage(groupId: string, cardId: string, input: CardCoverImageInput): Promise<void> {
    const path = `/groups/${groupId}/cards/${encodeURIComponent(cardId)}/cover-image`;
    if (input === null) {
      await apiV2Client.delete(path);
      return;
    }
    await apiV2Client.post(path, { fileUploadId: input.fileUploadId });
  },
  // 소프트 삭제다 — 보드에서 빠지고 GroupArchiveApi로 복구할 수 있다.
  async archiveGroupCard(groupId: string, cardId: string): Promise<void> {
    await apiV2Client.delete(`/groups/${groupId}/cards/${encodeURIComponent(cardId)}`);
  },
  async listGroupRecordsPage(groupId: string, cardId: string, input: {
    offset: number; limit: number; includeDeleted: boolean;
  }, signal?: AbortSignal): Promise<RecordPageDto> {
    const page = (await apiV2Client.get<RecordPageDto>(`/groups/${groupId}/cards/${encodeURIComponent(cardId)}/records`, {
      params: { offset: input.offset, limit: input.limit, includeDeleted: input.includeDeleted }, signal,
    })).data;
    return { ...page, records: page.records.map((record) => ({ ...record, id: requireIntegerId(record.id), files: record.files.map((file) => ({ ...file, url: file.url ? resolveApiUrl(file.url) : null })), type: normalizeRecordType(record.type) })) };
  },
  async archiveGroupRecord(groupId: string, recordId: string): Promise<void> {
    await apiV2Client.delete(`/groups/${groupId}/records/${encodeURIComponent(recordId)}`);
  },
  async restoreGroupRecord(groupId: string, recordId: string): Promise<void> {
    await apiV2Client.post(`/groups/${groupId}/records/${encodeURIComponent(recordId)}/restore`);
  },
  async moveGroupRecord(groupId: string, recordId: string, input: { targetCardId: string }): Promise<void> {
    await apiV2Client.put(`/groups/${groupId}/records/${encodeURIComponent(recordId)}/position`, input);
  },
  async saveGroupRecord(groupId: string, recordId: string): Promise<void> {
    await apiV2Client.put(`/groups/${groupId}/records/${encodeURIComponent(recordId)}/archive`, { isInUserArchive: true });
  },
  async updateGroupRecordPortfolio(groupId: string, recordId: string, input: { isInPortfolio: boolean }): Promise<void> {
    await apiV2Client.put(`/groups/${groupId}/records/${encodeURIComponent(recordId)}/portfolio`, input);
  },
  async getGroupRecord(groupId: string, recordId: string): Promise<RecordWithCardDto | null> {
    const record = (await apiV2Client.get<RecordWithCardDto | null>(`/groups/${groupId}/records/${encodeURIComponent(recordId)}`)).data;
    return record ? { ...record, id: requireIntegerId(record.id), files: record.files.map((file) => ({ ...file, url: file.url ? resolveApiUrl(file.url) : null })), cardId: requireIntegerId(record.cardId), listId: requireIntegerId(record.listId), type: normalizeRecordType(record.type) } : null;
  },
  async createGroupRecord(groupId: string, cardId: string, input: { content: string; files: RecordFileInput[] }): Promise<RecordDto & { uploads: RecordUploadDto[] }> {
    const record = (await apiV2Client.post<RecordDto & { uploads: RecordUploadDto[] }>(`/groups/${groupId}/cards/${encodeURIComponent(cardId)}/records`, input)).data;
    return { ...record, uploads: record.uploads.map((upload) => ({ ...upload, url: resolveApiUrl(upload.url), uploadUrl: resolveApiUrl(upload.uploadUrl) })), id: requireIntegerId(record.id), files: record.files.map((file) => ({ ...file, url: file.url ? resolveApiUrl(file.url) : null })), type: normalizeRecordType(record.type) };
  },
  async updateGroupRecord(groupId: string, recordId: string, input: { content: string; files: RecordFileInput[] }): Promise<{ uploads: RecordUploadDto[] }> {
    const data = (await apiV2Client.patch<{ uploads: RecordUploadDto[] }>(`/groups/${groupId}/records/${encodeURIComponent(recordId)}`, input)).data;
    return { uploads: data.uploads.map((upload) => ({ ...upload, url: resolveApiUrl(upload.url), uploadUrl: resolveApiUrl(upload.uploadUrl) })) };
  },
  // 업로드 주소로 파일을 올린 뒤 서버에 알린다. 모두 성공 200, 일부 성공 206, 모두 실패 400이며 본문은 같다.
  async notifyRecordFilesUploaded(groupId: string, fileIds: string[]): Promise<RecordFilesUploadedResultDto[]> {
    const response = await apiV2Client.post<{ results: RecordFilesUploadedResultDto[] }>(`/groups/${groupId}/records/files/uploaded`, { fileIds }, {
      validateStatus: (status) => status === 200 || status === 206 || status === 400,
    });
    if (!Array.isArray(response.data.results)) throw new Error("첨부 파일의 업로드 완료 처리를 하지 못했습니다.");
    return response.data.results;
  },
};
