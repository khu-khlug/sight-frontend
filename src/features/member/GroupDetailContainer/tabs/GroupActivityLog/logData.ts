import { isIntegerId } from "../../../../../util/integerId";
import { LABEL_COLORS } from "../../label";

type FieldRule = "string" | "strings" | "memberId" | "id" | "integer" | "category" | "label";

const SCHEMAS: Record<string, Record<string, FieldRule>> = {
  LEGACY: { html: "string" },
  GROUP_CREATED: { groupTitle: "string" },
  GROUP_INFO_UPDATED: { changedFields: "strings" },
  GROUP_JOIN_ENABLED: {},
  GROUP_JOIN_DISABLED: {},
  GROUP_CATEGORY_UPDATED: { category: "category" },
  GROUP_DEPARTMENTS_SET: { departmentNames: "strings" },
  GROUP_DEPARTMENTS_CLEARED: {},
  GROUP_PROGRESS: {},
  GROUP_ENDED_SUCCESS: {},
  GROUP_ENDED_FAIL: {},
  GROUP_STOPPED: {},
  GROUP_PORTFOLIO_UNPUBLISHED: {},
  GROUP_PORTFOLIO_PUBLISHED: {},
  GROUP_MEMBER_JOINED: {},
  GROUP_MEMBER_LEFT: {},
  GROUP_MEMBER_KICKED: { targetUserId: "memberId", targetUserName: "string", targetUserCollege: "string" },
  GROUP_LEADER_DELEGATED: { fromUserId: "memberId", fromUserName: "string", fromUserCollege: "string", toUserId: "memberId", toUserName: "string", toUserCollege: "string" },
  LIST_CREATED: { listId: "id", listTitle: "string" },
  LIST_TITLE_UPDATED: { listId: "id", oldTitle: "string", newTitle: "string" },
  LIST_DESCRIPTION_UPDATED: { listId: "id", listTitle: "string", description: "string" },
  LIST_DELETED: { listId: "id", listTitle: "string" },
  CARD_CREATED: { cardId: "id", cardTitle: "string" },
  CARD_TITLE_UPDATED: { cardId: "id", oldTitle: "string", newTitle: "string" },
  CARD_DESCRIPTION_ADDED: { cardId: "id", cardTitle: "string", description: "string" },
  CARD_DESCRIPTION_UPDATED: { cardId: "id", cardTitle: "string", description: "string" },
  CARD_MOVED: { cardId: "id", cardTitle: "string", fromListId: "id", fromListTitle: "string", toListId: "id", toListTitle: "string" },
  CARD_DELETED: { cardId: "id", cardTitle: "string" },
  CARD_DISABLED: { cardId: "id", cardTitle: "string" },
  CARD_ENABLED: { cardId: "id", cardTitle: "string" },
  CARD_RESTORED: { cardId: "id", cardTitle: "string", listId: "id", listTitle: "string" },
  CARD_ASSIGNEE_CLEARED: { cardId: "id", cardTitle: "string" },
  CARD_ASSIGNEE_SET: { cardId: "id", cardTitle: "string", assigneeUserId: "memberId", assigneeUserName: "string", assigneeUserCollege: "string" },
  CARD_INHERITANCE_CLEARED: { cardId: "id", cardTitle: "string" },
  CARD_INHERITANCE_SET: { cardId: "id", cardTitle: "string", sourceGroupId: "id", sourceGroupTitle: "string", sourceCardId: "id", sourceCardTitle: "string" },
  CARD_LABEL_REMOVED: { cardId: "id", cardTitle: "string", label: "label" },
  CARD_LABEL_ADDED: { cardId: "id", cardTitle: "string", label: "label" },
  CARD_PORTFOLIO_REMOVED: { cardId: "id", cardTitle: "string" },
  CARD_PORTFOLIO_ADDED: { cardId: "id", cardTitle: "string" },
  CARD_COVER_ADDED: { cardId: "id", cardTitle: "string" },
  CARD_COVER_REMOVED: { cardId: "id", cardTitle: "string" },
  RECORD_UPDATED: { recordId: "id", cardId: "id", cardTitle: "string", contentText: "string" },
  RECORD_CREATED: { recordId: "id", cardId: "id", cardTitle: "string", contentText: "string" },
  RECORD_DELETED: { recordId: "id", cardId: "id", cardTitle: "string" },
  RECORD_RESTORED: { recordId: "id", cardId: "id", cardTitle: "string" },
  RECORD_PORTFOLIO_REMOVED: { recordId: "id", cardId: "id", cardTitle: "string" },
  RECORD_PORTFOLIO_ADDED: { recordId: "id", cardId: "id", cardTitle: "string" },
  RECORD_MOVED: { recordId: "id", fromCardId: "id", fromCardTitle: "string", toCardId: "id", toCardTitle: "string" },
  SEMINAR_PRESENTATION_CANCELLED: { termYear: "integer", termSemester: "string" },
  SEMINAR_PRESENTATION_REGISTERED: { termYear: "integer", termSemester: "string" },
  SEMINAR_SESSION_REMOVED: { termYear: "integer", termSemester: "string" },
};

export function isValidLogData(logType: string, value: unknown): value is Record<string, unknown> {
  if (!Object.prototype.hasOwnProperty.call(SCHEMAS, logType)) return false;
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const data = value as Record<string, unknown>;
  return Object.entries(SCHEMAS[logType]).every(([field, rule]) => {
    if (!Object.prototype.hasOwnProperty.call(data, field)) return false;
    const item = data[field];
    switch (rule) {
      case "string": return typeof item === "string";
      case "strings": return Array.isArray(item) && item.every((entry) => typeof entry === "string");
      case "memberId": return typeof item === "number" && Number.isSafeInteger(item) && item > 0;
      case "id": return isIntegerId(item);
      case "integer": return typeof item === "number" && Number.isSafeInteger(item);
      case "category": return typeof item === "string" && ["STUDY", "PROJECT", "DOCUMENTATION", "MANAGE", "EDUCATION", "PROGRAM"].includes(item);
      case "label": return typeof item === "string" && LABEL_COLORS.some((color) => color === item);
    }
  });
}
