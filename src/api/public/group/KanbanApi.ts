import apiV2Client from "../../client/v2";

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
// 목록 응답 공통 형태. 다음 시작 위치는 skip + receivedCount다.
type PageMeta = { skip: number; totalCount: number; receivedCount: number };
export type KanbanListPageDto = PageMeta & { lists: KanbanListDto[] };
export type KanbanCardPageDto = PageMeta & { cards: KanbanCardDto[] };
export type KanbanCardDetailDto = KanbanCardDto & { listId: string; listTitle: string; description: string; recordSort: RecordSort };
export type CardCoverImageUploadLinkDto = { url: string; fileUploadId: string };
export type CardCoverImageInput = { coverImageUrl: string | null } | { fileUploadId: string };
export type RecordType = "tiptap" | "legacy";
export type RecordDto = {
  type: RecordType;
  id: number;
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
// url은 업로드가 끝난 파일의 읽기 링크이며, 업로드되지 않았으면 null이다.
export type RecordFileDto = { id: string; fileId: string; url: string | null; name: string; size: number; contentType: string };
export type RecordWithCardDto = RecordDto & { cardId: string; cardTitle: string; listId: string; listTitle: string };
export type RecordSort = "NEWEST" | "OLDEST" | "RECENTLY_UPDATED";
// 기록 본문이 참조하는 파일 하나. 새 파일은 fileId가 null이고 name·size·contentType을 함께 보낸다.
export type RecordFileInput = { id: string; fileId: string | null; name: string; size: number; contentType: string };
// 새 파일마다 서버가 백엔드 파일 아이디와 PUT 업로드 주소를 돌려준다.
export type RecordUploadDto = { id: string; fileId: string; uploadUrl: string };
export type RecordFilesUploadedResultDto = { fileId: string; isSuccess: boolean; reason: "NOT_FOUND" | "FORBIDDEN" | "DELETED" | "NOT_UPLOADED" | null };
// 기록 정렬은 카드마다 저장되는 공통 설정이다. 카드 정보 변경으로 바꾸고, 기록 목록은 서버가 그 설정으로 정렬한다.
export type RecordSortOrder = RecordSort;
export type RecordPageDto = PageMeta & { records: RecordDto[] };

export const KanbanApi = {
  async listGroupLists(groupId: number, skip = 0, signal?: AbortSignal): Promise<KanbanListPageDto> {
    return (await apiV2Client.get<KanbanListPageDto>(`/groups/${groupId}/lists`, { params: { skip }, signal })).data;
  },
  async listGroupCards(groupId: number, listId: string, skip: number, signal?: AbortSignal): Promise<KanbanCardPageDto> {
    return (await apiV2Client.get<KanbanCardPageDto>(`/groups/${groupId}/lists/${encodeURIComponent(listId)}/cards`, { params: { skip }, signal })).data;
  },
  async getGroupCard(groupId: number, cardId: string): Promise<KanbanCardDetailDto> {
    return (await apiV2Client.get<KanbanCardDetailDto>(`/groups/${groupId}/cards/${encodeURIComponent(cardId)}`)).data;
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
    await apiV2Client.patch(`/groups/${groupId}/lists/${encodeURIComponent(listId)}/position`, { insertBeforeListId: input.beforeListId ?? undefined });
  },
  // 생략한 필드는 그대로 둔다. 빈 문자열 설명은 설명을 지운다.
  async updateGroupCard(groupId: number, cardId: string, input: { title?: string; description?: string; recordSort?: RecordSort }): Promise<void> {
    await apiV2Client.patch(`/groups/${groupId}/cards/${encodeURIComponent(cardId)}`, input);
  },
  async createGroupCard(groupId: number, input: { listId: string; title: string }): Promise<void> {
    await apiV2Client.post(`/groups/${groupId}/lists/${encodeURIComponent(input.listId)}/cards`, { title: input.title });
  },
  async moveGroupCard(groupId: number, cardId: string, input: { targetListId: string; beforeCardId: string | null }): Promise<void> {
    await apiV2Client.patch(`/groups/${groupId}/cards/${encodeURIComponent(cardId)}/position`, {
      listId: input.targetListId,
      insertBeforeCardId: input.beforeCardId ?? undefined,
    });
  },
  async updateGroupCardPortfolio(groupId: number, cardId: string, input: { isInPortfolio: boolean }): Promise<void> {
    await apiV2Client.put(`/groups/${groupId}/cards/${encodeURIComponent(cardId)}/portfolio`, input);
  },
  async updateGroupCardLabels(groupId: number, cardId: string, input: { labels: CardLabelDto[] }): Promise<void> {
    await apiV2Client.put(`/groups/${groupId}/cards/${encodeURIComponent(cardId)}/labels`, input);
  },
  async updateGroupCardAssignee(groupId: number, cardId: string, input: { assigneeUserId: number | null }): Promise<void> {
    await apiV2Client.put(`/groups/${groupId}/cards/${encodeURIComponent(cardId)}/assignee`, input);
  },
  async updateGroupCardDisabled(groupId: number, cardId: string, input: { isDisabled: boolean }): Promise<void> {
    await apiV2Client.put(`/groups/${groupId}/cards/${encodeURIComponent(cardId)}/disabled`, input);
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
  // URL은 coverImageUrl로, 업로드한 파일은 fileUploadId로 지정하고, coverImageUrl이 null이면 커버를 제거한다.
  async updateGroupCardCoverImage(groupId: number, cardId: string, input: CardCoverImageInput): Promise<void> {
    const path = `/groups/${groupId}/cards/${encodeURIComponent(cardId)}/cover-image`;
    if ("coverImageUrl" in input && input.coverImageUrl === null) {
      await apiV2Client.delete(path);
      return;
    }
    await apiV2Client.post(path, input);
  },
  // 소프트 삭제다 — 보드에서 빠지고 GroupArchiveApi로 복구할 수 있다.
  async archiveGroupCard(groupId: number, cardId: string): Promise<void> {
    await apiV2Client.delete(`/groups/${groupId}/cards/${encodeURIComponent(cardId)}`);
  },
  async listGroupRecordsPage(groupId: number, cardId: string, input: {
    skip: number; limit: number; includeDeleted: boolean;
  }, signal?: AbortSignal): Promise<RecordPageDto> {
    return (await apiV2Client.get<RecordPageDto>(`/groups/${groupId}/cards/${encodeURIComponent(cardId)}/records`, {
      params: { skip: input.skip, limit: input.limit, includeDeleted: input.includeDeleted }, signal,
    })).data;
  },
  async archiveGroupRecord(groupId: number, recordId: number): Promise<void> {
    await apiV2Client.delete(`/groups/${groupId}/records/${encodeURIComponent(recordId)}`);
  },
  async restoreGroupRecord(groupId: number, recordId: number): Promise<void> {
    await apiV2Client.post(`/groups/${groupId}/records/${encodeURIComponent(recordId)}/restore`);
  },
  async moveGroupRecord(groupId: number, recordId: number, input: { targetCardId: string }): Promise<void> {
    await apiV2Client.put(`/groups/${groupId}/records/${encodeURIComponent(recordId)}/position`, input);
  },
  async saveGroupRecord(groupId: number, recordId: number): Promise<void> {
    await apiV2Client.put(`/groups/${groupId}/records/${encodeURIComponent(recordId)}/archive`, { isInUserArchive: true });
  },
  async updateGroupRecordPortfolio(groupId: number, recordId: number, input: { isInPortfolio: boolean }): Promise<void> {
    await apiV2Client.put(`/groups/${groupId}/records/${encodeURIComponent(recordId)}/portfolio`, input);
  },
  async getGroupRecord(groupId: number, recordId: number): Promise<RecordWithCardDto | null> {
    return (await apiV2Client.get<RecordWithCardDto>(`/groups/${groupId}/records/${encodeURIComponent(recordId)}`)).data;
  },
  async createGroupRecord(groupId: number, cardId: string, input: { content: string; files: RecordFileInput[] }): Promise<RecordDto & { uploads: RecordUploadDto[] }> {
    return (await apiV2Client.post<RecordDto & { uploads: RecordUploadDto[] }>(`/groups/${groupId}/cards/${encodeURIComponent(cardId)}/records`, input)).data;
  },
  async updateGroupRecord(groupId: number, recordId: number, input: { content: string; files: RecordFileInput[] }): Promise<{ uploads: RecordUploadDto[] }> {
    return (await apiV2Client.patch<{ uploads: RecordUploadDto[] }>(`/groups/${groupId}/records/${encodeURIComponent(recordId)}`, input)).data;
  },
  // 업로드 주소로 파일을 올린 뒤 서버에 알린다. 모두 성공 200, 일부 성공 206, 모두 실패 400이며 본문은 같다.
  async notifyRecordFilesUploaded(groupId: number, fileIds: string[]): Promise<RecordFilesUploadedResultDto[]> {
    const response = await apiV2Client.post<{ results: RecordFilesUploadedResultDto[] }>(`/groups/${groupId}/records/files/uploaded`, { fileIds }, {
      validateStatus: (status) => status === 200 || status === 206 || status === 400,
    });
    return response.data.results;
  },
};
