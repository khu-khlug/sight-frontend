import { useQuery } from "@tanstack/react-query";

import { GroupRepositoryApi } from "../../api/public/group/GroupRepositoryApi";
import { repoQueryOptions } from "./repoQueryOptions";

export function useRepoBranches(groupId: string, url: string | null) {
  return useQuery({
    ...repoQueryOptions,
    queryKey: ["repo-branches", url, groupId],
    queryFn: () => {
      if (!url) throw new Error("지원하지 않는 저장소 주소입니다.");
      return GroupRepositoryApi.getBranches(groupId, url as string);
    },
    enabled: Boolean(url),
  });
}
