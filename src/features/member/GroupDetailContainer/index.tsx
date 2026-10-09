import ContentSkeleton from "../../../components/ContentSkeleton";
import { Box, Button, Text } from "@chakra-ui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import { CSSProperties, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { GroupInfoApi } from "../../../api/public/group/GroupInfoApi";
import { CardLabelDto, KanbanApi, type RecordPageDto } from "../../../api/public/group/KanbanApi";
import { useGroupAction } from "../../../hooks/group/useGroupAction";
import { GroupDetailPageStateProvider } from "./pageState";
import { groupPagePreferences } from "./groupPagePreferences";
import { useGroupPagePreferences } from "./useGroupPagePreferences";
import { encodeWindowOpenRequest, type MinimizedHoverRequest, type WindowOpenRequest } from "./actions";
import CardWindow from "./CardWindow";
import Dashboard from "./Dashboard";
import EditWindow from "./EditWindow";
import { decodeEditContentKey, type EditWindowTarget } from "./EditWindow/types";
import FileWindow from "./FileWindow";
import { decodeFileContentKey, TEXT_FONT_SIZES, type FileWindowContent, type TextFontSize } from "./FileWindow/types";
import { GroupDetailTabId, GROUP_DETAIL_TABS } from "./groupDetailTabs";
import KanbanBoard, { CardListData } from "./KanbanBoard";
import { LABEL_FILTER_KEYS, LabelFilterKey } from "./label";
import styles from "./style.module.css";
import UnimplementedWindow from "./UnimplementedWindow";
import WindowLayer, { HistoryMode, WindowBinding, WindowCoverage, WindowLayerHandle, WindowRole } from "./WindowLayer";
import type { WindowHistoryState } from "./WindowLayer";
import { contentKeyType, isCardKey } from "./WindowLayer/contentKey";

export type { CardListData };
const DASHBOARD_WIDTH_COLLAPSED = 56;
const DASHBOARD_WIDTH_EXPANDED = 56 + 1 + 280;

export default function GroupDetailContainer({ groupId }: { groupId: number }) {
  return (
    <GroupDetailPageStateProvider>
      <GroupDetailPage groupId={groupId} />
    </GroupDetailPageStateProvider>
  );
}

