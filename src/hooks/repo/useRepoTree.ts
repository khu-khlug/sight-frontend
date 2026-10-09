import { useQuery } from "@tanstack/react-query";

import { GroupRepositoryApi } from "../../api/public/group/GroupRepositoryApi";
import { repoQueryOptions } from "./repoQueryOptions";

export function useRepoTree(url: string | null, commitSha: string | null) {
  return useQuery({
    ...repoQueryOptions,
    queryKey: ["repo-tree", url, commitSha],
    queryFn: () => {
      if (!url) {
        throw new Error("지원하지 않는 저장소 주소입니다.");
      }
      return GroupRepositoryApi.getFileTree(url as string, commitSha as string);
    },
    enabled: Boolean(url && commitSha),
  });
}
