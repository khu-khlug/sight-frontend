import { randomUUID } from "node:crypto";
import { GroupStatus } from "../../src/constant";
import type { OpenSeminarCohortDto } from "../../src/api/public/group/GroupExposureApi";
import { createGroupFixture, type MockCard } from "./groupFixtures";

type Result = { status: number; body?: unknown };
type Input = Record<string, unknown>;
const state = createGroupFixture();
let openCohort: OpenSeminarCohortDto | null = state.openSeminarCohort;
// inline: 기록 본문의 <img>/<audio>가 바로 재생할 수 있게 다운로드(attachment) 대신 원래 형식으로 내려준다.
export const uploads = new Map<string, { fileName: string; contentType: string; data?: Buffer; used: boolean; inline?: boolean }>();
const ok = (body?: unknown): Result => ({ status: body === undefined ? 204 : 200, body });
const fail = (message: string, status = 400): Result => ({ status, body: { message } });
const id = () => randomUUID();
const now = () => new Date().toISOString();
const cards = () => state.lists.flatMap((list) => list.cards);
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
function summary() {
  const all = cards();
  return { ...state.groupInfo, memberCount: state.members.length, listCount: state.lists.length,
    cardCount: all.length, recordCount: all.reduce((sum, card) => sum + card.records.length, 0),
    reportCount: state.activityReports.length, seminarCount: new Set(state.activityReports.map((r) => r.seminarId)).size,
    portfolioCardCount: all.filter((card) => card.portfolio).length,
    portfolioListCount: state.lists.filter((list) => list.cards.some((card) => card.portfolio)).length,
    archivedCardCount: state.archivedCards.length, savedRecordCount: state.savedRecords.length };
}
function changed(message: string, countsAsActivity = true) {
  if (countsAsActivity) {
    state.groupInfo.lastActivityAt = now();
    if (state.groupInfo.status === GroupStatus.STOP) state.groupInfo.status = GroupStatus.PROGRESS;
  }
  state.activityLogs.unshift({ id: id(), memberName: "테스트 회원", message, createdAt: now() });
  return ok();
}
function newCard(title: string): MockCard {
  return { id: id(), title, description: "", portfolio: false, authorName: "테스트 회원", authorUserId: 1,
    assigneeName: null, assigneeUserId: null, inheritedFrom: null, coverImageUrl: null, labels: [], disabled: false,
    createdAt: now(), records: [] };
}

