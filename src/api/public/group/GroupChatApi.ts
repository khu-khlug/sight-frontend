import apiV2Client from "../../client/v2";

export type ChatAttachmentDto = { name: string; type: string; data: string };
export type ChatMessageDto = { id: string; authorName: string; content: string; createdAt: string; attachments?: ChatAttachmentDto[] };
export type GroupDiscordChannelDto = { hasChatRoom: boolean; isChatParticipant: boolean };
export const GroupChatApi = {
  async getGroupDiscordChannel(groupId: number): Promise<GroupDiscordChannelDto> {
    return (await apiV2Client.get<GroupDiscordChannelDto>(`/groups/${groupId}/discord-channel`)).data;
  },
  async createGroupDiscordChannel(groupId: number): Promise<void> {
    await apiV2Client.post(`/groups/${groupId}/discord-channel`);
  },
  async joinGroupDiscordChannel(groupId: number, memberId: number): Promise<void> {
    await apiV2Client.post(`/groups/${groupId}/discord-channel/members`, { memberId });
  },
  async listGroupDiscordMessages(groupId: number): Promise<ChatMessageDto[]> {
    return (await apiV2Client.get<ChatMessageDto[]>(`/groups/${groupId}/discord-messages`)).data;
  },
  async sendGroupDiscordMessage(groupId: number, input: { content: string; attachments: ChatAttachmentDto[] }): Promise<ChatMessageDto> {
    return (await apiV2Client.post<ChatMessageDto>(`/groups/${groupId}/discord-messages`, input)).data;
  },
};
