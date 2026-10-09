// 기록 작성/수정 자동 저장 — 실제로는 회원별로 하나뿐인 슬롯이다(tasks/group/
// GROUP_DATA_SCHEMA.md의 `autosave` 테이블, `author` 컬럼이 unique). 목업 서버는 로그인한
// 회원이 하나뿐이라 전역 변수 하나로 그 "회원별 슬롯 하나"를 그대로 흉내낸다.
import type { AutosaveDto } from "../../src/api/public/group/AutosaveApi";

let autosave: AutosaveDto | null = null;

export function handleAutosaveRequest(
  method: string | undefined,
  url: URL,
  body: unknown,
): { status: number; body?: unknown } | null {
  if (url.pathname === "/autosave/metadata") {
    if (method !== "GET") return { status: 405, body: { message: "허용되지 않는 메서드입니다." } };
    if (!autosave) return { status: 200, body: null };
    const { location, extra, updatedAt } = autosave;
    return { status: 200, body: { location, extra, updatedAt } };
  }
  if (url.pathname !== "/autosave") return null;

  if (method === "GET") return { status: 200, body: autosave };

  if (method === "PUT") {
    const input = body && typeof body === "object" ? body as Record<string, unknown> : {};
    if (typeof input.location !== "string" || typeof input.content !== "string") {
      return { status: 400, body: { message: "location과 content는 필수입니다." } };
    }
    if (typeof input.updatedAt !== "number" || !Number.isSafeInteger(input.updatedAt) || input.updatedAt < 0) {
      return { status: 400, body: { message: "updatedAt은 초안 수정 시각을 나타내는 밀리초 정수여야 합니다." } };
    }
    if (autosave && input.updatedAt < autosave.updatedAt) {
      return { status: 409, body: { message: "더 최신 임시저장이 있습니다." } };
    }
    autosave = {
      location: input.location,
      content: input.content,
      extra: typeof input.extra === "string" ? input.extra : null,
      updatedAt: input.updatedAt,
    };
    return { status: 204 };
  }

  if (method === "DELETE") {
    autosave = null;
    return { status: 204 };
  }

  return { status: 405, body: { message: `Method ${method} not allowed` } };
}
