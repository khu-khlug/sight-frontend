import { useInfiniteQuery } from "@tanstack/react-query";

import { GroupRepositoryApi } from "../../api/public/group/GroupRepositoryApi";
import type { RepoBranch } from "../../api/public/group/GroupRepositoryApi";
import { repoQueryOptions } from "./repoQueryOptions";

export function useRepoCommits(
  url: string | null,
  branch: RepoBranch | null,
  baseBranch: RepoBranch | null,
) {
  return useInfiniteQuery({
    ...repoQueryOptions,
    queryKey: ["repo-commits", url, branch, baseBranch],
    queryFn: ({ pageParam }) => {
      if (!url || !branch || !baseBranch) {
        throw new Error("저장소 또는 브랜치를 찾을 수 없습니다.");
      }
      return GroupRepositoryApi.getCommits(url as string, branch, baseBranch, pageParam);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    enabled: Boolean(url && branch && baseBranch),
  });
}