export function handleGroupRequest(method: string | undefined, url: URL, body: unknown): Result | null {
  const match = url.pathname.match(/^\/(manager\/)?groups\/(\d+)(?:\/(.*))?$/);
  if (!match) return null;
  if (Number(match[2]) !== state.groupInfo.id) return fail("그룹을 찾을 수 없습니다.", 404);
  const route = (match[3] ?? "").split("/").map(decodeURIComponent);
  const path = route.join("/");
  const input: Input = body && typeof body === "object" && !Array.isArray(body) ? body as Input : {};
  const info = state.groupInfo;
  const member = info.isMember;
  const leader = member && info.leaderUserId === 1;

  // 개발용 제어 요청은 현재 사용자와 서버 상태를 목업에서 변경한다.
  if (method === "PATCH" && path === "mock-scenario") {
    if (input.info && typeof input.info === "object") {
      const changes = input.info as Input;
      if (changes.status === GroupStatus.STOP && info.status !== GroupStatus.PROGRESS) return fail("진행 중인 그룹만 중단할 수 있습니다.", 409);
      if (changes.leaderUserId !== undefined && !state.members.some((m) => m.userId === changes.leaderUserId)) return fail("그룹 멤버만 그룹장이 될 수 있습니다.", 409);
      Object.assign(info, changes, { id: 1 });
    }
    if ("openCohort" in input) openCohort = input.openCohort as OpenSeminarCohortDto | null;
    return ok();
  }
  if (method === "GET") {
    if (!path) return ok(summary());
    if (path === "kanban") return ok(state.lists.map((list) => ({ ...list, cards: list.cards.map((card) => ({
      id: card.id, title: card.title, authorName: card.authorName, assigneeName: card.assigneeName,
      assigneeUserId: card.assigneeUserId,
      inheritedFrom: card.inheritedFrom, coverImageUrl: card.coverImageUrl, labels: card.labels,
      disabled: card.disabled, portfolio: card.portfolio, recordCount: card.records.length,
      hasDescription: !!card.description, createdAt: card.createdAt,
    })) })));
    if (path === "members") return ok(state.members.map((m) => {
      const owned = cards().filter((card) => card.authorUserId === m.userId);
      return { ...m, isLeader: m.userId === info.leaderUserId, cardCount: owned.length,
        recordCount: cards().reduce((sum, card) => sum + card.records.filter((record) => record.authorUserId === m.userId).length, 0) };
    }));
    if (path === "logs") return ok(state.activityLogs);
    if (path === "archived-cards") return ok(state.archivedCards);
    if (path === "saved-records") return ok(state.savedRecords);
    if (path === "activity-report-context") return ok(openCohort);
    if (path === "activity-report") return ok(state.activityReports);
    if (path === "discord-channel") return ok({ hasChatRoom: info.hasChatRoom, isChatParticipant: info.isChatParticipant });
    if (path === "discord-messages") return member && info.hasChatRoom ? ok(state.chatMessages) : fail("그룹 채팅방을 볼 수 없습니다.", 403);
    if (path === "search") {
      const keyword = text(url.searchParams.get("keyword")).toLocaleLowerCase();
      const target = url.searchParams.get("searchTarget");
      if (!["title", "author", "record"].includes(target ?? "")) return fail("검색 대상을 확인해주세요.");
      if (!keyword) return ok([]);
      return ok(state.lists.flatMap((list) => list.cards.flatMap((card) => {
        const base = { listTitle: list.title, cardId: card.id, cardTitle: card.title };
        if (target === "record") return card.records.filter((r) => r.content.toLocaleLowerCase().includes(keyword)).map((r) => ({ ...base, id: r.id, matchedText: r.content }));
        const value = target === "author" ? card.authorName : card.title;
        return value.toLocaleLowerCase().includes(keyword) ? [{ ...base, id: card.id, matchedText: target === "author" ? card.authorName : null }] : [];
      })));
    }
    if (route[0] === "cards" && route[2] === "records" && route.length === 3) {
      const card = cards().find((c) => c.id === route[1]);
      if (!card) return fail("카드를 찾을 수 없습니다.", 404);
      // 단건 조회의 기존 역방향 탐색은 전체 배열을 사용한다. 카드 창은 명시적으로 페이지를 요청한다.
      if (!url.searchParams.has("limit")) return ok(card.records);
      const offset = Number(url.searchParams.get("offset") ?? 0);
      const limit = Number(url.searchParams.get("limit"));
      const sortOrder = url.searchParams.get("sortOrder") ?? "newest";
      const includeDeleted = url.searchParams.get("includeDeleted") ?? "true";
      if (!Number.isInteger(offset) || offset < 0 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
        return fail("기록 조회 범위를 확인해주세요.");
      }
      if (!["newest", "oldest", "recentlyUpdated"].includes(sortOrder) || !["true", "false"].includes(includeDeleted)) {
        return fail("기록 정렬 및 삭제 기록 표시 설정을 확인해주세요.");
      }
      const records = card.records.filter((record) => includeDeleted === "true" || !record.deleted);
      records.sort((left, right) => {
        const order = sortOrder === "oldest"
          ? left.createdAt.localeCompare(right.createdAt)
          : sortOrder === "recentlyUpdated"
            ? right.updatedAt.localeCompare(left.updatedAt)
            : right.createdAt.localeCompare(left.createdAt);
        return order || left.id.localeCompare(right.id);
      });
      return ok({ records: records.slice(offset, offset + limit), count: records.length });
    }
    return fail("지원하지 않는 그룹 조회입니다.", 404);
  }
  if (path === "bookmark" && ["POST", "DELETE"].includes(method ?? "")) {
    info.isBookmarked = method === "POST"; return ok();
  }
  if (path === "members/@me" && method === "POST") {
    if (!info.allowJoin || (info.status !== GroupStatus.PROGRESS && info.status !== GroupStatus.STOP)) return fail("현재 참여할 수 없는 그룹입니다.", 409);
    info.isMember = true;
    if (!state.members.some((m) => m.userId === 1)) state.members.push({ userId: 1, name: "테스트 회원", college: "소프트웨어융합대학", isLeader: false, cardCount: 0, recordCount: 0 });
    return changed("그룹에 참여했습니다.");
  }
  if (match[1] && !(process.env.MOCK_MANAGER === "true")) return fail("운영진 권한이 필요합니다.", 403);
  if (!member && !match[1]) return fail("그룹 참여가 필요합니다.", 403);
  if (path === "members/@me" && method === "DELETE") {
    if (leader) return fail("그룹장을 위임한 뒤 탈퇴해주세요.", 409);
    state.members = state.members.filter((m) => m.userId !== 1); info.isMember = false; info.isChatParticipant = false; return changed("그룹에서 탈퇴했습니다.");
  }
  if (!path && method === "PUT") {
    if (!leader) return fail("그룹장만 설정을 변경할 수 있습니다.", 403);
    if (info.status === GroupStatus.SUCCESS || info.status === GroupStatus.FAIL) return fail("종료된 그룹은 수정할 수 없습니다.", 409);
    if (!text(input.title)) return fail("그룹 이름을 입력해주세요.");
    const allowed = ["title", "category", "description", "interests", "techStack", "repositoryUrls", "allowJoin", "visibility"];
    Object.assign(info, Object.fromEntries(Object.entries(input).filter(([key]) => allowed.includes(key))));
    return changed("그룹 설정을 변경했습니다.", false);
  }
  if (path === "state" && method === "PATCH") {
    if (!leader && !match[1]) return fail("그룹장 권한이 필요합니다.", 403);
    if (!Object.values(GroupStatus).includes(input.status as GroupStatus)) return fail("그룹 상태를 확인해주세요.");
    if ((input.status === GroupStatus.SUCCESS || input.status === GroupStatus.FAIL) && info.status !== GroupStatus.PROGRESS) return fail("진행 중인 그룹만 종료할 수 있습니다.", 409);
    info.status = input.status as GroupStatus; return changed("그룹 상태를 변경했습니다.", false);
  }
  if (path === "master" && method === "PATCH") {
    if (!leader) return fail("그룹장 권한이 필요합니다.", 403);
    const target = state.members.find((m) => m.userId === input.memberId);
    if (!target) return fail("회원을 찾을 수 없습니다.", 404);
    info.leaderUserId = target.userId; return changed("그룹장을 위임했습니다.");
  }
  if (route[0] === "members" && method === "DELETE") {
    if (!leader) return fail("그룹장 권한이 필요합니다.", 403);
    const index = state.members.findIndex((m) => m.userId === Number(route[1]));
    if (index < 0) return fail("회원을 찾을 수 없습니다.", 404);
    if (state.members[index].userId === info.leaderUserId) return fail("그룹장은 내보낼 수 없습니다.");
    state.members.splice(index, 1); return changed("회원을 내보냈습니다.");
  }
  if (path === "discord-channel" && method === "POST") {
    if (!leader) return fail("그룹장 권한이 필요합니다.", 403);
    info.hasChatRoom = true; info.isChatParticipant = true; return changed("채팅방을 만들었습니다.");
  }
  if (path === "discord-channel/members" && method === "POST") {
    if (!info.hasChatRoom || input.memberId !== 1) return fail("채팅방 참여 정보를 확인해주세요.");
    info.isChatParticipant = true; return ok();
  }
  if (path === "discord-messages" && method === "POST") {
    if (!info.hasChatRoom) return fail("채팅방이 아직 없습니다.", 409);
    const attachments = Array.isArray(input.attachments) ? input.attachments : [];
    if (!text(input.content) && !attachments.length) return fail("메시지를 입력해주세요.");
    if (attachments.some((a) => !a || typeof a.name !== "string" || typeof a.type !== "string" || typeof a.data !== "string")) return fail("첨부파일을 확인해주세요.");
    const message = { id: id(), authorName: "테스트 회원", content: text(input.content), createdAt: now(), attachments };
    state.chatMessages.push(message); return ok(message);
  }
  if (path === "portfolio" && ["POST", "DELETE"].includes(method ?? "")) {
    if (!leader) return fail("그룹장 권한이 필요합니다.", 403);
    info.hasPublishedPortfolio = method === "POST"; return changed("포트폴리오 공개 상태를 변경했습니다.");
  }
  if (route[0] === "activity-report") return reportRequest(method, route, input, leader);
  if (route[0] === "saved-records" && method === "DELETE") {
    const index = state.savedRecords.findIndex((r) => r.id === route[1]);
    if (index < 0) return fail("기록을 찾을 수 없습니다.", 404);
    state.savedRecords.splice(index, 1); return ok();
  }
  if (route[0] === "archived-cards" && route[2] === "restoration" && method === "POST") {
    const index = state.archivedCards.findIndex((c) => c.id === route[1]);
    const list = state.lists.find((l) => l.id === input.targetListId);
    if (index < 0 || !list) return fail("카드 또는 리스트를 찾을 수 없습니다.", 404);
    const archived = state.archivedCards.splice(index, 1)[0];
    const card = newCard(archived.title);
    const archivedAuthorUserId = state.members.find((m) => m.name === archived.authorName)?.userId ?? 1;
    Object.assign(card, { id: archived.id, authorName: archived.authorName, authorUserId: archivedAuthorUserId, createdAt: archived.createdAt,
      records: Array.from({ length: archived.recordCount }, (_, i) => ({
        type: "tiptap" as const,
        id: `${archived.id}-r${i}`, authorName: archived.authorName, authorUserId: archivedAuthorUserId,
        content: "보관된 기록입니다.", createdAt: now(), updatedAt: now(), deleted: false,
      })) });
    list.cards.push(card); return changed("카드를 복원했습니다.");
  }
  if (info.status !== GroupStatus.PROGRESS && info.status !== GroupStatus.STOP) return fail("종료된 그룹에서는 변경할 수 없습니다.", 409);
  if (path === "lists" && method === "POST") {
    if (!text(input.title)) return fail("리스트 이름을 입력해주세요.");
    state.lists.push({ id: id(), title: text(input.title), description: "", cards: [] }); return changed("리스트를 추가했습니다.");
  }
  if (route[0] === "lists") {
    const index = state.lists.findIndex((l) => l.id === route[1]);
    if (index < 0) return fail("리스트를 찾을 수 없습니다.", 404);
    const list = state.lists[index];
    if (route[2] === "position" && method === "PATCH") {
      if (input.beforeListId === list.id) return ok();
      if (input.beforeListId !== null && !state.lists.some((l) => l.id === input.beforeListId)) return fail("이동 위치를 찾을 수 없습니다.");
      state.lists.splice(index, 1);
      const target = input.beforeListId === null ? state.lists.length : state.lists.findIndex((l) => l.id === input.beforeListId);
      state.lists.splice(target, 0, list); return changed("리스트를 이동했습니다.");
    }
    if (method === "PATCH" && route.length === 2) {
      if (!text(input.title) || typeof input.description !== "string") return fail("리스트 정보를 확인해주세요.");
      list.title = text(input.title); list.description = input.description; return changed("리스트를 수정했습니다.");
    }
    if (method === "DELETE" && route.length === 2) {
      if (list.cards.length) return fail("빈 리스트만 삭제할 수 있습니다.", 409);
      state.lists.splice(index, 1); return changed("리스트를 삭제했습니다.");
    }
  }
  if (path === "cards" && method === "POST") {
    const list = state.lists.find((l) => l.id === input.listId);
    if (!list || !text(input.title)) return fail("카드 이름과 리스트를 확인해주세요.");
    list.cards.push(newCard(text(input.title))); return changed("카드를 추가했습니다.");
  }
  if (route[0] === "cards" && route[2] === "cover-image" && route[3] === "upload-link" && method === "POST") {
    const card = cards().find((c) => c.id === route[1]);
    if (!card) return fail("카드를 찾을 수 없습니다.", 404);
    if (!text(input.fileName) || !text(input.contentType)) return fail("파일 정보를 확인해주세요.");
    // activity-report와 같은 범용 uploads 맵/서빙 경로(/__mock-api/uploads/:id)를 그대로
    // 재사용한다 — 업로드 메커니즘 자체는 어떤 파일이든 동일하다.
    const fileUploadId = id();
    uploads.set(fileUploadId, { fileName: text(input.fileName), contentType: text(input.contentType), used: false });
    return ok({ fileUploadId, url: `/__mock-api/uploads/${fileUploadId}` });
  }
  if (route[0] === "cards" && method === "PATCH") {
    const source = state.lists.find((l) => l.cards.some((c) => c.id === route[1]));
    const card = source?.cards.find((c) => c.id === route[1]);
    if (!source || !card) return fail("카드를 찾을 수 없습니다.", 404);
    if (route[2] === "portfolio") {
      if (typeof input.portfolio !== "boolean") return fail("선택 값을 확인해주세요.");
      card.portfolio = input.portfolio; return changed("포트폴리오 카드를 변경했습니다.");
    }
    if (route[2] === "labels") {
      if (!Array.isArray(input.labels)) return fail("라벨 값을 확인해주세요.");
      card.labels = input.labels as MockCard["labels"]; return changed("카드 라벨을 변경했습니다.");
    }
    if (route[2] === "assignee") {
      if (input.assigneeUserId !== null && typeof input.assigneeUserId !== "number") return fail("담당자 값을 확인해주세요.");
      const assignee = input.assigneeUserId === null ? null : state.members.find((m) => m.userId === input.assigneeUserId);
      if (input.assigneeUserId !== null && !assignee) return fail("그룹 멤버만 담당자로 지정할 수 있습니다.", 409);
      card.assigneeUserId = input.assigneeUserId as number | null;
      card.assigneeName = assignee?.name ?? null;
      return changed("카드 담당자를 변경했습니다.");
    }
    if (route[2] === "disabled") {
      if (typeof input.disabled !== "boolean") return fail("선택 값을 확인해주세요.");
      card.disabled = input.disabled; return changed("카드 활성 상태를 변경했습니다.");
    }
    if (route[2] === "cover-image") {
      // URL 직접 입력/붙여넣기는 coverImageUrl로, 파일 업로드/드래그앤드롭은 업로드 링크로
      // 먼저 받은 fileUploadId로 온다 — 둘 중 하나만 실려 있으면 된다.
      if (typeof input.coverImageUrl === "string" && text(input.coverImageUrl)) {
        card.coverImageUrl = text(input.coverImageUrl); return changed("카드 커버 이미지를 변경했습니다.");
      }
      if (typeof input.fileUploadId === "string") {
        const upload = uploads.get(input.fileUploadId);
        if (!upload) return fail("업로드한 파일을 찾을 수 없습니다.", 404);
        card.coverImageUrl = `/__mock-api/uploads/${input.fileUploadId}`; return changed("카드 커버 이미지를 변경했습니다.");
      }
      return fail("이미지 정보를 확인해주세요.");
    }
    if (route[2] === "position") {
      const target = state.lists.find((l) => l.id === input.targetListId);
      if (!target) return fail("대상 리스트를 찾을 수 없습니다.", 404);
      if (input.beforeCardId === card.id && source === target) return ok();
      if (input.beforeCardId !== null && !target.cards.some((c) => c.id === input.beforeCardId && c.id !== card.id)) return fail("이동 위치를 찾을 수 없습니다.");
      source.cards.splice(source.cards.indexOf(card), 1);
      target.cards.splice(input.beforeCardId === null ? target.cards.length : target.cards.findIndex((c) => c.id === input.beforeCardId), 0, card);
      return changed("카드를 이동했습니다.");
    }
  }
  if (route[0] === "cards" && method === "DELETE" && route.length === 2) {
    const source = state.lists.find((l) => l.cards.some((c) => c.id === route[1]));
    const card = source?.cards.find((c) => c.id === route[1]);
    if (!source || !card) return fail("카드를 찾을 수 없습니다.", 404);
    source.cards.splice(source.cards.indexOf(card), 1);
    state.archivedCards.unshift({ id: card.id, title: card.title, authorName: card.authorName, recordCount: card.records.length, createdAt: card.createdAt, deletedAt: now() });
    return changed("카드를 삭제했습니다.");
  }
  if (route[0] === "cards" && route[2] === "records" && route[3] === "media" && route[4] === "upload-link" && method === "POST") {
    const card = cards().find((c) => c.id === route[1]);
    if (!card) return fail("카드를 찾을 수 없습니다.", 404);
    if (!text(input.fileName) || !text(input.contentType)) return fail("파일 정보를 확인해주세요.");
    // 업로드한 파일은 커밋 단계 없이 기록 본문이 fileUrl로 바로 참조한다.
    const fileUploadId = id();
    uploads.set(fileUploadId, { fileName: text(input.fileName), contentType: text(input.contentType), used: false, inline: true });
    const fileUrl = `/__mock-api/uploads/${fileUploadId}`;
    return ok({ fileUploadId, url: fileUrl, fileUrl });
  }
  if (route[0] === "cards" && route[2] === "records" && route.length === 3 && method === "POST") {
    const card = cards().find((c) => c.id === route[1]);
    if (!card) return fail("카드를 찾을 수 없습니다.", 404);
    if (card.disabled) return fail("읽기 전용 카드에는 기록할 수 없습니다.", 403);
    if (typeof input.content !== "string" || !input.content.trim()) return fail("기록 내용을 입력해주세요.");
    const timestamp = now();
    const record = { type: "tiptap" as const, id: id(), authorName: "테스트 회원", authorUserId: 1, content: input.content, createdAt: timestamp, updatedAt: timestamp, deleted: false };
    card.records.push(record);
    changed("기록을 작성했습니다.");
    return ok(record);
  }
  if (route[0] === "cards" && route[2] === "records" && route.length >= 4) {
    const card = cards().find((c) => c.id === route[1]);
    const record = card?.records.find((r) => r.id === route[3]);
    if (!card || !record) return fail("기록을 찾을 수 없습니다.", 404);
    if (method === "POST" && route.length === 5 && route[4] === "saving") {
      if (record.deleted) return fail("삭제된 기록은 보관할 수 없습니다.", 403);
      if (!state.savedRecords.some((saved) => saved.id === record.id)) {
        state.savedRecords.unshift({ type: record.type, id: record.id, content: record.content,
          cardId: card.id, cardTitle: card.title, authorName: record.authorName, createdAt: record.createdAt, savedAt: now() });
      }
      return ok(state.savedRecords.find((saved) => saved.id === record.id));
    }
    if (method === "PATCH" && route.length === 5 && route[4] === "card") {
      if (card.disabled || record.deleted) return fail("이 기록을 이동할 수 없습니다.", 403);
      const target = cards().find((item) => item.id === input.targetCardId);
      if (!target) return fail("대상 카드를 찾을 수 없습니다.", 404);
      if (target.disabled) return fail("비활성 카드로 이동할 수 없습니다.", 403);
      if (target.id === card.id) return fail("현재 카드로 이동할 수 없습니다.");
      card.records.splice(card.records.indexOf(record), 1);
      target.records.push(record);
      for (const saved of state.savedRecords.filter((item) => item.id === record.id)) {
        saved.cardId = target.id;
        saved.cardTitle = target.title;
      }
      return changed("기록을 이동했습니다.");
    }
    if (method === "PATCH" && route.length === 4) {
      if (record.type === "legacy") return fail("레거시 기록은 아직 수정할 수 없습니다.", 403);
      if (card.disabled || record.deleted) return fail("이 기록을 수정할 수 없습니다.", 403);
      if (typeof input.content !== "string" || !input.content.trim()) return fail("기록 내용을 입력해주세요.");
      record.content = input.content;
      record.updatedAt = now();
      return changed("기록을 수정했습니다.");
    }
    if (method === "DELETE" && route.length === 4) {
      record.deleted = true; record.updatedAt = now(); return changed("기록을 삭제했습니다.");
    }
    if (method === "POST" && route[4] === "restoration") {
      record.deleted = false; record.updatedAt = now(); return changed("기록을 복구했습니다.");
    }
  }
  return fail("지원하지 않는 그룹 요청입니다.", 404);
}

