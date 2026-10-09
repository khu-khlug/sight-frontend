import { Badge, Box, Heading, ScrollArea, Text } from "@chakra-ui/react";
import { Users } from "lucide-react";
import { useId, useLayoutEffect, useRef, useState } from "react";

import GroupCategoryBadge from "../../../../components/GroupCategoryBadge";
import GroupStatusBadge from "../../../../components/GroupStatusBadge";
import GroupSpecialOrganizationBadge from "../../../../components/GroupSpecialOrganizationBadge";
import HoverScrollbar from "../../../../components/HoverScrollbar";
import { useCurrentUser } from "../../../../hooks/user/useCurrentUser";
import AiChat from "../tabs/AiChat";
import GroupActivityLog from "../tabs/GroupActivityLog";
import GroupArchive from "../tabs/GroupArchive";
import GroupChat from "../tabs/GroupChat";
import GroupExposure from "../tabs/GroupExposure";
import GroupInfo from "../tabs/GroupInfo";
import { GroupInfo as GroupInfoData } from "../tabs/GroupInfo/types";
import GroupMemberList from "../tabs/GroupMemberList";
import GroupRepository from "../tabs/GroupRepository";
import type { RepositoryScrollMetrics } from "../tabs/GroupRepository";
import RepositoryHorizontalScrollbar from "../tabs/GroupRepository/RepositoryHorizontalScrollbar";
import GroupSearch from "../tabs/GroupSearch";
import GroupSettings from "../tabs/GroupSettings";
import TabBar from "../TabBar";
import { GroupDetailTabId, GROUP_DETAIL_TAB_LABEL, GROUP_DETAIL_TABS } from "../groupDetailTabs";
import { CardListData } from "../KanbanBoard";
import { LabelFilterKey } from "../label";
import type { FileWindowContent } from "../FileWindow/types";
import { cn } from "../../../../util/cn";
import styles from "./style.module.css";

type Props = {
  title: string;
  groupInfo: GroupInfoData;
  lists: CardListData[];
  activeId: GroupDetailTabId | null;
  onTabChange: (id: string) => void;
  enabledFilters: Set<LabelFilterKey>;
  onToggleFilter: (key: LabelFilterKey) => void;
  onOpenFile: (content: FileWindowContent) => void;
  // GroupSettings(개인설정 탭)에 그대로 전달한다 — 실제 싱글/듀얼 강제는 WindowLayer가 하고,
  // 여기서는 그 설정의 공통 조상으로서 체크박스 상태만 전달한다.
  dualWindowEnabled: boolean;
  onDualWindowEnabledChange: (value: boolean | null) => void;
};

/*
 * 그룹 상세의 대시보드. KanbanBoard 위에 오버레이로 뜬다(GroupDetailContainer/style.module.css의
 * .dashboardOverlay). 카드리스트 전용이 아니라 각 탭(정보/멤버/디스코드/...)의 내용을 갈아 끼우는
 * 일반 섹션이다.
 * 분류·상태·내 그룹 여부·그룹장 여부 뱃지는 특정 탭 내용이 아니라 그룹 자체를 나타내는
 * 정보라서, 탭을 바꿔도 사라지지 않도록 제목과 함께 .tabContent 밖에 둔다.
 * activeId는 GroupDetailContainer가 갖고 있다 — KanbanBoard의 --dashboard-width 계산도 같은
 * 값을 동시에 써야 폭 변화가 어긋나지 않는다.
 */
