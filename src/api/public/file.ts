// 파일 내용 없이 응답 헤더로만 알 수 있는 정보다 — 서버가 헤더를 주지 않으면 null이다.
export type FileMetadataDto = { size: number | null; contentType: string | null };

export function readFileMetadata(response: Response): FileMetadataDto {
  const length = Number(response.headers.get("Content-Length"));
  return {
    size: response.headers.has("Content-Length") && Number.isSafeInteger(length) && length >= 0 ? length : null,
    contentType: response.headers.get("Content-Type"),
  };
}

// 백엔드가 직접 서빙하는 파일(활동보고서 등 정적 경로)을 가져온다 — apiV2Client(인증
// 세션)를 거치지 않는 단순 리소스 fetch다. 어떤 URL을 이 함수로 보낼지는 actions.ts의
// fileApi가 판단한다.
export const FileApi = {
  async fetchByUrl(url: string): Promise<Blob> {
    const response = await fetch(url);
    if (!response.ok) throw new Error("파일을 불러오지 못했습니다.");
    return response.blob();
  },
  // 본문을 받지 않고 HEAD 응답 헤더로 용량·형식만 확인한다.
  async fetchMetadataByUrl(url: string): Promise<FileMetadataDto> {
    const response = await fetch(url, { method: "HEAD" });
    if (!response.ok) throw new Error("파일 정보를 불러오지 못했습니다.");
    return readFileMetadata(response);
  },
};
