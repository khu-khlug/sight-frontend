import { useInfiniteQuery } from "@tanstack/react-query";

import { GroupRepositoryApi } from "../../api/public/group/GroupRepositoryApi";
import type { RepoBranch } from "../../api/public/group/GroupRepositoryApi";
import { repoQueryOptions } from "./repoQueryOptions";

export function useRepoCommits(
  groupId: number,
  url: string | null,
  branch: RepoBranch | null,
) {
  return useInfiniteQuery({
    ...repoQueryOptions,
    queryKey: ["repo-commits", url, branch, groupId],
    queryFn: ({ pageParam }) => {
      if (!url || !branch) {
        throw new Error("저장소 또는 브랜치를 찾을 수 없습니다.");
      }
      return GroupRepositoryApi.getCommits(groupId, url as string, branch, pageParam);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    enabled: Boolean(url && branch),
  });
}
