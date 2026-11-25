// 파일 내용 없이 응답 헤더로만 알 수 있는 정보다 — 서버가 헤더를 주지 않으면 null이다.
import { apiFileCredentials, resolveApiUrl } from "../client/resolveApiUrl";

export type FileMetadataDto = { size: number | null; contentType: string | null };

export function readFileMetadata(response: Response): FileMetadataDto {
  const length = Number(response.headers.get("Content-Length"));
  return {
    size: response.headers.has("Content-Length") && Number.isSafeInteger(length) && length >= 0 ? length : null,
    contentType: response.headers.get("Content-Type"),
  };
}

// API 서버 파일은 로그인 쿠키로 열람 권한을 확인하고, 외부 파일에는 인증을 보내지 않는다.
export const FileApi = {
  async fetchByUrl(url: string): Promise<Blob> {
    const response = await fetch(resolveApiUrl(url), { credentials: apiFileCredentials(url) });
    if (!response.ok) throw new Error("파일을 불러오지 못했습니다.");
    return response.blob();
  },
  // 그룹 파일은 GET 리다이렉션만 제공하므로 헤더를 받은 뒤 본문 수신을 취소한다.
  async fetchMetadataByUrl(url: string): Promise<FileMetadataDto> {
    const resolved = resolveApiUrl(url);
    const method = /\/groups\/[^/]+\/files\/[^/?]+/.test(new URL(resolved, window.location.origin).pathname) ? "GET" : "HEAD";
    const response = await fetch(resolved, { method, credentials: apiFileCredentials(url) });
    if (!response.ok) throw new Error("파일 정보를 불러오지 못했습니다.");
    const metadata = readFileMetadata(response);
    if (method === "GET") await response.body?.cancel();
    return metadata;
  },
};
