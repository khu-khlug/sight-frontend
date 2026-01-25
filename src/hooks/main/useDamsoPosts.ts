import { useQuery } from "@tanstack/react-query";
import { MainApi } from "../../api/main";

/**
 * 담소 게시판 최근 게시글을 조회하는 hook
 * @param limit 조회할 게시글 개수
 */
export const useDamsoPosts = (limit = 5) => {
  return useQuery({
    queryKey: ["posts", "damso", { limit }],
    queryFn: () => MainApi.getDamsoPosts(limit),
  });
};
