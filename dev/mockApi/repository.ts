import type {
  RepoBranch,
  RepoCommit,
  RepoTreeEntry,
} from "../../src/api/public/group/GroupRepositoryApi";

const PAGE_SIZE = 30;
const COMMIT_COUNT = 74;
const snapshots = new Map<string, number>();

function sha(index: number, branch: string): string {
  return `${branch === "main" ? "a" : "b"}${index.toString(16).padStart(39, "0")}`;
}

function commits(branch: string, revision: number): RepoCommit[] {
  return Array.from({ length: COMMIT_COUNT + revision }, (_, index) => ({
    sha: sha(COMMIT_COUNT + revision - index, branch),
    message: index === 0 ? "그룹 화면 개선" : `저장소 변경 ${COMMIT_COUNT + revision - index}`,
  }));
}

function branches(): RepoBranch[] {
  return [
    { name: "main", isDefault: true },
    { name: "feat/group-detail", isDefault: false },
  ];
}

/** 개발 서버에서만 실행한다. 외부 GitHub 요청이나 앱 토큰은 사용하지 않는다. */
export function handleRepositoryRequest(
  method: string | undefined,
  url: URL,
  _body?: unknown,
): { status: number; body?: unknown } | null {
  const match = url.pathname.match(/^\/groups\/\d+\/repository\/(branches|commits|file-tree)$/);
  if (!match) return null;
  const resource = match[1];
  const repositoryUrl = url.searchParams.get("url");
  if (typeof repositoryUrl !== "string" || !repositoryUrl) {
    return { status: 400, body: { message: "저장소 URL이 필요합니다." } };
  }
  // refresh=true는 저장소에 새 변경이 생긴 것처럼 리비전을 올린다.
  if (url.searchParams.get("refresh") === "true") snapshots.set(repositoryUrl, (snapshots.get(repositoryUrl) ?? 0) + 1);
  const revision = snapshots.get(repositoryUrl) ?? 0;
  const repositoryBranches = branches();
  const branch = url.searchParams.get("branch") ?? "main";

  if (method !== "GET") return null;
  if (resource === "branches") {
    return { status: 200, body: { branches: repositoryBranches } };
  }
  if (resource === "commits") {
    const page = Number(url.searchParams.get("page") ?? 0);
    if (!Number.isInteger(page) || page < 0) {
      return { status: 400, body: { message: "page는 0 이상의 정수여야 합니다." } };
    }
    if (!repositoryBranches.some((entry) => entry.name === branch)) {
      return { status: 404, body: { message: "브랜치를 찾을 수 없습니다." } };
    }
    const items = commits(branch, revision);
    const start = page * PAGE_SIZE;
    return {
      status: 200,
      body: { page, receivedCount: items.slice(start, start + PAGE_SIZE).length, hasMore: start + PAGE_SIZE < items.length, commits: items.slice(start, start + PAGE_SIZE) },
    };
  }
  if (resource === "file-tree") {
    const requestedBranch = url.searchParams.get("branch");
    const commitSha = requestedBranch ? commits(requestedBranch, revision)[0]?.sha : url.searchParams.get("commitSha");
    if (requestedBranch && !repositoryBranches.some((entry) => entry.name === requestedBranch)) return { status: 404, body: { message: "브랜치를 찾을 수 없습니다." } };
    const known = repositoryBranches.some((entry) => commits(entry.name, revision).some((commit) => commit.sha === commitSha));
    if (!known) return { status: 404, body: { message: "커밋을 찾을 수 없습니다." } };
    // 실제로는 GitHub 등이 주는 raw 도메인 주소가 내려오지만(백엔드 책임), 지금은 API 요청
    // 한도를 아끼기 위해 우리 목업 서버가 내용을 직접 만들어 내려주는 경로를 raw 주소로 쓴다.
    const rawUrl = (path: string) => `/__mock-api/repository-raw-files/${encodeURIComponent(path)}`;
    const blob = (path: string): RepoTreeEntry => ({ path, type: "blob", rawUrl: rawUrl(path) });
    // 이미지·동영상·음악은 우리 목업 서버가 직접 서빙하면 Range 요청(재생바 seek에 필요) 처리를
    // 따로 구현해야 해서, 대신 실제 CDN 주소를 rawUrl로 그대로 내려준다 — Wikimedia Commons CDN은
    // Range를 정상 지원하니 저장소 파일 창의 재생바가 실제 "raw 도메인 주소를 받아 쓰는" 운영
    // 환경과 똑같이 동작한다. 출처: Wikimedia Commons "Public domain cat photo on the streets.jpg"
    // (퍼블릭 도메인), Big Buck Bunny 트레일러(Blender Foundation, CC BY 3.0), "Music Box Sound
    // Effect.ogg"(퍼블릭 도메인, soundbible.com 경유).
    const externalBlob = (path: string, url: string): RepoTreeEntry => ({ path, type: "blob", rawUrl: url });
    const entries: RepoTreeEntry[] = [
      blob("README.md"),
      blob("package.json"),
      { path: "src", type: "tree" },
      { path: "src/api", type: "tree" },
      blob("src/api/group.ts"),
      { path: "src/components", type: "tree" },
      blob("src/components/Group.tsx"),
      blob("src/style.css"),
      { path: "assets", type: "tree" },
      externalBlob("assets/sample-image.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Public_domain_cat_photo_on_the_streets.jpg/960px-Public_domain_cat_photo_on_the_streets.jpg"),
      externalBlob("assets/sample-video.webm", "https://upload.wikimedia.org/wikipedia/commons/transcoded/b/b3/Big_Buck_Bunny_Trailer_400p.ogv/Big_Buck_Bunny_Trailer_400p.ogv.360p.vp9.webm"),
      externalBlob("assets/sample-audio.ogg", "https://upload.wikimedia.org/wikipedia/commons/9/9a/Music_Box_Sound_Effect.ogg"),
    ];
    if (commitSha?.startsWith("b")) entries.push(blob("src/components/Kanban.tsx"));
    return { status: 200, body: { commitSha, truncated: false, entries: entries.map((entry) => ({ path: entry.path, type: entry.type === "tree" ? "dir" : "file", rawUrl: entry.rawUrl ?? null })) } };
  }
  return null;
}
