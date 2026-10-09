import type {
  RepoBranch,
  RepoCommit,
  RepoTreeEntry,
} from "../../src/api/public/group/GroupRepositoryApi";

const PAGE_SIZE = 10;
const snapshots = new Map<string, number>();

function sha(index: number, branch: string): string {
  return `${branch === "main" ? "a" : "b"}${index.toString(16).padStart(39, "0")}`;
}

function commits(branch: string, revision: number): RepoCommit[] {
  return Array.from({ length: 24 + revision }, (_, index) => ({
    sha: sha(24 + revision - index, branch),
    message: index === 0 ? "그룹 화면 개선" : `저장소 변경 ${24 + revision - index}`,
    committedAt: new Date(Date.UTC(2026, 8, 28 - index, 9)).toISOString(),
  }));
}

function branches(revision: number): RepoBranch[] {
  return [
    { name: "main", headSha: sha(24 + revision, "main"), isDefault: true },
    { name: "feat/group-detail", headSha: sha(24 + revision, "feat/group-detail"), isDefault: false },
  ];
}

/** 개발 서버에서만 실행한다. 외부 GitHub 요청이나 앱 토큰은 사용하지 않는다. */
export function handleRepositoryRequest(
  method: string | undefined,
  url: URL,
  body?: unknown,
): { status: number; body?: unknown } | null {
  if (!url.pathname.startsWith("/repositories/")) return null;
  const repositoryUrl = method === "POST" && body && typeof body === "object" && "url" in body
    ? body.url
    : url.searchParams.get("url");
  if (typeof repositoryUrl !== "string" || !repositoryUrl) {
    return { status: 400, body: { message: "저장소 URL이 필요합니다." } };
  }
  const revision = snapshots.get(repositoryUrl) ?? 0;
  const repositoryBranches = branches(revision);
  const branch = url.searchParams.get("branch") ?? "main";

  if (method === "POST" && url.pathname === "/repositories/refresh") {
    snapshots.set(repositoryUrl, revision + 1);
    return { status: 204 };
  }
  if (method !== "GET") return null;
  if (url.pathname === "/repositories/branches") {
    return { status: 200, body: repositoryBranches };
  }
  if (url.pathname === "/repositories/branch-source") {
    if (!repositoryBranches.some((entry) => entry.name === branch)) {
      return { status: 404, body: { message: "브랜치를 찾을 수 없습니다." } };
    }
    return { status: 200, body: branch === "main" ? null : repositoryBranches[0] };
  }
  if (url.pathname === "/repositories/commits") {
    const page = Number(url.searchParams.get("page") ?? 0);
    if (!Number.isInteger(page) || page < 0) {
      return { status: 400, body: { message: "page는 0 이상의 정수여야 합니다." } };
    }
    if (!repositoryBranches.some((entry) => entry.name === branch)) {
      return { status: 404, body: { message: "브랜치를 찾을 수 없습니다." } };
    }
    const items = commits(branch, revision);
    if (branch !== "main") {
      items.push({ ...commits("main", revision)[12], isForkPoint: true });
    }
    const start = page * PAGE_SIZE;
    return {
      status: 200,
      body: { items: items.slice(start, start + PAGE_SIZE), nextPage: start + PAGE_SIZE < items.length ? page + 1 : null },
    };
  }
  if (url.pathname === "/repositories/tree") {
    const commitSha = url.searchParams.get("commitSha");
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
    return { status: 200, body: entries };
  }
  return null;
}
