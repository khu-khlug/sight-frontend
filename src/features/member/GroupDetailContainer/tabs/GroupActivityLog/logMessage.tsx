import DOMPurify from "dompurify";
import type { MouseEvent, ReactNode } from "react";

import type { ActivityLogEntryDto } from "../../../../../api/public/group/GroupActivityLogApi";
import { LABEL_COLOR_NAME } from "../../label";

type Data = Record<string, unknown>;
type Render = (data: Data, link: CardLink) => ReactNode[] | null;
type CardLink = (cardId: unknown, title: unknown) => ReactNode;

const str = (value: unknown): string | null => typeof value === "string" ? value : null;
// 이름·제목은 로그에 저장된 당시 값이다. 일반 텍스트로만 쓴다.
const text = (value: unknown): string | null => str(value) ?? (typeof value === "number" ? String(value) : null);
const user = (data: Data, prefix: string) => {
  const name = text(data[`${prefix}Name`]);
  const college = text(data[`${prefix}College`]);
  return name ? (college ? `${name}(${college})` : name) : null;
};
const term = (data: Data) => {
  const year = text(data.termYear);
  const semester = text(data.termSemester);
  return year && semester ? `${year}년 ${semester}` : null;
};
const label = (value: unknown) => {
  const key = str(value);
  return key ? (LABEL_COLOR_NAME as Record<string, string>)[key] ?? key : null;
};
// 필요한 필드가 하나라도 없으면 null을 돌려 "표시할 수 없는 로그"로 처리한다.
const all = (...parts: (ReactNode | null)[]): ReactNode[] | null => parts.some((part) => part === null) ? null : parts as ReactNode[];

