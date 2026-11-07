import { randomUUID } from "node:crypto";
import { GroupStatus, GroupVisibility } from "../../src/constant";
import type { OpenSeminarCohortDto } from "../../src/api/public/group/GroupExposureApi";
import { getGroupRepositoryUrlError, GROUP_REPOSITORY_SEPARATOR, MAX_GROUP_REPOSITORIES } from "../../src/util/groupRepositoryUrls";
import { getGroupDelimitedValuesError } from "../../src/util/groupDelimitedValues";
import { createGroupFixture, MOCK_CHAT_ROOM_URL, MOCK_OTHER_GROUP_ID, MOCK_UPLOADED_RECORD_FILES, nextMockRecordId, type MockCard, type MockRecordFile } from "./groupFixtures";
import { compareMockIntegerIds, nextMockIntegerId } from "./integerId";
import { isIntegerId } from "../../src/util/integerId";

type Result = { status: number; body?: unknown; headers?: Record<string, string> };
type Input = Record<string, unknown>;
const state = createGroupFixture();
// 삭제한 카드의 원본 기록을 유지해 보관 목록 조회·해제 및 카드 복구에 사용한다.
const deletedCards = new Map<string, MockCard>();
for (const saved of state.savedRecords.filter((record) => record.isCardDeleted)) {
  const list = state.lists.find((list) => list.cards.some((card) => card.id === saved.cardId));
  const card = list?.cards.find((card) => card.id === saved.cardId);
  if (!list || !card) continue;
  list.cards.splice(list.cards.indexOf(card), 1);
  deletedCards.set(card.id, card);
  state.archivedCards.unshift({ id: card.id, title: card.title, authorName: card.authorName, recordCount: card.records.length, createdAt: card.createdAt, deletedAt: "2026-10-10T00:00:00Z" });
}
let openCohort: OpenSeminarCohortDto | null = state.openSeminarCohort;
// inline: 기록 본문의 <img>/<audio>가 바로 재생할 수 있게 다운로드(attachment) 대신 원래 형식으로 내려준다.
export const uploads = new Map<string, { fileName: string; contentType: string; data?: Buffer; used: boolean; inline?: boolean; groupId?: string; uploaded?: boolean; purpose?: "record" | "cover" | "report" }>();
for (const file of MOCK_UPLOADED_RECORD_FILES) {
  uploads.set(file.fileId, { fileName: file.name, contentType: file.contentType, data: Buffer.from(file.data, file.contentType === "image/png" ? "base64" : "utf8"), used: true, inline: true, groupId: "1", uploaded: true, purpose: "record" });
}
for (const card of state.lists.flatMap((list) => list.cards)) {
  if (card.coverImageUrl === "/__mock-api/assets/kanban-cover-demo.svg") {
    const image = MOCK_UPLOADED_RECORD_FILES[0];
    card.coverImageUrl = `/__mock-api/groups/1/files/${image.fileId}`;
  }
}
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
  state.activityLogs.unshift({ id: nextMockIntegerId(), memberName: "테스트 회원", message, createdAt: now() });
  return ok();
}
// 화면에 내려주는 카드 요약·기록 형태. 목업 내부 저장 형태(portfolio·disabled·deleted)를 API 필드명으로 바꾼다.
function cardSummary(card: MockCard) {
  return { id: card.id, title: card.title, authorName: card.authorName, assigneeName: card.assigneeName,
    assigneeUserId: card.assigneeUserId, coverImageUrl: card.coverImageUrl, labels: card.labels,
    isDisabled: card.disabled, isInPortfolio: card.portfolio, recordCount: card.records.filter((r) => !r.deleted).length,
    hasDescription: !!card.description, createdAt: card.createdAt };
}
function recordView(record: MockCard["records"][number]) {
  const { deleted, authorUserId: _authorUserId, ...rest } = record;
  return { ...rest, isDeleted: deleted, isInPortfolio: record.isInPortfolio ?? true,
    isInUserArchive: state.savedRecords.some((saved) => saved.id === record.id), files: (record.files ?? []).map(recordFileView) };
}
// 요청의 files 배열을 검사해 새 파일은 업로드 기록을 만들고 업로드 주소를 돌려준다. 잘못된 항목이 있으면 null이다.
export function registerRecordFiles(input: unknown, groupId: string): { files: MockRecordFile[]; uploads: { id: string; fileId: string; url: string; uploadUrl: string }[] } | null {
  if (!Array.isArray(input)) return null;
  const files: MockRecordFile[] = [];
  const created: { id: string; fileId: string; url: string; uploadUrl: string }[] = [];
  const ids = new Set<string>();
  for (const entry of input) {
    if (!entry || typeof entry !== "object") return null;
    const item = entry as Record<string, unknown>;
    if (typeof item.id !== "string" || ids.has(item.id) || typeof item.name !== "string" || typeof item.size !== "number"
      || typeof item.contentType !== "string" || item.size < 0 || item.size > 20 * 1024 * 1024) return null;
    ids.add(item.id);
    let fileId = item.fileId;
    if (fileId === null) {
      fileId = id();
      uploads.set(fileId as string, { fileName: item.name, contentType: item.contentType, used: false, inline: true, groupId, uploaded: false, purpose: "record" });
      created.push({ id: item.id, fileId: fileId as string, url: `/__mock-api/groups/${groupId}/files/${fileId}`, uploadUrl: `/__mock-api/uploads/${fileId}` });
    } else if (typeof fileId !== "string" || uploads.get(fileId)?.groupId !== groupId || uploads.get(fileId)?.purpose !== "record") {
      return null;
    }
    files.push({ id: item.id, fileId: fileId as string, name: item.name, size: item.size, contentType: item.contentType });
  }
  return { files, uploads: created };
}
// 업로드가 끝난 파일만 읽기 링크를 준다.
export function recordFileView(file: MockRecordFile) {
  return { ...file, url: uploads.get(file.fileId)?.uploaded ? `/__mock-api/groups/${uploads.get(file.fileId)!.groupId}/files/${file.fileId}` : null };
}
function recordText(record: MockCard["records"][number]): string {
  if (record.type === "legacy") return record.content.replace(/<[^>]*>/g, " ");
  try {
    type TextNode = { text?: string; type?: string; attrs?: { latex?: string }; content?: TextNode[] };
    const walk = (node: TextNode): string => {
      if (node.type === "text") return node.text ?? "";
      if (node.type === "inlineMath" || node.type === "blockMath") return node.attrs?.latex ?? "";
      if (node.type === "hardBreak") return "\n";
      const body = (node.content ?? []).map(walk).join("");
      return body + (["paragraph", "heading", "codeBlock", "tableCell", "tableHeader", "detailsSummary"].includes(node.type ?? "") ? "\n" : "");
    };
    return walk(JSON.parse(record.content)).replace(/\s+/g, " ").trim();
  } catch { return record.content; }
}
function page<T>(items: T[], page: number, size: number) {
  const offset = page * size;
  const slice = items.slice(offset, offset + size);
  return { page, totalCount: items.length, receivedCount: slice.length, items: slice };
}

