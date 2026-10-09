import apiV2Client from "../../client/v2";

// 기록 작성/수정 자동 저장 — 회원별로 하나뿐인 전역 슬롯이다(GROUP_BUSINESS_RULES.md 8-1,
// GROUP_DATA_SCHEMA.md의 `autosave` 테이블 참고). location은 지금 작성 중인 대상을 가리키는
// 식별자로, EditWindow/types.ts의 encodeEditContentKey가 만드는 문자열("edit:new_<카드id>"
// 또는 "edit:<기록id>")을 그대로 쓴다.
// updatedAt은 전송/수신 시각이 아니라 초안을 수정한 시각(Unix epoch milliseconds)이다.
export type AutosaveMetadataDto = { location: string; extra: string | null; updatedAt: number };
export type AutosaveDto = AutosaveMetadataDto & { content: string };
export type AutosaveInput = { location: string; content: string; extra?: string; updatedAt: number };

// 회원별 단일 슬롯에 대한 저장/삭제 순서를 유지한다. 이전 저장이 삭제 뒤에 도착하면
// 최종 제출한 초안이 다시 생기므로 삭제도 같은 큐를 사용한다.
let pendingWrite: Promise<void> = Promise.resolve();
function enqueueWrite(write: () => Promise<void>): Promise<void> {
  const result = pendingWrite.then(write);
  pendingWrite = result.catch(() => undefined);
  return result;
}

export const AutosaveApi = {
  async getMetadata(): Promise<AutosaveMetadataDto | null> {
    return (await apiV2Client.get<AutosaveMetadataDto | null>("/autosave/metadata")).data;
  },
  async get(): Promise<AutosaveDto | null> {
    return (await apiV2Client.get<AutosaveDto | null>("/autosave")).data;
  },
  async save(input: AutosaveInput, options?: { leaving?: boolean }): Promise<void> {
    const body = JSON.stringify(input);
    const canKeepAlive = new Blob([body]).size <= 64 * 1024;
    if (options?.leaving && !canKeepAlive) throw new Error("이탈 시 전송 가능한 크기를 초과했습니다.");
    await enqueueWrite(async () => {
      if (!canKeepAlive) {
        await apiV2Client.put("/autosave", input);
        return;
      }
      // PUT과 쿠키 인증을 유지하면서 페이지가 닫혀도 전송을 이어간다.
      const response = await fetch(apiV2Client.getUri({ url: "/autosave" }), {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      });
      if (!response.ok) throw new Error(`임시저장 실패: ${response.status}`);
    });
  },
  async clear(): Promise<void> {
    await enqueueWrite(async () => { await apiV2Client.delete("/autosave"); });
  },
};
