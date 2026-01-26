import { useQuery } from "@tanstack/react-query";
import { GroupPublicApi } from "../../api/public/group";

/**
 * 즐겨찾기한 그룹 목록을 조회하는 hook
 */
export const useBookmarkedGroups = () => {
  return useQuery({
    queryKey: ["groups", "bookmarked"],
    queryFn: () => GroupPublicApi.listBookmarkedGroups(),
  });
};
