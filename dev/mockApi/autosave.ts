// 기록 임시저장 — 실제로는 회원별로 하나뿐인 슬롯이다. 목업 서버는 로그인한 회원이 하나뿐이라
// 전역 변수 하나로 그 "회원별 슬롯 하나"를 흉내낸다. 슬롯이 경로의 그룹 것일 때만 돌려준다.
import { recordFileView, registerRecordFiles } from "./groups";
import type { MockRecordFile } from "./groupFixtures";

type MockDraft = { groupId: number; cardId: string; cardTitle: string; recordId: number | null; content: string; updatedAt: string; files: MockRecordFile[] };

let draft: MockDraft | null = null;

export function handleAutosaveRequest(
  method: string | undefined,
  url: URL,
  body: unknown,
  findCardTitle: (cardId: string) => string | null,
): { status: number; body?: unknown } | null {
  const match = url.pathname.match(/^\/groups\/(\d+)\/records\/draft(\/meta)?$/);
  if (!match) return null;
  const groupId = Number(match[1]);
  const mine = draft && draft.groupId === groupId ? draft : null;
  const meta = (value: MockDraft) => ({
    isNewRecord: value.recordId === null, cardId: value.cardId, cardTitle: value.cardTitle,
    recordId: value.recordId, updatedAt: value.updatedAt,
  });

  if (match[2]) {
    if (method !== "GET") return { status: 405, body: { message: "허용되지 않는 메서드입니다." } };
    return { status: 200, body: { draft: mine ? meta(mine) : null } };
  }
  if (method === "GET") {
    if (!mine) return { status: 404, body: { message: "임시저장이 없습니다." } };
    return { status: 200, body: { draft: { ...meta(mine), content: mine.content, files: mine.files.map(recordFileView) } } };
  }
  if (method === "PUT") {
    const input = body && typeof body === "object" ? body as Record<string, unknown> : {};
    if (typeof input.cardId !== "string" || typeof input.content !== "string" || typeof input.updatedAt !== "string"
      || Number.isNaN(Date.parse(input.updatedAt)) || (input.recordId !== null && typeof input.recordId !== "number")) {
      return { status: 400, body: { message: "임시저장 요청을 확인해주세요." } };
    }
    const cardTitle = findCardTitle(input.cardId);
    if (cardTitle === null) return { status: 400, body: { message: "카드를 찾을 수 없습니다." } };
    if (draft && Date.parse(input.updatedAt) < Date.parse(draft.updatedAt)) {
      return { status: 409, body: { message: "더 최신 임시저장이 있습니다." } };
    }
    const registered = registerRecordFiles(input.files ?? []);
    if (!registered) return { status: 400, body: { message: "첨부 파일 정보를 확인해주세요." } };
    draft = { groupId, cardId: input.cardId, cardTitle, recordId: input.recordId as number | null, content: input.content, updatedAt: input.updatedAt, files: registered.files };
    return { status: 200, body: { uploads: registered.uploads } };
  }
  if (method === "DELETE") {
    if (mine) draft = null;
    return { status: 204 };
  }
  return { status: 405, body: { message: `Method ${method} not allowed` } };
}