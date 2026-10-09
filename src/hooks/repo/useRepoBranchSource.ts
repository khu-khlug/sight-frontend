import { useQuery } from "@tanstack/react-query";

import { GroupRepositoryApi } from "../../api/public/group/GroupRepositoryApi";
import type { RepoBranch } from "../../api/public/group/GroupRepositoryApi";
import { repoQueryOptions } from "./repoQueryOptions";

export function useRepoBranchSource(
  url: string | null,
  branch: RepoBranch | null,
  branches: RepoBranch[],
) {
  return useQuery({
    ...repoQueryOptions,
    queryKey: ["repo-branch-source", url, branch, branches],
    queryFn: () => {
      if (!url || !branch) throw new Error("브랜치를 찾을 수 없습니다.");
      return GroupRepositoryApi.getBranchSource(url as string, branch);
    },
    enabled: Boolean(url && branch && !branch.isDefault && branches.length > 1),
  });
}
