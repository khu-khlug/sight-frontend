import { readFileMetadata, type FileMetadataDto } from "../public/file";

// GitHub raw 도메인(raw.githubusercontent.com)에서 저장소 파일 원문을 직접 가져온다. 지금은
// 인증 없는 공개 raw URL을 그대로 fetch하지만, 비공개 저장소 지원 등으로 인증(토큰 헤더)이
// 필요해지면 이 함수 안에서만 처리하면 된다 — 어떤 URL을 이 함수로 보낼지는 actions.ts의
// fileApi가 판단한다.
export const GithubApi = {
  async fetchRawFile(url: string): Promise<Blob> {
    const response = await fetch(url);
    return response.blob();
  },
  // 본문을 받지 않고 HEAD 응답 헤더로 용량·형식만 확인한다.
  async fetchRawFileMetadata(url: string): Promise<FileMetadataDto> {
    const response = await fetch(url, { method: "HEAD" });
    if (!response.ok) throw new Error("파일 정보를 불러오지 못했습니다.");
    return readFileMetadata(response);
  },
};
