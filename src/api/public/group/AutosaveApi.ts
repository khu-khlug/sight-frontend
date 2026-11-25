import apiV2Client from "../../client/v2";
import { resolveApiUrl } from "../../client/resolveApiUrl";
import type { RecordFileDto, RecordFileInput, RecordUploadDto } from "./KanbanApi";
import { requireIntegerId } from "../../../util/integerId";

// 기록 작성/수정 임시저장 — 회원별로 하나뿐인 슬롯이며, 그 슬롯이 경로의 그룹 것일 때만 다룬다.
// 작성 중인 대상은 카드 아이디와 수정 중인 기록 아이디(새 기록이면 null)다.
export type AutosaveTarget = { cardId: string; recordId: string | null };
// updatedAt은 전송/수신 시각이 아니라 초안을 수정한 시각(ISO 8601 UTC, Z 접미사)이다.
export type AutosaveMetadataDto = AutosaveTarget & { isNewRecord: boolean; cardTitle: string; updatedAt: string };
export type AutosaveDto = AutosaveMetadataDto & { content: string; files: RecordFileDto[] };
// files는 본문이 참조하는 첨부 파일 전체다.
export type AutosaveInput = AutosaveTarget & { content: string; files: RecordFileInput[]; updatedAt: string };

const draftPath = (groupId: string) => `/groups/${groupId}/records/draft`;

function validateTarget<T extends AutosaveTarget>(draft: T): T {
  requireIntegerId(draft.cardId);
  if (draft.recordId !== null) requireIntegerId(draft.recordId);
  return draft;
}

// 회원별 단일 슬롯에 대한 저장/삭제 순서를 유지한다. 이전 저장이 삭제 뒤에 도착하면
// 최종 제출한 초안이 다시 생기므로 삭제도 같은 큐를 사용한다.
let pendingWrite: Promise<void> = Promise.resolve();
function enqueueWrite(write: () => Promise<void>): Promise<void> {
  const result = pendingWrite.then(write);
  pendingWrite = result.catch(() => undefined);
  return result;
}

export const AutosaveApi = {
  async getMetadata(groupId: string): Promise<AutosaveMetadataDto | null> {
    const draft = (await apiV2Client.get<{ draft: AutosaveMetadataDto | null }>(`${draftPath(groupId)}/meta`)).data.draft;
    return draft ? validateTarget(draft) : null;
  },
  async get(groupId: string): Promise<AutosaveDto | null> {
    const response = await apiV2Client.get<{ draft: AutosaveDto }>(draftPath(groupId), {
      validateStatus: (status) => status === 200 || status === 404,
    });
    if (response.status === 404) return null;
    const draft = validateTarget(response.data.draft);
    return { ...draft, files: draft.files.map((file) => ({ ...file, url: file.url ? resolveApiUrl(file.url) : null })) };
  },
  // 새 파일의 업로드 정보를 돌려준다. 페이지를 떠나며 보낸 요청은 응답을 읽지 못할 수 있어 빈 배열일 수 있다.
  async save(groupId: string, input: AutosaveInput, options?: { leaving?: boolean }): Promise<RecordUploadDto[]> {
    validateTarget(input);
    const body = JSON.stringify(input);
    const canKeepAlive = new Blob([body]).size <= 64 * 1024;
    if (options?.leaving && !canKeepAlive) throw new Error("이탈 시 전송 가능한 크기를 초과했습니다.");
    let uploads: RecordUploadDto[] = [];
    await enqueueWrite(async () => {
      if (!canKeepAlive) {
        uploads = (await apiV2Client.put<{ uploads: RecordUploadDto[] }>(draftPath(groupId), input)).data?.uploads ?? [];
        return;
      }
      // PUT과 쿠키 인증을 유지하면서 페이지가 닫혀도 전송을 이어간다.
      const response = await fetch(apiV2Client.getUri({ url: draftPath(groupId) }), {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      });
      if (!response.ok) throw new Error(`임시저장 실패: ${response.status}`);
      uploads = (await response.json().catch(() => null) as { uploads?: RecordUploadDto[] } | null)?.uploads ?? [];
    });
    return uploads.map((upload) => ({ ...upload, url: resolveApiUrl(upload.url), uploadUrl: resolveApiUrl(upload.uploadUrl) }));
  },
  async clear(groupId: string): Promise<void> {
    await enqueueWrite(async () => { await apiV2Client.delete(draftPath(groupId)); });
  },
};
