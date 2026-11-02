import { useQuery } from "@tanstack/react-query";

import { GroupRepositoryApi, type RepoTreeTarget } from "../../api/public/group/GroupRepositoryApi";
import { repoQueryOptions } from "./repoQueryOptions";

export function useRepoTree(groupId: number, url: string | null, target: RepoTreeTarget | null) {
  return useQuery({
    ...repoQueryOptions,
    queryKey: ["repo-tree", url, target, groupId],
    queryFn: () => {
      if (!url || !target) {
        throw new Error("지원하지 않는 저장소 주소입니다.");
      }
      return GroupRepositoryApi.getFileTree(groupId, url, target);
    },
    enabled: Boolean(url && target),
  });
}