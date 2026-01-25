import { useQuery } from "@tanstack/react-query";
import { TalkApi } from "../../api/talk";
import type { ListTalksRequest } from "../../api/talk/types";

/**
 * 담소 목록을 조회하는 hook
 * @param request 페이지네이션 옵션 (offset, limit)
 */
export const useTalks = (request: ListTalksRequest = {}) => {
  const { offset = 0, limit = 10 } = request;

  return useQuery({
    queryKey: ["talks", { offset, limit }],
    queryFn: () => TalkApi.listTalks({ offset, limit }),
  });
};
