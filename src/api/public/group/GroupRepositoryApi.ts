import apiV2Client from "../../client/v2";

// rawUrl은 blob일 때만 있다 — GitHub 등에서 파일 원문을 바로 가져올 수 있는 raw 도메인
// 주소를 백엔드가 내려준다(토큰·요청 한도 등 외부 서비스 인증은 백엔드 책임). 프런트는
// 이 주소로 바로 fetch/<img>/<video> 등에 쓴다.
export type RepoTreeEntry = { path: string; type: "blob" | "tree"; rawUrl?: string };
export type RepoBranch = { name: string; isDefault: boolean };
export type RepoCommit = {
  sha: string;
  message: string;
};
export type RepoCommitPage = { items: RepoCommit[]; nextPage: number | null };

// 파일 트리는 커밋 SHA 또는 브랜치(그 끝 커밋) 중 하나로 요청한다.
export type RepoTreeTarget = { commitSha: string } | { branch: string };
type BranchesResponseDto = { branches: RepoBranch[] };
type CommitsResponseDto = { page: number; receivedCount: number; hasMore: boolean; commits: RepoCommit[] };
type FileTreeResponseDto = {
  commitSha: string;
  truncated: boolean;
  entries: { path: string; type: "file" | "dir"; rawUrl: string | null }[];
};

const repositoryPath = (groupId: string, resource: string) => `/groups/${groupId}/repository/${resource}`;

/** 저장소 브랜치 조회. 최대 100개다. 외부 서비스 인증과 조회는 백엔드가 담당한다. */
const getBranches = async (groupId: string, url: string, refresh = false): Promise<RepoBranch[]> => {
  const response = await apiV2Client.get<BranchesResponseDto>(repositoryPath(groupId, "branches"), { params: { url, refresh } });
  return response.data.branches;
};

/** 브랜치의 전체 이력을 30개씩 받는다. page는 0부터 시작한다. */
const getCommits = async (
  groupId: string,
  url: string,
  branch: RepoBranch,
  page: number,
): Promise<RepoCommitPage> => {
  const response = await apiV2Client.get<CommitsResponseDto>(repositoryPath(groupId, "commits"), {
    params: { url, branch: branch.name, page },
  });
  return { items: response.data.commits, nextPage: response.data.hasMore ? page + 1 : null };
};

/** 선택한 커밋의 경로 목록 조회. 화면용 트리 구성은 프런트에서 한다. */
const getFileTree = async (groupId: string, url: string, target: RepoTreeTarget): Promise<RepoTreeEntry[]> => {
  const response = await apiV2Client.get<FileTreeResponseDto>(repositoryPath(groupId, "file-tree"), {
    params: { url, ...target },
  });
  return response.data.entries.map((entry) => ({
    path: entry.path,
    type: entry.type === "dir" ? "tree" : "blob",
    rawUrl: entry.rawUrl ?? undefined,
  }));
};

/** 캐시 유효기간과 관계없이 브랜치 목록을 다시 확인하게 한다. 같은 저장소는 1분에 10번까지다. */
const refreshRepository = async (groupId: string, url: string): Promise<void> => {
  await getBranches(groupId, url, true);
};

export const GroupRepositoryApi = { getBranches, getCommits, getFileTree, refreshRepository };
