import apiV2Client from "../../client/v2";

export type SearchResultDto = { id: string; listTitle: string; cardId: string; cardTitle: string; matchedText: string | null };
export const GroupSearchApi = {
  async searchGroupCards(groupId: number, request: { keyword: string; searchTarget: "title" | "author" }): Promise<SearchResultDto[]> {
    return (await apiV2Client.get<SearchResultDto[]>(`/groups/${groupId}/search`, { params: request })).data;
  },
  async searchGroupRecords(groupId: number, request: { keyword: string }): Promise<SearchResultDto[]> {
    return (await apiV2Client.get<SearchResultDto[]>(`/groups/${groupId}/search`, { params: { ...request, searchTarget: "record" } })).data;
  },
};
