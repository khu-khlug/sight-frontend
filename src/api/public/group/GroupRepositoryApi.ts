import apiV2Client from "../../client/v2";

// rawUrl은 blob일 때만 있다 — GitHub 등에서 파일 원문을 바로 가져올 수 있는 raw 도메인
// 주소를 백엔드가 내려준다(토큰·요청 한도 등 외부 서비스 인증은 백엔드 책임). 프런트는
// 이 주소로 바로 fetch/<img>/<video> 등에 쓴다.
export type RepoTreeEntry = { path: string; type: "blob" | "tree"; rawUrl?: string };
export type RepoBranch = { name: string; headSha: string; isDefault: boolean };
export type RepoCommit = {
  sha: string;
  message: string;
  committedAt: string;
  isForkPoint?: boolean;
};
export type RepoCommitPage = { items: RepoCommit[]; nextPage: number | null };

/** 저장소 브랜치 조회. 외부 서비스 인증과 조회는 백엔드가 담당한다. */
const getBranches = async (url: string): Promise<RepoBranch[]> => {
  const response = await apiV2Client.get<RepoBranch[]>("/repositories/branches", { params: { url } });
  return response.data;
};

/** 서버가 판별한 분기 기준 브랜치를 조회한다. */
const getBranchSource = async (url: string, branch: RepoBranch): Promise<RepoBranch | null> => {
  const response = await apiV2Client.get<RepoBranch | null>("/repositories/branch-source", {
    params: { url, branch: branch.name },
  });
  return response.data;
};

/** 서버의 커밋 페이지와 분기점 표시를 그대로 받는다. page는 0부터 시작한다. */
const getCommits = async (
  url: string,
  branch: RepoBranch,
  baseBranch: RepoBranch,
  page: number,
): Promise<RepoCommitPage> => {
  const response = await apiV2Client.get<RepoCommitPage>("/repositories/commits", {
    params: { url, branch: branch.name, baseBranch: baseBranch.name, page },
  });
  return response.data;
};

/** 선택한 커밋의 경로 목록 조회. 화면용 트리 구성은 프런트에서 한다. */
const getFileTree = async (url: string, commitSha: string): Promise<RepoTreeEntry[]> => {
  const response = await apiV2Client.get<RepoTreeEntry[]>("/repositories/tree", {
    params: { url, commitSha },
  });
  return response.data;
};

/** 백엔드의 저장소 캐시 갱신을 요청한다. */
const refreshRepository = async (url: string): Promise<void> => {
  await apiV2Client.post("/repositories/refresh", { url });
};

export const GroupRepositoryApi = { getBranches, getBranchSource, getCommits, getFileTree, refreshRepository };
