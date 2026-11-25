import apiV2Client from "../../client/v2";
import { requireIntegerId } from "../../../util/integerId";

// id는 결과 목록의 키다. 기록 검색이면 기록 아이디, 카드 검색이면 카드 아이디로 정한다.
export type SearchResultDto = { id: string; listId: string; listTitle: string; cardId: string; cardTitle: string; recordId: string | null; matchedText: string | null };
// totalPages는 검색 결과의 전체 페이지 수다. 결과가 없으면 0이다.
export type SearchPageDto = { results: SearchResultDto[]; totalPages: number };
// page는 1부터 시작한다. 한 페이지 크기(50개)는 서버가 정한다.
type SearchPageRequest = { keyword: string; page: number };
type SearchTarget = "TITLE" | "AUTHOR" | "RECORD";
type SearchPageResponseDto = { page: number; totalPages: number; receivedCount: number; results: Omit<SearchResultDto, "id">[] };

async function search(groupId: string, request: SearchPageRequest, target: SearchTarget, signal?: AbortSignal): Promise<SearchPageDto> {
  const { data } = await apiV2Client.get<SearchPageResponseDto>(`/groups/${groupId}/search`, { params: { keyword: request.keyword, page: request.page, target }, signal });
  return {
    totalPages: data.totalPages,
    results: data.results.map((result) => ({
      ...result,
      listId: requireIntegerId(result.listId), cardId: requireIntegerId(result.cardId),
      recordId: result.recordId === null ? null : requireIntegerId(result.recordId),
      id: result.recordId === null ? result.cardId : `record-${result.recordId}`,
    })),
  };
}

export const GroupSearchApi = {
  async searchGroupCards(groupId: string, request: SearchPageRequest & { searchTarget: "title" | "author" }, signal?: AbortSignal): Promise<SearchPageDto> {
    return search(groupId, request, request.searchTarget === "title" ? "TITLE" : "AUTHOR", signal);
  },
  async searchGroupRecords(groupId: string, request: SearchPageRequest, signal?: AbortSignal): Promise<SearchPageDto> {
    return search(groupId, request, "RECORD", signal);
  },
};