function GroupDetailPage({ groupId }: { groupId: number }) {
  const infoQuery = useQuery({
    queryKey: ["group-detail", groupId, "info"],
    queryFn: () => GroupInfoApi.getGroup(groupId),
  });
  const listsQuery = useQuery({
    queryKey: ["group-detail", groupId, "kanban"],
    queryFn: () => KanbanApi.listGroupLists(groupId),
  });
  const queryClient = useQueryClient();
  const kanbanQueryKey = useMemo(() => ["group-detail", groupId, "kanban"] as const, [groupId]);
  const { mutate, mutateAsync } = useGroupAction(groupId);
  const [pendingBoard, setPendingBoard] = useState<CardListData[] | null>(null);
  const [activeId, setActiveId] = useState<GroupDetailTabId | null>(GROUP_DETAIL_TABS[0].id as GroupDetailTabId);
  const dashboardOverlayRef = useRef<HTMLDivElement>(null);
  const lists = pendingBoard ?? listsQuery.data ?? [];
  const listsRef = useRef(lists);
  listsRef.current = lists;
  const [enabledFilters, setEnabledFilters] = useState<Set<LabelFilterKey>>(() => new Set(LABEL_FILTER_KEYS));
  const location = useLocation();
  const navigate = useNavigate();
  const locationStateRef = useRef(location.state);
  locationStateRef.current = location.state;
  const historyIndexRef = useRef<number | null>(typeof window.history.state?.idx === "number" ? window.history.state.idx : null);
  const windowLayerRef = useRef<WindowLayerHandle>(null);
  // WindowLayer가 상태전이와 URL 해시 문법(knowledge/frontend/card-window-manager.md §9)을
  // 전부 소유한다 — 여기서는 "지금 메인이 뭔지"(존재 확인용)와 "URL을 이렇게 맞춰달라"는
  // 완성된 문자열만 콜백으로 받는다.
  const [mainCardId, setMainCardId] = useState<string | null>(null);
  const [windowCoverage, setWindowCoverage] = useState<WindowCoverage | null>(null);
  // KanbanBoard의 가로 스크롤바가 내려간 헤더와 좌표상 겹칠 때, WindowLayer가 노출한
  // setMinimizedLift를 그대로 불러준다 — 들뜨기 로직 자체는 WindowLayer 하나에만 있다.
  const handleMinimizedHoverRequest = useCallback((request: MinimizedHoverRequest) => {
    windowLayerRef.current?.requestMinimizedHover(request);
  }, []);
  const handleScrollbarGrabbedChange = useCallback((grabbed: boolean) => {
    windowLayerRef.current?.setScrollbarGrabbed(grabbed);
  }, []);
  const preferences = useGroupPagePreferences();
  const [dualWindowPreview, setDualWindowPreview] = useState<boolean | null>(null);
  const dualWindowEnabled = dualWindowPreview ?? preferences.dualWindowEnabled;
  const handleSplitRatioCommit = useCallback((splitRatio: number) => {
    groupPagePreferences.update({ splitRatio });
  }, []);
  // 줄바꿈은 pageState에서 관리한다. 글자 크기는 기존 위치에 유지한다.
  const [textFontSize, setTextFontSize] = useState<TextFontSize>("md");
  const handleChangeTextFontSize = useCallback((direction: 1 | -1) => {
    setTextFontSize((prev) => {
      const nextIndex = Math.min(TEXT_FONT_SIZES.length - 1, Math.max(0, TEXT_FONT_SIZES.indexOf(prev) + direction));
      return TEXT_FONT_SIZES[nextIndex];
    });
  }, []);

  const handleHashChange = useCallback((hash: string, mode: HistoryMode, history: WindowHistoryState) => {
    const currentState = locationStateRef.current;
    navigate({ hash }, {
      replace: mode === "replace",
      state: {
        ...(currentState && typeof currentState === "object" ? currentState : {}),
        sightWindowHistory: { ...history, groupId },
      },
    });
  }, [navigate, groupId]);

  // URL이 바뀔 때마다(직접 진입, 브라우저 뒤로/앞으로가기, WindowLayer 자신이 낸 변경 모두)
  // 해시와 해당 히스토리 항목의 창 ID를 함께 넘긴다. 목표 배치는 해시가 정하고,
  // WindowLayer가 현재 창과 비교해 공통 상태 적용 경로로 복원한다. 정보나 목록이 pending인 동안은
  // 아래에서 스피너만 반환해 <WindowLayer>가 아직 마운트 전이라 windowLayerRef가 비어있다 —
  // 각 쿼리의 로딩 상태를 의존성에 넣어서 로딩이 끝나는 시점에 다시 시도한다.
  useEffect(() => {
    if (infoQuery.isPending || listsQuery.isPending) return;
    const layer = windowLayerRef.current;
    if (!layer) return;
    const saved = location.state?.sightWindowHistory;
    const currentIndex = typeof window.history.state?.idx === "number" ? window.history.state.idx : null;
    const restored = layer.syncFromHash(location.hash ? location.hash.slice(1) : "", saved?.groupId === groupId ? saved : undefined);
    if (restored) {
      historyIndexRef.current = currentIndex;
    } else if (currentIndex !== null && historyIndexRef.current !== null && currentIndex !== historyIndexRef.current) {
      // 닫힘 확인을 취소한 뒤로/앞으로가기는 원래 히스토리 항목으로 돌아가서 목표 항목을 보존한다.
      navigate(historyIndexRef.current - currentIndex);
    } else {
      const current = layer.getHistoryState();
      handleHashChange(current.hash, "replace", current);
    }
  }, [location.hash, location.key, location.state, groupId, infoQuery.isPending, infoQuery.isError, listsQuery.isPending, listsQuery.isError, navigate, handleHashChange]);

  // 창을 여는 모든 경로(카드 클릭, 파일 클릭, 기록 작성/수정, 앞으로 생길 git 등)가 거치는 단일
  // 진입점 — "이 타입의 이 콘텐츠를 열어달라"는 요청만 받고, 실제로 메인/서브 중 어디에
  // 놓일지는 WindowLayer(state 전이)가 그대로 결정한다.
  const openWindow = useCallback((request: WindowOpenRequest, replaceFrom?: WindowRole) => {
    windowLayerRef.current?.openWindow(encodeWindowOpenRequest(request), replaceFrom ? { replaceFrom } : undefined);
  }, []);
  const handleCardClick = useCallback((cardId: string) => openWindow({ type: "card", cardId }), [openWindow]);
  const handleOpenFile = useCallback((content: FileWindowContent) => openWindow({ type: "file", content }), [openWindow]);
  const handleOpenEdit = useCallback((target: EditWindowTarget, sourceRole: WindowRole) => {
    // 수정 버튼에서 연 기록은 이미 카드 창에 불러온 원문을 그대로 초기값으로 넘긴다.
    if (target.kind === "record") {
      for (const list of listsRef.current) {
        for (const card of list.cards) {
          const queries = queryClient.getQueriesData<InfiniteData<RecordPageDto>>({
            queryKey: ["group-detail", groupId, "kanban", card.id, "records"],
          });
          queries.sort(([left], [right]) => (
            (queryClient.getQueryState(right)?.dataUpdatedAt ?? 0) - (queryClient.getQueryState(left)?.dataUpdatedAt ?? 0)
          ));
          const record = queries.flatMap(([, data]) => data?.pages?.flatMap((page) => page.records) ?? [])
            .find((item) => item.id === target.recordId);
          if (!record) continue;
          queryClient.setQueryData(["group-detail", groupId, "kanban-record", target.recordId], {
            ...record, cardId: card.id, cardTitle: card.title,
          });
          openWindow({ type: "edit", target }, sourceRole);
          return;
        }
      }
    }
    openWindow({ type: "edit", target }, sourceRole);
  }, [groupId, openWindow, queryClient]);

  useEffect(() => {
    // mainCardId는 "지금 메인 슬롯의 콘텐츠 식별자"일 뿐 항상 카드 id가 아니다 — 파일 창
    // (이나 앞으로 생길 다른 창 종류)이 메인이면 카드 목록에 당연히 없으므로, 카드 키일
    // 때만 이 확인을 한다(§9.1의 "타입:내용" 컨벤션, isCardKey로 판별).
    if (listsQuery.isPending || !mainCardId || !isCardKey(mainCardId)) return;
    const exists = lists.some((list) => list.cards.some((card) => card.id === mainCardId));
    if (!exists) {
      window.alert("존재하지 않는 카드입니다.");
      windowLayerRef.current?.closeCardIfOpen(mainCardId);
    }
  }, [listsQuery.isPending, lists, mainCardId]);

  const handleAddCard = useCallback((listId: string, title: string) => {
    mutate(() => KanbanApi.createGroupCard(groupId, { listId, title }));
  }, [groupId, mutate]);
  const handleAddList = useCallback((title: string) => {
    mutate(() => KanbanApi.createGroupList(groupId, { title }));
  }, [groupId, mutate]);
  const handleDeleteList = useCallback((listId: string) => {
    return mutateAsync(() => KanbanApi.deleteGroupList(groupId, listId)).then(() => undefined).catch(() => undefined);
  }, [groupId, mutateAsync]);
  const handleMoveList = useCallback((listId: string, targetIndex: number) => {
    const previous = listsRef.current;
    const originIndex = previous.findIndex((list) => list.id === listId);
    if (originIndex < 0) return;
    const remaining = previous.filter((list) => list.id !== listId);
    const insertIndex = Math.max(0, Math.min(targetIndex, remaining.length));
    if (originIndex === insertIndex) return;
    const beforeListId = remaining[insertIndex]?.id ?? null;
    const next = [...remaining];
    next.splice(insertIndex, 0, previous[originIndex]);
    void queryClient.cancelQueries({ queryKey: kanbanQueryKey, exact: true });
    listsRef.current = next;
    setPendingBoard(next);
    queryClient.setQueryData(kanbanQueryKey, next);
    void mutateAsync(() => KanbanApi.moveGroupList(groupId, listId, { beforeListId }))
      .then(() => setPendingBoard((current) => current === next ? null : current))
      .catch(() => {
        if (queryClient.getQueryData(kanbanQueryKey) === next) {
          listsRef.current = previous;
          queryClient.setQueryData(kanbanQueryKey, previous);
        }
        setPendingBoard((current) => current === next ? null : current);
      });
  }, [groupId, kanbanQueryKey, mutateAsync, queryClient]);
  const handleMoveCard = useCallback((sourceListId: string, cardId: string, targetListId: string, targetIndex: number) => {
    const previous = listsRef.current;
    const source = previous.find((list) => list.id === sourceListId);
    const target = previous.find((list) => list.id === targetListId);
    const cardIndex = source?.cards.findIndex((card) => card.id === cardId) ?? -1;
    if (!source || !target || cardIndex < 0) return;
    const remainingTargetCards = target.cards.filter((card) => card.id !== cardId);
    const insertIndex = Math.max(0, Math.min(targetIndex, remainingTargetCards.length));
    if (sourceListId === targetListId && cardIndex === insertIndex) return;
    const beforeCardId = remainingTargetCards[insertIndex]?.id ?? null;
    const next = previous.map((list) => ({ ...list, cards: [...list.cards] }));
    const nextSource = next.find((list) => list.id === sourceListId)!;
    const nextTarget = next.find((list) => list.id === targetListId)!;
    const [card] = nextSource.cards.splice(cardIndex, 1);
    nextTarget.cards.splice(insertIndex, 0, card);
    void queryClient.cancelQueries({ queryKey: kanbanQueryKey, exact: true });
    listsRef.current = next;
    setPendingBoard(next);
    queryClient.setQueryData(kanbanQueryKey, next);
    void mutateAsync(() => KanbanApi.moveGroupCard(groupId, cardId, { targetListId, beforeCardId }))
      .then(() => setPendingBoard((current) => current === next ? null : current))
      .catch(() => {
        if (queryClient.getQueryData(kanbanQueryKey) === next) {
          listsRef.current = previous;
          queryClient.setQueryData(kanbanQueryKey, previous);
        }
        setPendingBoard((current) => current === next ? null : current);
      });
  }, [groupId, kanbanQueryKey, mutateAsync, queryClient]);
  const handleToggleCardPortfolio = useCallback((listId: string, cardId: string) => {
    const card = listsRef.current.find((list) => list.id === listId)?.cards.find((item) => item.id === cardId);
    if (card) mutate(() => KanbanApi.updateGroupCardPortfolio(groupId, cardId, { portfolio: !card.portfolio }));
  }, [groupId, mutate]);
  const handleUpdateCardLabels = useCallback((cardId: string, labels: CardLabelDto[]) => {
    mutate(() => KanbanApi.updateGroupCardLabels(groupId, cardId, { labels }));
  }, [groupId, mutate]);
  const handleUpdateCardAssignee = useCallback((cardId: string, assigneeUserId: number | null) => {
    mutate(() => KanbanApi.updateGroupCardAssignee(groupId, cardId, { assigneeUserId }));
  }, [groupId, mutate]);
  // CoverImageForm이 업로드(URL 발급+PUT)까지 직접 한 뒤 마지막 커밋만 이걸로 넘긴다 — 폼이
  // 성공 여부를 보고 스스로 닫아야 해서 mutate(fire-and-forget) 대신 mutateAsync를 쓴다.
  const handleUpdateCardCoverImage = useCallback((cardId: string, input: { coverImageUrl: string } | { fileUploadId: string }) => {
    return mutateAsync(() => KanbanApi.updateGroupCardCoverImage(groupId, cardId, input));
  }, [groupId, mutateAsync]);
  const handleToggleCardDisabled = useCallback((listId: string, cardId: string) => {
    const card = listsRef.current.find((list) => list.id === listId)?.cards.find((item) => item.id === cardId);
    if (card) mutate(() => KanbanApi.updateGroupCardDisabled(groupId, cardId, { disabled: !card.disabled }));
  }, [groupId, mutate]);
  const handleUpdateList = useCallback((listId: string, changes: { title: string; description: string }) => {
    mutate(() => KanbanApi.updateGroupList(groupId, listId, changes));
  }, [groupId, mutate]);
  const handleDeleteCard = useCallback((cardId: string) => {
    mutate(() => KanbanApi.archiveGroupCard(groupId, cardId));
  }, [groupId, mutate]);
  const handleDeleteRecord = useCallback((cardId: string, recordId: string) => {
    mutate(() => KanbanApi.archiveGroupRecord(groupId, cardId, recordId));
  }, [groupId, mutate]);
  const handleRestoreRecord = useCallback((cardId: string, recordId: string) => {
    mutate(() => KanbanApi.restoreGroupRecord(groupId, cardId, recordId));
  }, [groupId, mutate]);
  // EditWindow가 보내기를 누른 뒤 창을 닫기 전에 완료를 기다려야 해서 mutateAsync를 쓴다
  // (handleDeleteCard 등의 fire-and-forget mutate와 다르다).
  const handleCreateRecord = useCallback((cardId: string, content: string) => {
    return mutateAsync(() => KanbanApi.createGroupRecord(groupId, cardId, { content })).then(() => undefined);
  }, [groupId, mutateAsync]);
  const handleUpdateRecord = useCallback((cardId: string, recordId: string, content: string) => {
    return mutateAsync(() => KanbanApi.updateGroupRecord(groupId, cardId, recordId, { content })).then(() => undefined);
  }, [groupId, mutateAsync]);

  // WindowLayer는 카드 id만 알고 내용은 모른다 — id별로 실제 CardWindow를 그리는 함수를
  // 통째로 넘겨서, WindowLayer가 지금 열려 있는 카드에 대해서만 호출하게 한다.
  const isPortfolioPublished = infoQuery.data?.hasPublishedPortfolio ?? false;
  // EditWindow의 "new" 케이스가 카드명을 추가 API 호출 없이 바로 찾기 위한 평탄화된 카드 목록.
  const allCards = useMemo(() => lists.flatMap((list) => list.cards), [lists]);
  const cardsForWindowLayer = useMemo(() => {
    const entries = lists.flatMap((list) => list.cards.map((card) => [card.id, (binding: WindowBinding) => (
      <CardWindow
        key={card.id}
        binding={binding}
        groupId={groupId}
        card={card}
        listTitle={list.title}
        isPortfolioPublished={isPortfolioPublished}
        onUpdateLabels={handleUpdateCardLabels}
        onUpdateAssignee={handleUpdateCardAssignee}
        onUpdateCoverImage={handleUpdateCardCoverImage}
        onTogglePortfolio={() => handleToggleCardPortfolio(list.id, card.id)}
        onToggleDisabled={() => handleToggleCardDisabled(list.id, card.id)}
        onDeleteCard={() => handleDeleteCard(card.id)}
        onDeleteRecord={(recordId) => handleDeleteRecord(card.id, recordId)}
        onRestoreRecord={(recordId) => handleRestoreRecord(card.id, recordId)}
        onOpenNewRecord={() => handleOpenEdit({ kind: "new", cardId: card.id }, binding.role)}
        onOpenEditRecord={(recordId) => handleOpenEdit({ kind: "record", recordId }, binding.role)}
        onOpenCard={handleCardClick}
      />
    )] as const));
    return Object.fromEntries(entries);
  }, [lists, groupId, isPortfolioPublished, handleUpdateCardLabels, handleUpdateCardAssignee, handleUpdateCardCoverImage, handleToggleCardPortfolio, handleToggleCardDisabled, handleDeleteCard, handleDeleteRecord, handleRestoreRecord, handleOpenEdit, handleCardClick]);

  // WindowLayer가 넘기는 key는 카드 id, 파일 콘텐츠 키("file:..."), 또는 아직 구현 안 된
  // 창 종류("git:...", "edit:..." 등 §9.1이 문법만 예약해둔 것)다 — 어느 쪽인지는
  // WindowLayer는 모르고, 여기서만 판별한다. 알려진 종류가 아니면 조용히 null을 그리는 대신
  // "구현 중"이라고 알려서, 카드가 아닌데 "존재하지 않는 카드"로 오판되거나 빈 창으로
  // 보이지 않게 한다.
  const renderContent = useCallback((key: string, binding: WindowBinding): ReactNode => {
    const renderCard = cardsForWindowLayer[key];
    if (renderCard) return renderCard(binding);
    const fileContent = decodeFileContentKey(key);
    if (fileContent) {
      return (
        <FileWindow
          key={key}
          binding={binding}
          content={fileContent}
          textFontSize={textFontSize}
          onChangeTextFontSize={handleChangeTextFontSize}
        />
      );
    }
    const editTarget = decodeEditContentKey(key);
    if (editTarget) {
      return (
        <EditWindow
          key={key}
          binding={binding}
          groupId={groupId}
          target={editTarget}
          cards={allCards}
          onCreateRecord={handleCreateRecord}
          onUpdateRecord={handleUpdateRecord}
        />
      );
    }
    const type = contentKeyType(key);
    if (type) return <UnimplementedWindow key={key} binding={binding} type={type} />;
    return null;
  }, [cardsForWindowLayer, textFontSize, handleChangeTextFontSize, groupId, allCards, handleCreateRecord, handleUpdateRecord]);

  if (infoQuery.isPending || listsQuery.isPending) return <Box p={10}><ContentSkeleton /></Box>;
  if (infoQuery.isError || listsQuery.isError) return <Box p={6}>
    <Text>그룹 정보를 불러오지 못했습니다.</Text>
    <Button onClick={() => { void infoQuery.refetch(); void listsQuery.refetch(); }}>다시 시도</Button>
  </Box>;
  const info = infoQuery.data;
  const sectionStyle = {
    "--dashboard-width": `${activeId === null ? DASHBOARD_WIDTH_COLLAPSED : DASHBOARD_WIDTH_EXPANDED}px`,
  } as CSSProperties;

  return (
    <>
      <div className={styles.section} style={sectionStyle}>
        <div className={styles.kanbanBackground} aria-hidden="true" />
        <KanbanBoard
          lists={lists}
          isMovePending={pendingBoard !== null}
          isPortfolioPublished={info.hasPublishedPortfolio}
          dashboardOverlayRef={dashboardOverlayRef}
          dashboardExtraWidthPx={activeId === null ? 0 : DASHBOARD_WIDTH_EXPANDED - DASHBOARD_WIDTH_COLLAPSED}
          enabledFilters={enabledFilters}
          windowCoverage={windowCoverage}
          onMinimizedHoverRequest={handleMinimizedHoverRequest}
          onScrollbarGrabbedChange={handleScrollbarGrabbedChange}
          onAddCard={handleAddCard}
          onAddList={handleAddList}
          onDeleteList={handleDeleteList}
          onMoveList={handleMoveList}
          onMoveCard={handleMoveCard}
          onToggleCardPortfolio={handleToggleCardPortfolio}
          onCardClick={handleCardClick}
          onUpdateList={handleUpdateList}
        />
        <div ref={dashboardOverlayRef} className={styles.dashboardOverlay}>
          <Dashboard
            title={info.title}
            groupInfo={info}
            lists={lists}
            activeId={activeId}
            onTabChange={(id) => setActiveId((previous) => previous === id ? null : id as GroupDetailTabId)}
            enabledFilters={enabledFilters}
            onToggleFilter={(key) => setEnabledFilters((previous) => {
              const next = new Set(previous);
              if (next.has(key)) next.delete(key); else next.add(key);
              return next;
            })}
            onOpenFile={handleOpenFile}
            dualWindowEnabled={dualWindowEnabled}
            onDualWindowEnabledChange={setDualWindowPreview}
          />
        </div>
        <WindowLayer
          ref={windowLayerRef}
          renderContent={renderContent}
          isDashboardExpanded={activeId !== null}
          onHashChange={handleHashChange}
          onMainCardChange={setMainCardId}
          onCoverageChange={setWindowCoverage}
          dualWindowEnabled={dualWindowEnabled}
          initialSplitRatio={preferences.splitRatio}
          onSplitRatioCommit={handleSplitRatioCommit}
        />
      </div>
    </>
  );
}
