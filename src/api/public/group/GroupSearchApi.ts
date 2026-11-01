import apiV2Client from "../../client/v2";

export type SearchResultDto = { id: string; listTitle: string; cardId: string; cardTitle: string; matchedText: string | null };
// totalPages는 검색 결과의 전체 페이지 수다. 결과가 없으면 0이다.
export type SearchPageDto = { results: SearchResultDto[]; totalPages: number };
// page는 1부터 시작한다. 한 페이지 크기(50개)는 서버가 정한다.
type SearchPageRequest = { keyword: string; page: number };

export const GroupSearchApi = {
  async searchGroupCards(groupId: number, request: SearchPageRequest & { searchTarget: "title" | "author" }, signal?: AbortSignal): Promise<SearchPageDto> {
    return (await apiV2Client.get<SearchPageDto>(`/groups/${groupId}/search`, { params: request, signal })).data;
  },
  async searchGroupRecords(groupId: number, request: SearchPageRequest, signal?: AbortSignal): Promise<SearchPageDto> {
    return (await apiV2Client.get<SearchPageDto>(`/groups/${groupId}/search`, { params: { ...request, searchTarget: "record" }, signal })).data;
  },
};
