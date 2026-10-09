import { Archive, BotMessageSquare, GitBranch, History, Info, MessageCircle, Presentation, Search, Settings, Users } from "lucide-react";

import { TabItem } from "./TabBar";

export const GROUP_DETAIL_TAB_IDS = [
  "info",
  "member",
  "discord",
  "repository",
  "exposure",
  "search",
  "log",
  "archive",
  "aiChat",
  "settings",
] as const;
export type GroupDetailTabId = (typeof GROUP_DETAIL_TAB_IDS)[number];

export const GROUP_DETAIL_TAB_LABEL: Record<GroupDetailTabId, string> = {
  info: "정보",
  member: "멤버",
  discord: "채팅방",
  repository: "저장소",
  exposure: "활동공개",
  search: "카드검색",
  log: "활동로그",
  archive: "그룹아카이브",
  aiChat: "AI 채팅",
  settings: "설정",
};

export const GROUP_DETAIL_TAB_ICON: Record<GroupDetailTabId, TabItem["icon"]> = {
  info: Info,
  member: Users,
  discord: MessageCircle,
  repository: GitBranch,
  exposure: Presentation,
  search: Search,
  log: History,
  archive: Archive,
  aiChat: BotMessageSquare,
  settings: Settings,
};

export const GROUP_DETAIL_TABS: TabItem[] = GROUP_DETAIL_TAB_IDS
  .map((id) => ({
    id,
    label: GROUP_DETAIL_TAB_LABEL[id],
    icon: GROUP_DETAIL_TAB_ICON[id],
    placement: id === "settings" ? "bottom" : "top",
    revealOnHover: id === "aiChat",
  }));