function reportRequest(method: string | undefined, route: string[], input: Input, leader: boolean): Result {
  if (!leader) return fail("그룹장 권한이 필요합니다.", 403);
  const cohort = openCohort;
  if (!cohort) return fail("현재 활동보고서 접수 기간이 아닙니다.", 409);
  if (route[1] === "upload-link" && method === "POST") {
    if (!text(input.fileName) || !text(input.contentType)) return fail("파일 정보를 확인해주세요.");
    const fileUploadId = id(); uploads.set(fileUploadId, { fileName: text(input.fileName), contentType: text(input.contentType), used: false });
    return ok({ fileUploadId, url: `/__mock-api/uploads/${fileUploadId}` });
  }
  const report = state.activityReports.find((r) => r.id === route[1]);
  if (route.length === 2 && !report) return fail("활동보고서를 찾을 수 없습니다.", 404);
  if (report && report.seminarId !== cohort.id) return fail("현재 회차의 활동보고서만 변경할 수 있습니다.", 409);
  if (method === "DELETE" && report) { state.activityReports.splice(state.activityReports.indexOf(report), 1); return changed("활동보고서를 취소했습니다."); }
  if (method !== "POST" && method !== "PATCH") return fail("지원하지 않는 요청입니다.", 404);
  if (input.isPresentation !== undefined && typeof input.isPresentation !== "boolean") return fail("발표 여부를 확인해주세요.");
  const upload = typeof input.fileUploadId === "string" ? uploads.get(input.fileUploadId) : undefined;
  if ((method === "POST" || input.fileUploadId !== undefined) && (!upload?.data || upload.used)) return fail("파일을 먼저 업로드해주세요.");
  if (method === "POST") {
    if (input.seminarId !== cohort.id || typeof input.isPresentation !== "boolean") return fail("접수 회차와 발표 여부를 확인해주세요.");
    if (state.activityReports.some((r) => r.seminarId === cohort.id)) return fail("이미 제출한 활동보고서가 있습니다.", 409);
    state.activityReports.unshift({ id: id(), seminarId: cohort.id, seminarDate: cohort.seminarDate,
      isSummerSeason: cohort.isSummerSeason, isSpeakAfter: cohort.isSpeakAfter,
      isPresentation: input.isPresentation, fileName: upload!.fileName, reportFileUrl: `/__mock-api/uploads/${input.fileUploadId}`, createdAt: now() });
  } else if (report) {
    if (typeof input.isPresentation === "boolean") report.isPresentation = input.isPresentation;
    if (upload) { report.fileName = upload.fileName; report.reportFileUrl = `/__mock-api/uploads/${input.fileUploadId}`; }
  }
  if (upload) upload.used = true;
  return changed("활동보고서를 저장했습니다.");
}
