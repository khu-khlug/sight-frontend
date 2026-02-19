import { useQuery } from "@tanstack/react-query";
import { GroupPublicApi } from "../../api/public/group";

/**
 * 최근 활동한 그룹 목록을 조회하는 hook
 */
export const useRecentGroups = () => {
  return useQuery({
    queryKey: ["groups", "recent"],
    queryFn: () => GroupPublicApi.listRecentGroups(),
  });
};
