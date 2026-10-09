// GroupDetailContainer 바깥(KanbanBoard, EditWindow, CardWindow, FileWindow,
// UnimplementedWindow, Window/* 등)이 창을 열거나 다루기 위해 쓰는 **유일한 공개 인터페이스**
// 창구다. WindowLayer/windowManager.ts의 실제 구현(상태 전이, 물리 배치 계산 등)은 직접
// import할 수 없다 — eslint.config.js의 no-restricted-imports가 WindowLayer 디렉토리와 이
// 파일만 예외로 두고 나머지 전부를 막는다.
//
// 새로 바깥에 공개해야 할 windowManager의 함수/타입이 생기면, 호출부가 windowManager를
// 직접 import하게 하지 말고 여기에 재익스포트를 추가한다. 반대로 windowManager 내부에서만
// 쓰이는 건 여기 끌어오지 않는다 — 이 파일에 있다는 것 자체가 "밖에서 써도 되는 것"이라는
// 신호여야 한다.
//
// 파일 가져오기(fileApi)처럼 창 상태와 무관한 것도 있다 — 창을 "여는 요청"의 콘텐츠로
// 쓰이는 관련 유틸이라 여기 같이 둔다.
import { FileApi, type FileMetadataDto } from "../../../api/public/file";
import { GithubApi } from "../../../api/repo/github";

export {
  applyWindowAction,
  encodeWindowOpenRequest,
  roleForSide,
  sideForRole,
} from "./WindowLayer/windowManager";
export type {
  MinimizedHoverRequest,
  SendTarget,
  WindowAction,
  WindowOpenRequest,
} from "./WindowLayer/windowManager";

export type FetchedFile = { blob: Blob; size: number; text: () => Promise<string> };

const GITHUB_RAW_HOSTNAME = "raw.githubusercontent.com";

// url 하나를 어떤 api(백엔드 정적 파일 vs GitHub raw 등)로 가져와야 하는지 판단한다 —
// api/ 폴더에 소스별로 여러 파일-요청 api가 있고(api/public/file.ts, api/repo/github.ts 등),
// 이 함수가 그중 어떤 걸 쓸지 유일하게 아는 지점이다. 지금은 호스트네임만 보고 고르지만,
// 나중에 다른 소스(예: 첨부파일 전용 API)가 추가되면 여기 분기만 늘리면 된다.
type FileSource = {
  fetch: (url: string) => Promise<Blob>;
  fetchMetadata: (url: string) => Promise<FileMetadataDto>;
};

function resolveFileSource(url: string): FileSource {
  try {
    if (new URL(url).hostname === GITHUB_RAW_HOSTNAME) {
      return { fetch: GithubApi.fetchRawFile, fetchMetadata: GithubApi.fetchRawFileMetadata };
    }
  } catch {
    // URL 파싱 실패(상대 경로 등)는 기본(백엔드) 경로로 처리한다.
  }
  return { fetch: FileApi.fetchByUrl, fetchMetadata: FileApi.fetchMetadataByUrl };
}

/*
 * 파일 창(FileWindow)·기록 편집창(EditWindow)이 쓰는 단일 진입점 — url 하나만 받아서 실제
 * 파일이나 그 메타데이터를 가져온다. 호출부는 이 url이 백엔드 것인지 GitHub raw인지 몰라도 되고,
 * 이 객체가 내부적으로 resolveFileSource로 알맞은 api를 골라 호출한 뒤, 그 결과를 소스에
 * 상관없이 똑같은 모양으로 돌려준다. img/video/iframe 등에 그대로 쓰려면 blob을
 * URL.createObjectURL(blob)로 감싸서 쓰면 된다.
 */
export const fileApi = {
  async get(url: string): Promise<FetchedFile> {
    const blob = await resolveFileSource(url).fetch(url);
    return { blob, size: blob.size, text: () => blob.text() };
  },
  // 파일 내용을 받지 않고 용량·형식만 확인한다(기록 본문에 파일을 넣을 때 용량 표시용).
  getMetadata(url: string): Promise<FileMetadataDto> {
    return resolveFileSource(url).fetchMetadata(url);
  },
};