const RENDERERS: Record<string, Render> = {
  GROUP_CREATED: (d) => all(`그룹 "`, text(d.groupTitle), `"을 만들었습니다.`),
  GROUP_INFO_UPDATED: (d) => Array.isArray(d.changedFields) ? [`그룹 정보(${(d.changedFields as unknown[]).map(String).join(", ")})를 변경했습니다.`] : null,
  GROUP_JOIN_ENABLED: () => ["참여 신청을 허용했습니다."],
  GROUP_JOIN_DISABLED: () => ["참여 신청을 막았습니다."],
  GROUP_CATEGORY_UPDATED: (d) => all(`그룹 분류를 `, text(d.category), `(으)로 바꿨습니다.`),
  GROUP_DEPARTMENTS_SET: (d) => Array.isArray(d.departmentNames) ? [`특수 조직을 ${(d.departmentNames as unknown[]).map(String).join(", ")}(으)로 설정했습니다.`] : null,
  GROUP_DEPARTMENTS_CLEARED: () => ["특수 조직 설정을 해제했습니다."],
  GROUP_PROGRESS: () => ["그룹을 진행 상태로 바꿨습니다."],
  GROUP_ENDED_SUCCESS: () => ["그룹 활동을 성공으로 종료했습니다."],
  GROUP_ENDED_FAIL: () => ["그룹 활동을 실패로 종료했습니다."],
  GROUP_STOPPED: () => ["그룹 활동을 중단했습니다."],
  GROUP_PORTFOLIO_UNPUBLISHED: () => ["포트폴리오 발행을 취소했습니다."],
  GROUP_PORTFOLIO_PUBLISHED: () => ["포트폴리오를 발행했습니다."],
  GROUP_MEMBER_JOINED: () => ["그룹에 참여했습니다."],
  GROUP_MEMBER_LEFT: () => ["그룹에서 나갔습니다."],
  GROUP_MEMBER_KICKED: (d) => all(user(d, "targetUser"), "님을 내보냈습니다."),
  GROUP_LEADER_DELEGATED: (d) => all("그룹장을 ", user(d, "fromUser"), "님에서 ", user(d, "toUser"), "님으로 위임했습니다."),
  LIST_CREATED: (d) => all(`리스트 "`, text(d.listTitle), `"를 만들었습니다.`),
  LIST_TITLE_UPDATED: (d) => all(`리스트 이름을 "`, text(d.oldTitle), `"에서 "`, text(d.newTitle), `"(으)로 바꿨습니다.`),
  LIST_DESCRIPTION_UPDATED: (d) => all(`리스트 "`, text(d.listTitle), `"의 설명을 "`, text(d.description), `"(으)로 바꿨습니다.`),
  LIST_DELETED: (d) => all(`리스트 "`, text(d.listTitle), `"를 삭제했습니다.`),
  CARD_CREATED: (d, link) => all(link(d.cardId, d.cardTitle), " 카드를 만들었습니다."),
  CARD_TITLE_UPDATED: (d, link) => all(link(d.cardId, d.newTitle), ` 카드의 이름을 "`, text(d.oldTitle), `"에서 바꿨습니다.`),
  CARD_DESCRIPTION_ADDED: (d, link) => all(link(d.cardId, d.cardTitle), ` 카드에 설명 "`, text(d.description), `"을 추가했습니다.`),
  CARD_DESCRIPTION_UPDATED: (d, link) => all(link(d.cardId, d.cardTitle), ` 카드의 설명을 "`, text(d.description), `"(으)로 바꿨습니다.`),
  CARD_MOVED: (d, link) => all(link(d.cardId, d.cardTitle), ` 카드를 "`, text(d.fromListTitle), `"에서 "`, text(d.toListTitle), `"(으)로 옮겼습니다.`),
  CARD_DELETED: (d) => all(`카드 "`, text(d.cardTitle), `"를 삭제했습니다.`),
  CARD_DISABLED: (d, link) => all(link(d.cardId, d.cardTitle), " 카드를 비활성화했습니다."),
  CARD_ENABLED: (d, link) => all(link(d.cardId, d.cardTitle), " 카드를 다시 활성화했습니다."),
  CARD_RESTORED: (d, link) => all(link(d.cardId, d.cardTitle), ` 카드를 "`, text(d.listTitle), `"에 복구했습니다.`),
  CARD_ASSIGNEE_CLEARED: (d, link) => all(link(d.cardId, d.cardTitle), " 카드의 담당자를 해제했습니다."),
  CARD_ASSIGNEE_SET: (d, link) => all(link(d.cardId, d.cardTitle), " 카드의 담당자를 ", user(d, "assigneeUser"), "님으로 지정했습니다."),
  CARD_INHERITANCE_CLEARED: (d, link) => all(link(d.cardId, d.cardTitle), " 카드의 이어받기를 해제했습니다."),
  CARD_INHERITANCE_SET: (d, link) => all(link(d.cardId, d.cardTitle), ` 카드가 "`, text(d.sourceGroupTitle), `" 그룹의 "`, text(d.sourceCardTitle), `" 카드를 이어받았습니다.`),
  CARD_LABEL_REMOVED: (d, link) => all(link(d.cardId, d.cardTitle), " 카드에서 ", label(d.label), " 레이블을 뺐습니다."),
  CARD_LABEL_ADDED: (d, link) => all(link(d.cardId, d.cardTitle), " 카드에 ", label(d.label), " 레이블을 붙였습니다."),
  CARD_PORTFOLIO_REMOVED: (d, link) => all(link(d.cardId, d.cardTitle), " 카드를 포트폴리오에서 뺐습니다."),
  CARD_PORTFOLIO_ADDED: (d, link) => all(link(d.cardId, d.cardTitle), " 카드를 포트폴리오에 넣었습니다."),
  CARD_COVER_ADDED: (d, link) => all(link(d.cardId, d.cardTitle), " 카드의 커버 이미지를 바꿨습니다."),
  CARD_COVER_REMOVED: (d, link) => all(link(d.cardId, d.cardTitle), " 카드의 커버 이미지를 제거했습니다."),
  RECORD_UPDATED: (d, link) => all(link(d.cardId, d.cardTitle), ` 카드의 기록을 수정했습니다: "`, text(d.contentText), `"`),
  RECORD_CREATED: (d, link) => all(link(d.cardId, d.cardTitle), ` 카드에 기록을 남겼습니다: "`, text(d.contentText), `"`),
  RECORD_DELETED: (d, link) => all(link(d.cardId, d.cardTitle), " 카드의 기록을 삭제했습니다."),
  RECORD_RESTORED: (d, link) => all(link(d.cardId, d.cardTitle), " 카드의 기록을 복구했습니다."),
  RECORD_PORTFOLIO_REMOVED: (d, link) => all(link(d.cardId, d.cardTitle), " 카드의 기록을 포트폴리오에서 뺐습니다."),
  RECORD_PORTFOLIO_ADDED: (d, link) => all(link(d.cardId, d.cardTitle), " 카드의 기록을 포트폴리오에 넣었습니다."),
  RECORD_MOVED: (d, link) => all("기록을 ", link(d.fromCardId, d.fromCardTitle), " 카드에서 ", link(d.toCardId, d.toCardTitle), " 카드로 옮겼습니다."),
  SEMINAR_PRESENTATION_CANCELLED: (d) => all(term(d), " 세미나 발표 신청을 취소했습니다."),
  SEMINAR_PRESENTATION_REGISTERED: (d) => all(term(d), " 세미나 발표를 신청했습니다."),
  SEMINAR_SESSION_REMOVED: (d) => all(term(d), " 세미나 세션이 운영진에 의해 제거됐습니다."),
};

// 같은 그룹 카드 주소. 링크 복사·새 탭 열기에도 쓸 수 있게 기존 프래그먼트 형식을 쓴다.
const cardHref = (cardId: string) => `#card=${encodeURIComponent(cardId)}`;
const isPlainClick = (event: MouseEvent) => event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;

// LEGACY HTML 안의 카드 링크("#카드ID" 또는 "#card=카드ID")를 카드 열기로 바꾼다. 일반 앵커와 빈 #는 그대로 둔다.
export function legacyCardIdFromHref(href: string | null): string | null {
  if (!href?.startsWith("#") || href.length < 2) return null;
  const fragment = href.slice(1);
  if (fragment.startsWith("card=")) return decodeURIComponent(fragment.slice("card=".length)) || null;
  return /^\d+$/.test(fragment) ? fragment : null;
}

export function sanitizeLegacyLogHtml(html: string): string {
  return DOMPurify.sanitize(html, { FORBID_ATTR: ["onclick", "style"] });
}

export function renderLogMessage(log: ActivityLogEntryDto, onOpenCard: (cardId: string) => void): ReactNode {
  const renderer = RENDERERS[log.logType];
  if (!renderer) return null;
  const link: CardLink = (cardId, title) => {
    const id = text(cardId);
    const name = text(title);
    if (!id || !name) return null;
    return (
      <a
        key={`${id}-${name}`}
        href={cardHref(id)}
        onClick={(event) => {
          if (!isPlainClick(event)) return;
          event.preventDefault();
          onOpenCard(id);
        }}
      >
        {name}
      </a>
    );
  };
  return renderer(log.logData ?? {}, link);
}