// 목록의 기준은 보관 연결이다. 원본이 보드에서 빠져도 보관한 항목을 누락하지 않는다.
function savedRecordViews() {
  const allCards = [...cards(), ...deletedCards.values()];
  return state.savedRecords.map((saved) => {
    const card = allCards.find((card) => card.records.some((record) => record.id === saved.id));
    const record = card?.records.find((record) => record.id === saved.id);
    return {
      ...saved,
      cardId: card?.id ?? saved.cardId,
      cardTitle: card?.title ?? saved.cardTitle,
      content: record?.content ?? saved.content,
      isDeleted: record?.deleted ?? saved.isDeleted,
      isCardDeleted: card ? deletedCards.has(card.id)
        : state.archivedCards.some((card) => card.id === saved.cardId) || saved.isCardDeleted,
    };
  }).sort((a, b) => b.savedAt.localeCompare(a.savedAt) || compareMockIntegerIds(b.id, a.id));
}
function newCard(title: string): MockCard {
  return { id: nextMockIntegerId(), title, description: "", portfolio: false, authorName: "테스트 회원", authorUserId: 1,
    assigneeName: null, assigneeUserId: null, inheritedFrom: null, coverImageUrl: null, labels: [], disabled: false,
    createdAt: now(), records: [] };
}

