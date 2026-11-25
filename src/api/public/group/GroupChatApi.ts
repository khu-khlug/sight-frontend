import apiV2Client from "../../client/v2";

export type ChatAttachmentDto = { name: string; contentType: string | null; size: number; url: string };
export type ChatMessageDto = { id: string; authorName: string; content: string; createdAt: string; attachments: ChatAttachmentDto[] };
export type ChatMessagePageDto = { nextBefore: string | null; receivedCount: number; hasMore: boolean; messages: ChatMessageDto[] };
export const GroupChatApi = {
  async createGroupDiscordChannel(groupId: string): Promise<void> {
    await apiV2Client.post(`/groups/${groupId}/chat-room`);
  },
  // 참여 대상은 서버가 요청자로 정하므로 memberId는 보내지 않는다.
  async joinGroupDiscordChannel(groupId: string): Promise<void> {
    await apiV2Client.post(`/groups/${groupId}/chat-room/join`);
  },
  // before는 이전 응답의 nextBefore다. 각 페이지의 messages는 오래된 메시지가 앞이다.
  async listGroupDiscordMessagesPage(groupId: string, before: string | null, signal?: AbortSignal): Promise<ChatMessagePageDto> {
    return (await apiV2Client.get<ChatMessagePageDto>(`/groups/${groupId}/chat-messages`, { params: { before: before ?? undefined }, signal })).data;
  },
  // 본문은 content 텍스트 파트로, 첨부 파일은 파일마다 같은 이름(files)의 파트로 보낸다.
  async sendGroupDiscordMessage(groupId: string, input: { content: string; files: File[] }): Promise<ChatMessageDto> {
    const form = new FormData();
    form.append("content", input.content);
    input.files.forEach((file) => form.append("files", file, file.name));
    // multipart 경계는 브라우저가 파일 본문과 함께 지정한다.
    return (await apiV2Client.post<ChatMessageDto>(`/groups/${groupId}/chat-messages`, form, {
      headers: { "Content-Type": null },
    })).data;
  },
};