export default function Dashboard({
  title,
  groupInfo,
  lists,
  activeId,
  onTabChange,
  enabledFilters,
  onToggleFilter,
  onOpenFile,
  dualWindowEnabled,
  onDualWindowEnabledChange,
}: Props) {
  const isExpanded = activeId !== null;
  const contentRef = useRef<HTMLDivElement>(null);
  const [isContentReady, setIsContentReady] = useState(isExpanded);
  const showContent = isExpanded && isContentReady;

  useLayoutEffect(() => {
    if (!isExpanded) {
      setIsContentReady(false);
      return;
    }

    // 폭 전환이 없는 경우(첫 렌더링 등)에는 transitionend를 기다리지 않는다.
    const frame = requestAnimationFrame(() => {
      const content = contentRef.current;
      if (!content) return;
      const isResizing = content.getAnimations().some(
        (animation) => animation instanceof CSSTransition
          && animation.transitionProperty === "width"
          && animation.playState === "running",
      );
      if (!isResizing) setIsContentReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [isExpanded]);

  const currentUserQuery = useCurrentUser();
  const isLeader = currentUserQuery.data?.id === groupInfo.leaderUserId;
  const specialOrganizations = [...new Set(groupInfo.specialOrganizations)];
  const portfolioCounts = { listCount: groupInfo.portfolioListCount, cardCount: groupInfo.portfolioCardCount };
  const repoViewportRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLTextAreaElement>(null);
  const repoViewportId = useId();
  const [isEditingGroupInfo, setIsEditingGroupInfo] = useState(false);
  const [draftGroupTitle, setDraftGroupTitle] = useState(groupInfo.title);
  const [repoScrollMetrics, setRepoScrollMetrics] = useState<RepositoryScrollMetrics>({
    viewportWidth: 0,
    scrollWidth: 0,
    scrollLeft: 0,
  });

  useLayoutEffect(() => {
    const input = titleInputRef.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${input.scrollHeight}px`;
  }, [draftGroupTitle, isEditingGroupInfo, showContent]);

  // GroupSettings의 개인설정/그룹 정보 변경 패널이 저장 안 한 변경이 있는 동안 각자 자신의
  // 확인 함수를 여기 걸어둔다(onUnsavedPersonalSettingsGuardChange/onUnsavedGroupInfoGuardChange)
  // — 탭을 누르는 모든 경로가 결국 이 handleTabChange 하나를 거치므로, 여기서 한 번만 확인하면
  // 어떤 탭 아이콘을 눌러도 같이 걸린다. 포인터가 걸려 있는데 확인 함수가 false(취소)를
  // 돌려주면 탭을 바꾸지 않고 그대로 반환한다. 두 패널은 메뉴/에디터 화면이 서로 번갈아 보이는
  // 사이라 실질적으로 동시에 dirty일 일은 없지만, 각자 포인터를 따로 둬서 서로 간섭하지 않는다.
  const pendingPersonalSettingsLeaveConfirmRef = useRef<(() => boolean) | null>(null);
  const pendingGroupInfoLeaveConfirmRef = useRef<(() => boolean) | null>(null);

  const handleTabChange = (id: string) => {
    if (pendingPersonalSettingsLeaveConfirmRef.current && !pendingPersonalSettingsLeaveConfirmRef.current()) return;
    if (pendingGroupInfoLeaveConfirmRef.current && !pendingGroupInfoLeaveConfirmRef.current()) return;
    setIsEditingGroupInfo(false);
    onTabChange(id);
  };

  const handleStartGroupInfoEdit = () => {
    setDraftGroupTitle(groupInfo.title);
    setIsEditingGroupInfo(true);
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.tabBar}>
        <TabBar tabs={GROUP_DETAIL_TABS} activeId={activeId} onChange={handleTabChange} />
      </div>
      <div className={cn(styles.divider, activeId === null && styles.collapsed)} />
      <div
        ref={contentRef}
        className={cn(styles.content, !isExpanded && styles.collapsed)}
        onTransitionEnd={(event) => {
          if (event.target === event.currentTarget && event.propertyName === "width" && isExpanded) {
            setIsContentReady(true);
          }
        }}
      >
        {showContent && (
          <>
            <Box className={styles.header} display="flex" flexWrap="wrap" gap="6px" px="15px" mb={2}>
              <button
                type="button"
                className={styles.badgeButton}
                aria-label="그룹 설정으로 이동"
                onClick={() => {
                  if (activeId !== "settings") handleTabChange("settings");
                }}
              >
                {specialOrganizations.map((organization) => (
                  <GroupSpecialOrganizationBadge key={organization} organization={organization} />
                ))}
                <GroupCategoryBadge category={groupInfo.category} />
                <GroupStatusBadge status={groupInfo.status} />
                {/* 그룹장은 항상 멤버이기도 하므로, 그룹장이면 "내 그룹" 대신 "그룹장"만 보여준다 */}
                {isLeader ? (
                  <Badge colorPalette="red" size="sm"><Users size="16px" /> 그룹장</Badge>
                ) : (
                  groupInfo.isMember && <Badge colorPalette="yellow" size="sm"><Users size="16px" /> 내 그룹</Badge>
                )}
              </button>
            </Box>
            <Heading className={styles.header} size="xl" px="15px" mb={4}>
              {isEditingGroupInfo && activeId === "settings" ? (
                <textarea
                  ref={titleInputRef}
                  className={styles.headingInput}
                  aria-label="그룹명"
                  value={draftGroupTitle}
                  rows={1}
                  autoFocus
                  onChange={(event) => setDraftGroupTitle(event.target.value.replace(/[\r\n]+/g, " "))}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.preventDefault();
                  }}
                />
              ) : title}
            </Heading>
            {activeId !== null && (
              <div key={activeId} className={cn(styles.tabArea, styles.tabContent)}>
                {activeId === "discord" ? (
                  // 채팅 탭은 자기만의 스크롤 영역(메시지)과 고정 입력창이 필요해서, 공용
                  // ScrollArea가 아니라 .tabArea가 준 높이를 그대로 GroupChat에 넘긴다.
                  <GroupChat
                    isMember={groupInfo.isMember}
                    groupId={groupInfo.id}
                    onTabChange={handleTabChange}
                  />
                ) : activeId === "search" ? (
                  // 검색 탭도 마찬가지 — 라벨 필터/검색대상/검색창은 고정, 검색결과만 스크롤돼야
                  // 해서 공용 ScrollArea 대신 .tabArea 높이를 그대로 넘긴다.
                  <GroupSearch
                    groupId={groupInfo.id}
                    enabledFilters={enabledFilters}
                    onToggleFilter={onToggleFilter}
                  />
                ) : activeId === "archive" ? (
                  // 아카이브 전환 버튼은 고정하고, 두 목록만 각자 스크롤한다.
                  <GroupArchive groupId={groupInfo.id} lists={lists} />
                ) : activeId === "exposure" ? (
                  // 활동공개 탭도 마찬가지 — 포트폴리오/활동보고 폼은 고정, 이전 활동보고
                  // 내역만 스크롤돼야 해서 공용 ScrollArea 대신 .tabArea 높이를 그대로 넘긴다.
                  <GroupExposure
                    info={groupInfo}
                    portfolioCounts={portfolioCounts}
                    onOpenFile={onOpenFile}
                  />
                ) : activeId === "repository" ? (
                  <GroupRepository
                    repositoryUrls={groupInfo.repositoryUrls}
                    viewportRef={repoViewportRef}
                    viewportId={repoViewportId}
                    onScrollMetricsChange={setRepoScrollMetrics}
                    onOpenFile={onOpenFile}
                  />
                ) : activeId === "settings" ? (
                  <GroupSettings
                    info={groupInfo}
                    isManager={currentUserQuery.data?.manager ?? false}
                    isLeader={isLeader}
                    isEditing={isEditingGroupInfo}
                    titleDraft={draftGroupTitle}
                    onStartEdit={handleStartGroupInfoEdit}
                    onCloseEdit={() => setIsEditingGroupInfo(false)}
                    onSave={() => undefined}
                    dualWindowEnabled={dualWindowEnabled}
                    onDualWindowEnabledChange={onDualWindowEnabledChange}
                    onUnsavedPersonalSettingsGuardChange={(confirmLeave) => { pendingPersonalSettingsLeaveConfirmRef.current = confirmLeave; }}
                    onUnsavedGroupInfoGuardChange={(confirmLeave) => { pendingGroupInfoLeaveConfirmRef.current = confirmLeave; }}
                  />
                ) : (
                  <ScrollArea.Root h="100%" size="sm" variant="hover">
                    {/*
                      style={{ overflowX: "hidden" }}를 Chakra의 overflowX prop 대신 raw style
                      prop으로 준다 — Chakra의 style prop(overflowX 등)은 emotion class로
                      컴파일되는데, zag가 Viewport에 박아 넣는 style={{overflow:"auto"}}는 진짜
                      inline style이라 class보다 항상 이긴다. raw style prop끼리는 zag props와
                      mergeProps로 같은 inline style 객체에 합쳐지므로, 이 안에서는 나중에 쓴
                      overflowX가 overflow(shorthand)의 x축을 정확히 덮어쓴다.
                    */}
                    <ScrollArea.Viewport h="100%" style={{ overflowX: "hidden" }}>
                      {/* 저장소 탭은 내부에 가로 스크롤 영역이 있다. Ark UI의 인라인
                          minWidth: fit-content를 그대로 두면 파일 경로가 바깥 Content까지
                          넓히므로, 이 탭에서만 실제 뷰포트 폭으로 고정한다. */}
                      <ScrollArea.Content
                        w="100%"
                        px="15px"
                      >
                        {activeId === "info" ? (
                          <GroupInfo info={groupInfo} portfolioCounts={portfolioCounts} onTabChange={handleTabChange} />
                        ) : activeId === "member" ? (
                          <GroupMemberList groupId={groupInfo.id} category={groupInfo.category} />
                        ) : activeId === "log" ? (
                          <GroupActivityLog groupId={groupInfo.id} />
                        ) : activeId === "aiChat" ? (
                        <AiChat/>
                        ) : (
                          <Text color="gray.500">{GROUP_DETAIL_TAB_LABEL[activeId]} 탭 — 내용 준비 중</Text>
                        )}
                      </ScrollArea.Content>
                    </ScrollArea.Viewport>
                    <HoverScrollbar />
                  </ScrollArea.Root>
                )}
              </div>
            )}
          </>
        )}
      </div>
      {showContent && activeId === "repository" && (
        <RepositoryHorizontalScrollbar
          viewportId={repoViewportId}
          viewportWidth={repoScrollMetrics.viewportWidth}
          scrollWidth={repoScrollMetrics.scrollWidth}
          scrollLeft={repoScrollMetrics.scrollLeft}
          onScrollTo={(left) => {
            if (repoViewportRef.current) repoViewportRef.current.scrollLeft = left;
          }}
        />
      )}
    </div>
  );
}