// 임시저장 목업이 카드 이름을 채울 때 쓴다.
export function findMockCardTitle(cardId: string): string | null {
  return cards().find((card) => card.id === cardId)?.title ?? null;
}
export function handleGroupRequest(method: string | undefined, url: URL, body: unknown, isManager = process.env.MOCK_MANAGER !== "false"): Result | null {
  if (method === "GET" && url.pathname === "/seminars/current") return ok(openCohort);
  if (url.pathname === "/saved-records" && method === "GET") {
    const pageNumber = Number(url.searchParams.get("page") ?? 0);
    if (!Number.isSafeInteger(pageNumber) || pageNumber < 0) return fail("조회 범위를 확인해주세요.");
    const { items, ...meta } = page(savedRecordViews(), pageNumber, 10);
    return ok({ ...meta, records: items.map(({ id: recordId, ...record }) => ({ ...record, recordId })) });
  }
  const match = url.pathname.match(/^\/(manager\/)?groups\/(\d+)(?:\/(.*))?$/);
  if (!match) return null;
  if (!isIntegerId(match[2])) return fail("그룹 ID를 확인해주세요.");
  if (![state.groupInfo.id, "2", MOCK_OTHER_GROUP_ID].includes(match[2])) return fail("그룹을 찾을 수 없습니다.", 404);
  const route = (match[3] ?? "").split("/").map(decodeURIComponent);
  const path = route.join("/");
  const input: Input = body && typeof body === "object" && !Array.isArray(body) ? body as Input : {};
  const info = state.groupInfo;
  const member = info.isMember;
  const leader = member && info.leaderUserId === 1;

  if (route[0] === "files" && route.length === 2 && (method === "GET" || method === "HEAD")) {
    const viewer = member || info.visibility === GroupVisibility.PUBLIC
      || info.visibility === GroupVisibility.MEMBER_ONLY || (isManager && info.visibility === GroupVisibility.MANAGER_ONLY);
    if (!viewer) return fail("그룹 열람 권한이 없습니다.", 403);
    const file = uploads.get(route[1]);
    if (!file || file.groupId !== match[2] || file.purpose === "report" || !file.uploaded || !file.data) return fail("파일을 찾을 수 없습니다.", 404);
    return { status: 302, headers: { Location: `/__mock-api/uploads/${route[1]}`, "Cache-Control": "private, no-store" } };
  }

  // 개발용 제어 요청은 현재 사용자와 서버 상태를 목업에서 변경한다.
  if (method === "PATCH" && path === "mock-scenario") {
    if (input.info && typeof input.info === "object") {
      const changes = input.info as Input;
      if (changes.status === GroupStatus.STOP && info.status !== GroupStatus.PROGRESS) return fail("진행 중인 그룹만 중단할 수 있습니다.", 409);
      if (changes.leaderUserId !== undefined && !state.members.some((m) => m.userId === changes.leaderUserId)) return fail("그룹 멤버만 그룹장이 될 수 있습니다.", 409);
      for (const key of ["hasChatRoom", "isChatParticipant"]) {
        if (key in changes && typeof changes[key] !== "boolean") return fail("채팅 상태를 확인해주세요.");
      }
      const hasChatRoom = changes.hasChatRoom ?? info.hasChatRoom;
      const isMember = changes.isMember ?? info.isMember;
      if (changes.isChatParticipant === true && (!hasChatRoom || !isMember)) return fail("그룹원이며 채팅방이 있어야 참여 상태를 설정할 수 있습니다.", 409);
      Object.assign(info, changes, { id: info.id });
      info.chatRoomUrl = info.hasChatRoom ? info.chatRoomUrl ?? MOCK_CHAT_ROOM_URL : null;
      if (!info.hasChatRoom || !info.isMember) info.isChatParticipant = false;
    }
    if ("openCohort" in input) openCohort = input.openCohort as OpenSeminarCohortDto | null;
    return ok();
  }
  if (method === "GET") {
    if (path === "info") {
      const s = summary();
      return ok({
        id: match[2], title: match[2] === MOCK_OTHER_GROUP_ID ? "다른 그룹 목업" : s.title, description: s.description, category: s.category, status: s.status,
        requesterInfo: {
          userRole: !s.isMember ? "NONE" : s.leaderUserId === 1 ? "LEADER" : "MEMBER",
          isBookmarked: s.isBookmarked, isInChatRoom: s.isMember && s.hasChatRoom && s.isChatParticipant,
        },
        specialOrganization: s.specialOrganizations[0] ?? null, interests: s.interests, techStack: s.techStack,
        repositoryUrls: s.repositoryUrls, memberCount: s.memberCount,
        activity: { listCount: s.listCount, cardCount: s.cardCount, recordCount: s.recordCount },
        createdAt: s.createdAt, lastActivityAt: s.lastActivityAt, allowJoin: s.allowJoin, visibility: s.visibility,
        exposure: { isPortfolioPublished: s.hasPublishedPortfolio, portfolioListCount: s.portfolioListCount,
          portfolioCardCount: s.portfolioCardCount, seminarCount: s.seminarCount, reportCount: s.reportCount },
        hasChatRoom: s.hasChatRoom,
        chatRoomUrl: s.hasChatRoom ? s.chatRoomUrl ?? MOCK_CHAT_ROOM_URL : null,
      });
    }
    if (path === "lists") {
      const pageNumber = Number(url.searchParams.get("page") ?? 0);
      if (!Number.isSafeInteger(pageNumber) || pageNumber < 0) return fail("조회 범위를 확인해주세요.");
      const { items, ...meta } = page(state.lists, pageNumber, 10);
      return ok({ ...meta, lists: items.map((list) => ({ id: list.id, title: list.title, description: list.description,
        cardCount: list.cards.length, cards: list.cards.slice(0, 15).map(cardSummary) })) });
    }
    if (route[0] === "lists" && route[2] === "cards" && route.length === 3) {
      const list = state.lists.find((l) => l.id === route[1]);
      if (!list) return fail("리스트를 찾을 수 없습니다.", 404);
      const pageNumber = Number(url.searchParams.get("page") ?? 0);
      if (!Number.isSafeInteger(pageNumber) || pageNumber < 0) return fail("조회 범위를 확인해주세요.");
      const { items, ...meta } = page(list.cards, pageNumber, 15);
      return ok({ ...meta, cards: items.map(cardSummary) });
    }
    if (route[0] === "cards" && route.length === 2) {
      const list = state.lists.find((l) => l.cards.some((c) => c.id === route[1]));
      const card = list?.cards.find((c) => c.id === route[1]);
      if (!list || !card) return fail("카드를 찾을 수 없습니다.", 404);
      return ok({ ...cardSummary(card), listId: list.id, listTitle: list.title, description: card.description, recordSort: card.recordSort ?? "NEWEST" });
    }
    if (path === "members") return ok({ leaderUserId: info.leaderUserId, members: [...state.members].sort((a, b) => Number(b.userId === info.leaderUserId) - Number(a.userId === info.leaderUserId) || a.name.localeCompare(b.name)).map((m) => {
      const owned = cards().filter((card) => card.authorUserId === m.userId);
      return { userId: m.userId, name: m.name, college: m.college, cardCount: owned.length,
        recordCount: cards().reduce((sum, card) => sum + card.records.filter((record) => record.authorUserId === m.userId && !record.deleted).length, 0) };
    }) });
    if (path === "logs") {
      const pageNumber = Number(url.searchParams.get("page") ?? 0);
      if (!Number.isSafeInteger(pageNumber) || pageNumber < 0) return fail("조회 범위를 확인해주세요.");
      const { items, ...meta } = page(state.activityLogs, pageNumber, 50);
      return ok({ ...meta, logs: items.map((log) => ({
        id: log.id, actor: { userId: 1, name: log.memberName },
        logType: "LEGACY", logData: { html: log.message }, createdAt: log.createdAt,
      })) });
    }
    if (path === "deleted-cards" || path === "saved-records") {
      const pageNumber = Number(url.searchParams.get("page") ?? 0);
      if (!Number.isSafeInteger(pageNumber) || pageNumber < 0) return fail("조회 범위를 확인해주세요.");
      if (path === "deleted-cards") {
        const { items, ...meta } = page(state.archivedCards, pageNumber, 20);
        return ok({ ...meta, cards: items });
      }
      const { items, ...meta } = page(savedRecordViews(), pageNumber, 10);
      return ok({ ...meta, records: items.map(({ id: recordId, ...record }) => ({ ...record, recordId, files: [] })) });
    }
    if (path === "activity-reports") return ok({ reports: state.activityReports });
    if (path === "chat-messages") {
      if (!member) return fail("그룹원만 채팅을 볼 수 있습니다.", 403);
      if (!info.hasChatRoom) return fail("그룹 채팅방이 없습니다.");
      const before = url.searchParams.get("before");
      if (before !== null && (!/^[0-9]+$/.test(before) || BigInt(before) > 9223372036854775807n)) return fail("조회 범위를 확인해주세요.");
      // 커서보다 이전인 메시지 중 최신 50개를 오래된 순으로 돌려준다.
      const eligible = before === null ? state.chatMessages : state.chatMessages.filter((message) => BigInt(message.id) < BigInt(before));
      const end = eligible.length;
      const messages = eligible.slice(Math.max(0, end - 50), end);
      const hasMore = end > messages.length;
      return ok({ nextBefore: hasMore ? messages[0].id : null, receivedCount: messages.length, hasMore, messages });
    }
    if (path === "search") {
      const keyword = text(url.searchParams.get("keyword")).toLocaleLowerCase();
      const target = (url.searchParams.get("target") ?? "").toLowerCase();
      if (!["title", "author", "record"].includes(target ?? "")) return fail("검색 대상을 확인해주세요.");
      const pageSize = 50;
      const page = Number(url.searchParams.get("page") ?? 1);
      if (!Number.isSafeInteger(page) || page < 1) return fail("검색 페이지를 확인해주세요.");
      const offset = (page - 1) * pageSize;
      if (!keyword) return ok({ page, totalPages: 0, receivedCount: 0, results: [] });
      type SearchRow = { listId: string; listTitle: string; cardId: string; cardTitle: string; recordId: string | null; matchedText: string | null };
      const results = state.lists.flatMap((list) => list.cards.flatMap((card): SearchRow[] => {
        const base = { listId: list.id, listTitle: list.title, cardId: card.id, cardTitle: card.title };
        if (target === "record") return card.records.filter((r) => !r.deleted && recordText(r).toLocaleLowerCase().includes(keyword)).map((r) => ({ ...base, recordId: r.id, matchedText: recordText(r) }));
        const value = target === "author" ? card.authorName : card.title;
        return value.toLocaleLowerCase().includes(keyword) ? [{ ...base, recordId: null, matchedText: target === "author" ? card.authorName : null }] : [];
      }));
      const pageResults = results.slice(offset, offset + pageSize);
      return ok({ page, totalPages: Math.ceil(results.length / pageSize), receivedCount: pageResults.length, results: pageResults });
    }
    if (route[0] === "cards" && route[2] === "records" && route.length === 3) {
      const card = cards().find((c) => c.id === route[1]);
      if (!card) return fail("카드를 찾을 수 없습니다.", 404);
      // 단건 조회의 기존 역방향 탐색은 전체 배열을 사용한다. 카드 창은 명시적으로 페이지를 요청한다.
      const offset = Number(url.searchParams.get("offset") ?? 0);
      const limit = Number(url.searchParams.get("limit") ?? 10);
      const sortOrder = { NEWEST: "newest", OLDEST: "oldest", RECENTLY_UPDATED: "recentlyUpdated" }[card.recordSort ?? "NEWEST"];
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
        return order || compareMockIntegerIds(left.id, right.id);
      });
      const items = records.slice(offset, offset + limit);
      return ok({ offset, totalCount: records.length, receivedCount: items.length, records: items.map(recordView) });
    }
    if (route[0] === "records" && route.length === 2) {
      const card = cards().find((c) => c.records.some((r) => r.id === route[1]));
      const record = card?.records.find((r) => r.id === route[1]);
      if (!card || !record) return fail("기록을 찾을 수 없습니다.", 404);
      const list = state.lists.find((l) => l.cards.includes(card))!;
      return ok({ ...recordView(record), cardId: card.id, cardTitle: card.title, listId: list.id, listTitle: list.title });
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
  if (route[0] === "status" && route.length === 2 && method === "PUT" && !match[1]) {
    if (route[1] === "stop") {
      if (!isManager) return fail("운영진만 그룹을 중단할 수 있습니다.", 403);
      if (info.status !== GroupStatus.PROGRESS) return fail("진행 중인 그룹만 중단할 수 있습니다.");
      info.status = GroupStatus.STOP;
      return changed("그룹 활동을 중단했습니다.", false);
    }
    if (!leader && !isManager) return fail("그룹장 또는 운영진만 그룹 상태를 변경할 수 있습니다.", 403);
    if (route[1] === "end") {
      if (input.status !== GroupStatus.SUCCESS && input.status !== GroupStatus.FAIL) return fail("종료 상태를 확인해주세요.");
      if (info.status !== GroupStatus.PROGRESS) return fail("진행 중인 그룹만 종료할 수 있습니다.");
      info.status = input.status;
      return changed(input.status === GroupStatus.SUCCESS ? "그룹 활동을 성공으로 종료했습니다." : "그룹 활동을 실패로 종료했습니다.", false);
    }
    if (route[1] === "progress") {
      if (info.status !== GroupStatus.STOP && info.status !== GroupStatus.SUCCESS && info.status !== GroupStatus.FAIL) return fail("중단되거나 종료된 그룹만 진행중으로 변경할 수 있습니다.");
      info.status = GroupStatus.PROGRESS;
      return changed("그룹을 진행중으로 변경했습니다.");
    }
    return fail("지원하지 않는 상태 변경입니다.", 404);
  }
  if (match[1] && !isManager) return fail("운영진 권한이 필요합니다.", 403);
  if (!member && !match[1]) return fail("그룹 참여가 필요합니다.", 403);
  if (path === "members/@me" && method === "DELETE") {
    if (leader) return fail("그룹장을 위임한 뒤 탈퇴해주세요.", 409);
    state.members = state.members.filter((m) => m.userId !== 1); info.isMember = false; info.isChatParticipant = false; return changed("그룹에서 탈퇴했습니다.");
  }
  if (!path && method === "PUT") {
    if (!leader) return fail("그룹장만 설정을 변경할 수 있습니다.", 403);
    if (info.status === GroupStatus.SUCCESS || info.status === GroupStatus.FAIL) return fail("종료된 그룹은 수정할 수 없습니다.", 409);
    if (!text(input.title)) return fail("그룹 이름을 입력해주세요.");
    if (typeof input.techStack !== "string") return fail("사용 기술은 쉼표로 구분한 문자열이어야 합니다.");
    const technologies = input.techStack === "" ? [] : input.techStack.split(",");
    const technologyLengthError = getGroupDelimitedValuesError(technologies, "사용 기술");
    if (technologyLengthError) return fail(technologyLengthError);
    if (technologies.some((technology) => !technology.trim())) return fail("사용 기술 이름이 비어 있습니다.");
    if (new Set(technologies).size !== technologies.length) return fail("사용 기술에 중복 값이 있습니다.");
    if (typeof input.repositoryUrls !== "string") return fail("저장소 URL은 줄바꿈으로 구분한 문자열이어야 합니다.");
    const repositories = input.repositoryUrls === "" ? [] : input.repositoryUrls.split(GROUP_REPOSITORY_SEPARATOR);
    if (repositories.length > MAX_GROUP_REPOSITORIES) return fail("저장소는 최대 5개까지 추가할 수 있습니다.");
    const repositoryLengthError = getGroupDelimitedValuesError(repositories, "저장소 URL", GROUP_REPOSITORY_SEPARATOR);
    if (repositoryLengthError) return fail(repositoryLengthError);
    for (const repository of repositories) {
      if (!repository.trim()) return fail("저장소 URL을 입력해주세요.");
      const error = getGroupRepositoryUrlError(repository);
      if (error) return fail(error);
    }
    if (new Set(repositories).size !== repositories.length) return fail("저장소 URL에 중복 값이 있습니다.");
    const allowed = ["title", "category", "description", "interests", "allowJoin", "visibility"];
    Object.assign(info, Object.fromEntries(Object.entries(input).filter(([key]) => allowed.includes(key))));
    info.techStack = technologies;
    info.repositoryUrls = repositories;
    return changed("그룹 설정을 변경했습니다.", false);
  }
  if (path === "leader" && method === "PUT") {
    if (!leader) return fail("그룹장 권한이 필요합니다.", 403);
    const target = state.members.find((m) => m.userId === input.userId);
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
  if (path === "chat-room" && method === "POST") {
    if (!leader) return fail("그룹장 권한이 필요합니다.", 403);
    info.hasChatRoom = true;
    info.chatRoomUrl ??= MOCK_CHAT_ROOM_URL;
    info.isChatParticipant = true; return changed("채팅방을 만들었습니다.");
  }
  if (path === "chat-room/join" && method === "POST") {
    if (!info.hasChatRoom || info.isChatParticipant) return fail("채팅방 참여 정보를 확인해주세요.");
    info.isChatParticipant = true; return ok();
  }
  if (path === "chat-messages" && method === "POST") {
    if (!info.hasChatRoom) return fail("채팅방이 아직 없습니다.", 409);
    const attachments = Array.isArray(input.attachments) ? input.attachments : [];
    if (!text(input.content) && !attachments.length) return fail("메시지를 입력해주세요.");
    if (attachments.some((a) => !a || typeof a.name !== "string" || typeof a.url !== "string")) return fail("첨부파일을 확인해주세요.");
    const messageId = (state.chatMessages.reduce((max, message) => BigInt(message.id) > max ? BigInt(message.id) : max, 0n) + 1n).toString();
    const message = { id: messageId, authorName: "테스트 회원", content: text(input.content), createdAt: now(), attachments };
    state.chatMessages.push(message); return ok(message);
  }
  if (path === "portfolio" && ["POST", "DELETE"].includes(method ?? "")) {
    if (!leader) return fail("그룹장 권한이 필요합니다.", 403);
    info.hasPublishedPortfolio = method === "POST"; return changed("포트폴리오 공개 상태를 변경했습니다.");
  }
  if (route[0] === "activity-reports") return reportRequest(method, route, input, leader, match[2]);
  if (route[0] === "deleted-cards" && route[2] === "restore" && method === "POST") {
    const index = state.archivedCards.findIndex((c) => c.id === route[1]);
    const list = state.lists.find((l) => l.id === input.targetListId);
    if (index < 0 || !list) return fail("카드 또는 리스트를 찾을 수 없습니다.", 404);
    const archived = state.archivedCards.splice(index, 1)[0];
    const preserved = deletedCards.get(archived.id);
    const card = preserved ?? newCard(archived.title);
    const archivedAuthorUserId = state.members.find((m) => m.name === archived.authorName)?.userId ?? 1;
    Object.assign(card, { id: archived.id, authorName: archived.authorName, authorUserId: archivedAuthorUserId, createdAt: archived.createdAt,
      records: preserved?.records ?? Array.from({ length: archived.recordCount }, () => ({
        type: "tiptap" as const,
        id: nextMockRecordId(), authorName: archived.authorName, authorUserId: archivedAuthorUserId,
        content: JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "보관된 기록입니다." }] }] }), createdAt: now(), updatedAt: now(), deleted: false,
      })) });
    deletedCards.delete(card.id);
    list.cards.push(card); return changed("카드를 복원했습니다.");
  }
  if (info.status !== GroupStatus.PROGRESS && info.status !== GroupStatus.STOP) return fail("종료된 그룹에서는 변경할 수 없습니다.", 409);
  if (path === "lists" && method === "POST") {
    if (!text(input.title)) return fail("리스트 이름을 입력해주세요.");
    state.lists.push({ id: nextMockIntegerId(), title: text(input.title), description: "", cards: [] }); return changed("리스트를 추가했습니다.");
  }
  if (route[0] === "lists") {
    const index = state.lists.findIndex((l) => l.id === route[1]);
    if (index < 0) return fail("리스트를 찾을 수 없습니다.", 404);
    const list = state.lists[index];
    if (route[2] === "position" && method === "PATCH") {
      const before = input.insertBeforeListId ?? null;
      if (before === list.id) return ok();
      if (before !== null && !state.lists.some((l) => l.id === before)) return fail("이동 위치를 찾을 수 없습니다.");
      state.lists.splice(index, 1);
      const target = before === null ? state.lists.length : state.lists.findIndex((l) => l.id === before);
      state.lists.splice(target, 0, list); return changed("리스트를 이동했습니다.");
    }
    if (route[2] === "cards" && method === "POST" && route.length === 3) {
      if (!text(input.title)) return fail("카드 이름을 확인해주세요.");
      list.cards.push(newCard(text(input.title))); return changed("카드를 추가했습니다.");
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
  if (route[0] === "cards" && route[2] === "cover-image" && route[3] === "upload-link" && method === "POST") {
    const card = cards().find((c) => c.id === route[1]);
    if (!card) return fail("카드를 찾을 수 없습니다.", 404);
    if (!text(input.fileName) || !text(input.contentType)) return fail("파일 정보를 확인해주세요.");
    // activity-report와 같은 범용 uploads 맵/서빙 경로(/__mock-api/uploads/:id)를 그대로
    // 재사용한다 — 업로드 메커니즘 자체는 어떤 파일이든 동일하다.
    const fileUploadId = id();
    uploads.set(fileUploadId, { fileName: text(input.fileName), contentType: text(input.contentType), used: false, groupId: match[2], purpose: "cover", inline: true });
    return ok({ fileUploadId, url: `/__mock-api/uploads/${fileUploadId}` });
  }
  if (route[0] === "cards" && route.length === 3 && ["PUT", "PATCH", "POST", "DELETE"].includes(method ?? "") && route[2] !== "records") {
    const source = state.lists.find((l) => l.cards.some((c) => c.id === route[1]));
    const card = source?.cards.find((c) => c.id === route[1]);
    if (!source || !card) return fail("카드를 찾을 수 없습니다.", 404);
    if (route[2] === "portfolio" && method === "PUT") {
      if (typeof input.isInPortfolio !== "boolean") return fail("선택 값을 확인해주세요.");
      card.portfolio = input.isInPortfolio; return changed("포트폴리오 카드를 변경했습니다.");
    }
    if (route[2] === "labels" && method === "PUT") {
      if (!Array.isArray(input.labels)) return fail("라벨 값을 확인해주세요.");
      card.labels = input.labels as MockCard["labels"]; return changed("카드 라벨을 변경했습니다.");
    }
    if (route[2] === "assignee" && method === "PUT") {
      if (input.assigneeUserId !== null && typeof input.assigneeUserId !== "number") return fail("담당자 값을 확인해주세요.");
      const assignee = input.assigneeUserId === null ? null : state.members.find((m) => m.userId === input.assigneeUserId);
      if (input.assigneeUserId !== null && !assignee) return fail("그룹 멤버만 담당자로 지정할 수 있습니다.", 409);
      card.assigneeUserId = input.assigneeUserId as number | null;
      card.assigneeName = assignee?.name ?? null;
      return changed("카드 담당자를 변경했습니다.");
    }
    if (route[2] === "disabled" && method === "PUT") {
      if (typeof input.isDisabled !== "boolean") return fail("선택 값을 확인해주세요.");
      card.disabled = input.isDisabled; return changed("카드 활성 상태를 변경했습니다.");
    }
    if (route[2] === "cover-image" && (method === "POST" || method === "DELETE")) {
      if (method === "DELETE") {
        card.coverImageUrl = null; return changed("카드 커버 이미지를 삭제했습니다.");
      }
      // URL 직접 입력/붙여넣기는 coverImageUrl로, 파일 업로드/드래그앤드롭은 업로드 링크로
      // 먼저 받은 fileUploadId로 온다 — 둘 중 하나만 실려 있으면 된다.
      if (typeof input.coverImageUrl === "string" && text(input.coverImageUrl)) {
        card.coverImageUrl = text(input.coverImageUrl); return changed("카드 커버 이미지를 변경했습니다.");
      }
      if (typeof input.fileUploadId === "string") {
        const upload = uploads.get(input.fileUploadId);
        if (!upload) return fail("업로드한 파일을 찾을 수 없습니다.", 404);
        upload.used = true; upload.uploaded = true;
        card.coverImageUrl = `/__mock-api/groups/${match[2]}/files/${input.fileUploadId}`; return changed("카드 커버 이미지를 변경했습니다.");
      }
      return fail("이미지 정보를 확인해주세요.");
    }
    if (route[2] === "position" && method === "PATCH") {
      const target = state.lists.find((l) => l.id === input.listId);
      if (!target) return fail("대상 리스트를 찾을 수 없습니다.");
      const before = input.insertBeforeCardId ?? null;
      if (before === card.id && source === target) return ok();
      if (before !== null && !target.cards.some((c) => c.id === before && c.id !== card.id)) return fail("이동 위치를 찾을 수 없습니다.");
      source.cards.splice(source.cards.indexOf(card), 1);
      target.cards.splice(before === null ? target.cards.length : target.cards.findIndex((c) => c.id === before), 0, card);
      return changed("카드를 이동했습니다.");
    }
  }
  if (route[0] === "cards" && method === "PATCH" && route.length === 2) {
    const card = cards().find((c) => c.id === route[1]);
    if (!card) return fail("카드를 찾을 수 없습니다.", 404);
    if (input.recordSort !== undefined) {
      if (input.recordSort !== "NEWEST" && input.recordSort !== "OLDEST" && input.recordSort !== "RECENTLY_UPDATED") return fail("정렬 값을 확인해주세요.");
      card.recordSort = input.recordSort;
    }
    if (input.title !== undefined || input.description !== undefined) {
      if (card.disabled) return fail("비활성 카드는 수정할 수 없습니다.");
      if (input.title !== undefined) { if (!text(input.title)) return fail("카드 이름을 확인해주세요."); card.title = text(input.title); }
      if (typeof input.description === "string") card.description = input.description;
      return changed("카드를 수정했습니다.");
    }
    return ok();
  }
  if (route[0] === "cards" && method === "DELETE" && route.length === 2) {
    const source = state.lists.find((l) => l.cards.some((c) => c.id === route[1]));
    const card = source?.cards.find((c) => c.id === route[1]);
    if (!source || !card) return fail("카드를 찾을 수 없습니다.", 404);
    source.cards.splice(source.cards.indexOf(card), 1);
    deletedCards.set(card.id, card);
    state.archivedCards.unshift({ id: card.id, title: card.title, authorName: card.authorName, recordCount: card.records.length, createdAt: card.createdAt, deletedAt: now() });
    return changed("카드를 삭제했습니다.");
  }

  if (route[0] === "cards" && route[2] === "records" && route.length === 3 && method === "POST") {
    const card = cards().find((c) => c.id === route[1]);
    if (!card) return fail("카드를 찾을 수 없습니다.", 404);
    if (card.disabled) return fail("읽기 전용 카드에는 기록할 수 없습니다.", 403);
    if (typeof input.content !== "string" || !input.content.trim()) return fail("기록 내용을 입력해주세요.");
    const registered = registerRecordFiles(input.files, match[2]);
    if (!registered) return fail("첨부 파일 정보를 확인해주세요.");
    const timestamp = now();
    const record: MockCard["records"][number] = { type: "tiptap" as const, id: nextMockRecordId(), authorName: "테스트 회원", authorUserId: 1, content: input.content, createdAt: timestamp, updatedAt: timestamp, deleted: false };
    card.records.push(record);
    changed("기록을 작성했습니다.");
    record.files = registered.files;
    return { status: 201, body: { ...recordView(record), uploads: registered.uploads } };
  }
  if (path === "records/files/uploaded" && method === "POST") {
    const fileIds = Array.isArray(input.fileIds) ? [...new Set(input.fileIds)] : [];
    if (!fileIds.length || fileIds.some((fileId) => typeof fileId !== "string")) return fail("파일 아이디를 확인해주세요.");
    const results = fileIds.map((fileId) => {
      const upload = uploads.get(fileId as string);
      if (!upload || upload.groupId !== match[2] || upload.purpose !== "record") return { fileId, isSuccess: false, reason: "NOT_FOUND" };
      if (!upload.data) return { fileId, isSuccess: false, reason: "NOT_UPLOADED" };
      upload.uploaded = true;
      return { fileId, isSuccess: true, reason: null };
    });
    const successCount = results.filter((result) => result.isSuccess).length;
    return { status: successCount === results.length ? 200 : successCount ? 206 : 400, body: { results } };
  }
  if (route[0] === "records" && route.length >= 2) {
    const card = [...cards(), ...deletedCards.values()].find((c) => c.records.some((r) => r.id === route[1]));
    const record = card?.records.find((r) => r.id === route[1]);
    if (!card || !record) return fail("기록을 찾을 수 없습니다.", 404);
    if (method === "PUT" && route.length === 3 && route[2] === "archive") {
      if (typeof input.isInUserArchive !== "boolean") return fail("보관 여부를 확인해주세요.");
      if (!input.isInUserArchive) {
        state.savedRecords = state.savedRecords.filter((saved) => saved.id !== record.id);
        return ok();
      }
      if (record.deleted || deletedCards.has(card.id)) return fail("삭제된 기록이나 삭제된 카드의 기록은 보관할 수 없습니다.");
      if (!state.savedRecords.some((saved) => saved.id === record.id)) {
        state.savedRecords.unshift({ groupId: match[2], groupName: match[2] === MOCK_OTHER_GROUP_ID ? "다른 그룹 목업" : info.title, isDeleted: false, isCardDeleted: false, type: record.type, id: record.id, content: record.content,
          cardId: card.id, cardTitle: card.title, authorName: record.authorName, createdAt: record.createdAt, savedAt: now() });
      }
      return ok();
    }
    if (deletedCards.has(card.id)) return fail("삭제된 카드의 기록은 변경할 수 없습니다.");
    if (method === "PUT" && route.length === 3 && route[2] === "portfolio") {
      if (typeof input.isInPortfolio !== "boolean") return fail("선택 값을 확인해주세요.");
      if (card.disabled || record.deleted) return fail("이 기록은 바꿀 수 없습니다.");
      record.isInPortfolio = input.isInPortfolio; return changed("기록 포트폴리오 포함 여부를 변경했습니다.", false);
    }
    if (method === "PUT" && route.length === 3 && route[2] === "position") {
      if (card.disabled || record.deleted) return fail("이 기록을 이동할 수 없습니다.", 403);
      const target = cards().find((item) => item.id === input.targetCardId);
      if (!target) return fail("대상 카드를 찾을 수 없습니다.", 404);
      if (target.disabled) return fail("비활성 카드로 이동할 수 없습니다.", 403);
      if (target.id === card.id) return ok();
      card.records.splice(card.records.indexOf(record), 1);
      target.records.push(record);
      for (const saved of state.savedRecords.filter((item) => item.id === record.id)) {
        saved.cardId = target.id;
        saved.cardTitle = target.title;
      }
      return changed("기록을 이동했습니다.");
    }
    if (method === "PATCH" && route.length === 2) {
      if (record.type === "legacy") return fail("레거시 기록은 아직 수정할 수 없습니다.", 403);
      if (card.disabled || record.deleted) return fail("이 기록을 수정할 수 없습니다.", 403);
      if (typeof input.content !== "string" || !input.content.trim()) return fail("기록 내용을 입력해주세요.");
      const registered = registerRecordFiles(input.files, match[2]);
      if (!registered) return fail("첨부 파일 정보를 확인해주세요.");
      record.content = input.content;
      record.files = registered.files;
      record.updatedAt = now();
      changed("기록을 수정했습니다.");
      return ok({ uploads: registered.uploads });
    }
    if (method === "DELETE" && route.length === 2) {
      record.deleted = true; record.updatedAt = now(); return changed("기록을 삭제했습니다.");
    }
    if (method === "POST" && route.length === 3 && route[2] === "restore") {
      record.deleted = false; record.updatedAt = now(); return changed("기록을 복구했습니다.");
    }
  }
  return fail("지원하지 않는 그룹 요청입니다.", 404);
}

function reportRequest(method: string | undefined, route: string[], input: Input, leader: boolean, groupId: string): Result {
  if (!leader) return fail("그룹장 권한이 필요합니다.", 403);
  const cohort = openCohort;
  if (!cohort) return fail("현재 활동보고서 접수 기간이 아닙니다.", 409);
  if (route[1] === "upload-link" && method === "POST") {
    if (!text(input.fileName) || !text(input.contentType)) return fail("파일 정보를 확인해주세요.");
    const fileUploadId = id(); uploads.set(fileUploadId, { fileName: text(input.fileName), contentType: text(input.contentType), used: false, groupId, purpose: "report" });
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
    if (typeof input.isPresentation !== "boolean") return fail("발표 여부를 확인해주세요.");
    if (state.activityReports.some((r) => r.seminarId === cohort.id)) return fail("이미 제출한 활동보고서가 있습니다.", 409);
    state.activityReports.unshift({ id: id(), seminarId: cohort.id, seminarDate: cohort.scheduledAt,
      seminarIsSummerSeason: cohort.isSummerSeason, seminarIsSpeakAfter: cohort.isSpeakAfter,
      isPresentation: input.isPresentation, reportFileUrl: `/__mock-api/uploads/${input.fileUploadId}`, createdAt: now() });
  } else if (report) {
    if (typeof input.isPresentation === "boolean") report.isPresentation = input.isPresentation;
    if (upload) report.reportFileUrl = `/__mock-api/uploads/${input.fileUploadId}`;
  }
  if (upload) upload.used = true;
  return changed("활동보고서를 저장했습니다.");
}
