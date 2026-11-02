import ContentSkeleton from "../../../../components/ContentSkeleton";
import { GroupStatus } from "../../../../constant";
import { useLoadMoreOnScroll } from "../../../../hooks/useLoadMoreOnScroll";
import SkeletonWrapper from "../../../../components/SkeletonWrapper";
import { Box, Text } from "@chakra-ui/react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { BriefcaseBusiness, CalendarPlus, ChevronDown, Eye, EyeOff, Handshake, Image, LockKeyhole, LockKeyholeOpen, PenBox, PenLine, Plus, SendHorizonal, StretchHorizontal, Trash2, User } from "lucide-react";
import { KeyboardEvent, useEffect, useMemo, useRef, useState, useCallback } from "react";

import { CardLabelDto, KanbanApi, KanbanCardDto, type CardCoverImageInput } from "../../../../api/public/group/KanbanApi";
import AppTooltip from "../../../../components/AppTooltip";
import Button from "../../../../components/Button";
import Collapse from "../../../../components/Collapse";
import MarkdownViewer from "../../../../components/MarkdownViewer";
import SimpleMarkdownEditor from "../../../../components/SimpleMarkdownEditor";
import { VerticalScrollBox } from "../../../../components/ScrollBox";
import { cn } from "../../../../util/cn";
import { DateFormats, formatDate } from "../../../../util/date";
import { useUnsavedChangesBeforeUnload } from "../../../../hooks/browser/useUnsavedChangesBeforeUnload";
import { LABEL_COLOR_HEX, LABEL_COLOR_NAME, LABEL_COLORS } from "../label";
import Window from "../Window";
import { DualWindowActions, SingleWindowActions } from "../Window/HeaderActions";
import windowStyles from "../Window/style.module.css";
import { WindowBinding } from "../WindowLayer";
import { sideForRole } from "../actions";
import AssigneePicker from "./AssigneePicker";
import CoverImageForm from "./CoverImageForm";
import RecordItem from "./RecordItem";
import RecordSortMenu, { RecordSortOrder } from "./RecordSortMenu";
import styles from "./style.module.css";

// 카드 설명은 아직 서버 연동 전(로컬 state만, §45 description)이라 마크다운 뷰어 확인용
// 목업 텍스트를 기본값으로 둔다 — 실제 연동 시 card.description으로 교체한다.
const MOCK_DESCRIPTION = `이 카드는 **마크다운**으로 설명을 작성합니다.

- 할 일 하나
- 할 일 둘
  - 하위 항목

\`inline code\`와 아래 같은 코드 블록도 됩니다.

\`\`\`ts
const hello = "world";
\`\`\`

> 인용문도 지원합니다.

[참고 링크](https://khlug.org)`;

type Props = {
  binding: WindowBinding;
  groupId: number;
  card: KanbanCardDto;
  listTitle: string;
  isPortfolioPublished: boolean;
  groupStatus: GroupStatus;
  onUpdateLabels: (cardId: string, labels: CardLabelDto[]) => void;
  onUpdateAssignee: (cardId: string, assigneeUserId: number | null) => void;
  onUpdateCoverImage: (cardId: string, input: CardCoverImageInput) => Promise<unknown>;
  onTogglePortfolio: () => void;
  onToggleDisabled: () => void;
  onDeleteCard: () => void;
  onDeleteRecord: (recordId: string) => void;
  onRestoreRecord: (recordId: string) => void;
  onOpenNewRecord: () => void;
  onOpenEditRecord: (recordId: string) => void;
  // 기록 본문의 카드 링크(#카드id)로 같은 그룹의 카드 창을 연다.
  onOpenCard: (cardId: string) => void;
  // 이 기록 위치로 스크롤해야 할 때만 값이 있다. 스크롤했거나 찾지 못하면 onRecordFocused로 알린다.
  focusRecordId: string | null;
  onRecordFocused: () => void;
};

type EditingField = "title" | "description" | null;

export default function CardWindow({ binding, groupId, card, listTitle, isPortfolioPublished, groupStatus, onUpdateLabels, onUpdateAssignee, onUpdateCoverImage, onTogglePortfolio, onToggleDisabled, onDeleteCard, onDeleteRecord, onRestoreRecord, onOpenNewRecord, onOpenEditRecord, onOpenCard, focusRecordId, onRecordFocused }: Props) {
  const { role, minimized, isClosing, canGoDual, onToggleMinimize, onClose, onSwitchSide, onExpand, onSendToSide, registerCloseGuard } = binding;
  const isDualLayer = role !== "single";
  const [isTitleStuck, setIsTitleStuck] = useState(false);
  const titleSentinelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // 기록 목차에서 제목으로 이동할 때 위에 붙는 제목 줄(.titleSection)에 가리지 않도록, 그 높이를 CSS 변수로
  // 알려준다(--heading-scroll-margin 계산에 쓴다). 제목 길이·편집 상태에 따라 높이가 바뀌어서 직접 잰다.
  useEffect(() => {
    const content = contentRef.current;
    const title = content?.querySelector<HTMLElement>(`.${styles.titleSection}`);
    if (!content || !title) return;
    const update = () => content.style.setProperty("--card-title-height", `${title.offsetHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(title);
    return () => observer.disconnect();
  }, []);
  const [isCoverFormOpen, setIsCoverFormOpen] = useState(false);
  // 기록 정렬은 카드에 저장된 설정이라 카드 단건 조회로 시작 값을 받고, 바꾸면 카드 정보 변경으로 저장한다.
  const cardDetailQuery = useQuery({
    queryKey: ["group-detail", groupId, "card", card.id],
    queryFn: () => KanbanApi.getGroupCard(groupId, card.id),
  });
  const sortOrder: RecordSortOrder = cardDetailQuery.data?.recordSort ?? "NEWEST";
  const queryClient = useQueryClient();
  const setSortOrder = (next: RecordSortOrder) => {
    if (next === sortOrder) return;
    queryClient.setQueryData(["group-detail", groupId, "card", card.id], (previous: typeof cardDetailQuery.data) => previous && { ...previous, recordSort: next });
    KanbanApi.updateGroupCard(groupId, card.id, { recordSort: next })
      .catch(() => {
        toast.error("기록 정렬을 저장하지 못했습니다.");
        void cardDetailQuery.refetch();
      });
  };
  const [showDeleted, setShowDeleted] = useState(true);
  const recordsQuery = useInfiniteQuery({
    queryKey: ["group-detail", groupId, "kanban", card.id, "records", sortOrder, showDeleted],
    queryFn: ({ pageParam, signal }) => KanbanApi.listGroupRecordsPage(groupId, card.id, {
      skip: pageParam, limit: 10, includeDeleted: showDeleted,
    }, signal),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastOffset) => {
      const nextOffset = lastOffset + lastPage.records.length;
      return lastPage.records.length > 0 && nextOffset < lastPage.totalCount ? nextOffset : undefined;
    },
  });
  const records = useMemo(() => recordsQuery.data?.pages.flatMap((page) => page.records) ?? [], [recordsQuery.data]);
  // 대상 기록이 아직 불러오지 않은 페이지에 있으면 찾을 때까지 다음 페이지를 이어서 불러온다.
  // 찾으면 스크롤한 뒤 잠깐 강조 표시한다(강조 애니메이션이 끝나면 RecordItem이 알려 해제).
  const [highlightedRecordId, setHighlightedRecordId] = useState<string | null>(null);
  const { hasNextPage, isFetching, isFetchingNextPage, isFetchNextPageError, isError, fetchNextPage } = recordsQuery;
  // 기록 목록 끝의 스켈레톤이 보이거나 목록이 짧아 빈 공간이 남으면 다음 기록을 이어서 불러온다.
  const recordsSentinelRef = useRef<HTMLDivElement>(null);
  const loadMoreRecords = useCallback(() => { void fetchNextPage(); }, [fetchNextPage]);
  useLoadMoreOnScroll({ sentinelRef: recordsSentinelRef, hasMore: Boolean(hasNextPage) && !isFetchNextPageError, isLoading: isFetching, loadMore: loadMoreRecords });
  useEffect(() => {
    if (!focusRecordId) return;
    // 내려간 창이면 먼저 펼친다. 펼쳐져 minimized가 바뀌면 이 effect가 다시 돌며 스크롤한다.
    if (minimized) {
      onToggleMinimize();
      return;
    }
    if (records.some((record) => String(record.id) === focusRecordId)) {
      contentRef.current
        ?.querySelector<HTMLElement>(`[data-record-id="${CSS.escape(focusRecordId)}"]`)
        ?.scrollIntoView({ block: "start", behavior: "smooth" });
      setHighlightedRecordId(focusRecordId);
      onRecordFocused();
      return;
    }
    if (isFetching) return;
    if (hasNextPage && !isFetchNextPageError) {
      void fetchNextPage();
      return;
    }
    if (isError || isFetchNextPageError) window.alert("기록을 불러오지 못했습니다.");
    else window.alert("기록을 찾을 수 없습니다.");
    onRecordFocused();
  }, [focusRecordId, minimized, onToggleMinimize, records, hasNextPage, isFetching, isFetchingNextPage, isFetchNextPageError, isError, fetchNextPage, onRecordFocused]);
  const handleToggleRecordDeleted = (recordId: string) => {
    const record = records.find((item) => String(item.id) === recordId);
    if (!record) return;
    if (record.isDeleted) onRestoreRecord(recordId); else onDeleteRecord(recordId);
  };
  const [editingField, setEditingField] = useState<EditingField>(null);
  const [title, setTitle] = useState(card.title);
  const [draftTitle, setDraftTitle] = useState(card.title);
  const [description, setDescription] = useState(MOCK_DESCRIPTION);
  // 종료 그룹과 비활성 카드에서는 내용을 바꿀 수 없다. 레이블·포트폴리오는 중단 그룹에서도 바꿀 수 없다.
  const isGroupEnded = groupStatus === GroupStatus.SUCCESS || groupStatus === GroupStatus.FAIL;
  const isGroupStopped = groupStatus === GroupStatus.STOP;
  const isContentLocked = card.isDisabled || isGroupEnded;
  const isLabelLocked = isContentLocked || isGroupStopped;
  const [draftDescription, setDraftDescription] = useState(description);
  const editBoxRef = useRef<HTMLDivElement>(null);
  const startEditingTitle = () => {
    if (isContentLocked) return;
    setDraftTitle(title);
    setEditingField("title");
  };
  const commitTitle = () => {
    setTitle(draftTitle.trim() || title);
    setEditingField(null);
  };
  const startEditingDescription = () => {
    if (isContentLocked) return;
    setDraftDescription(description);
    setEditingField("description");
  };
  // SimpleMarkdownEditor의 보내기 버튼이 트림까지 끝낸 값을 바로 넘겨준다.
  const commitDescription = (value: string) => {
    setDescription(value);
    setEditingField(null);
  };
  const stopEditingOnKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      commitTitle();
    } else if (event.key === "Escape") {
      setEditingField(null);
    }
  };

  const isDescriptionDirty = editingField === "description" && draftDescription !== description;
  const isTitleDirty = editingField === "title" && draftTitle !== title;
  useUnsavedChangesBeforeUnload(isDescriptionDirty || isTitleDirty);
  const confirmDiscardEdit = () => window.confirm("편집 중인 내용이 있습니다. 편집을 종료하시겠습니까?");

  // 닫기 버튼, 교체, 히스토리 복원 등 창이 사라지는 모든 경로에서 같은 확인 함수를 쓴다.
  useEffect(() => {
    registerCloseGuard(isDescriptionDirty || isTitleDirty ? confirmDiscardEdit : null);
    return () => registerCloseGuard(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDescriptionDirty, isTitleDirty, isClosing]);

  // 닫힘 확인과 애니메이션은 WindowLayer가 상태 적용 전에 공통으로 처리한다.
  const handleRequestClose = () => {
    onClose();
  };

  useEffect(() => {
    if (!editingField) return;
    const cancelOnOutsideClick = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      if (editBoxRef.current?.contains(event.target)) return;
      // 헤더 클릭으로 편집을 종료하는 처리는 onToggleMinimize에서 맡는다.
      if (event.target instanceof Element && event.target.closest(".js-window-header")) return;
      if ((isDescriptionDirty || isTitleDirty) && !confirmDiscardEdit()) return;
      setEditingField(null);
    };
    document.addEventListener("pointerdown", cancelOnOutsideClick);
    return () => document.removeEventListener("pointerdown", cancelOnOutsideClick);
  }, [editingField, isDescriptionDirty, isTitleDirty]);
  const toggleLabel = (color: CardLabelDto) => {
    if (isLabelLocked) return;
    const next = card.labels.includes(color)
      ? card.labels.filter((label) => label !== color)
      : [...card.labels, color];
    onUpdateLabels(card.id, next);
  };
  const handleDisable = () => {
    if (window.confirm("비활성화해도 카드는 리스트에서 사라지지 않고 그대로 남습니다. 계속하시겠습니까?")) {
      onToggleDisabled();
    }
  };
  const handleActivate = () => {
    if (window.confirm("카드를 다시 활성화하시겠습니까?")) {
      onToggleDisabled();
    }
  };
  const handleDelete = () => {
    if (!window.confirm("카드를 삭제하시겠습니까? 삭제한 카드는 아카이브 탭에서 복구할 수 있습니다.")) return;
    // 창을 먼저 닫아 메인 카드/URL을 이 카드에서 떼어낸 뒤에 삭제 요청을 보낸다. 순서를
    // 반대로 하면(삭제가 먼저 끝나 목록이 갱신되는 시점에 아직 mainCardId가 이 카드를
    // 가리키고 있으면) GroupDetailContainer의 "열려 있는 카드가 사라졌는지" 감시 effect가
    // "존재하지 않는 카드입니다" 알림을 오발동시킨다 — 그 감시는 URL 직접 진입/뒤로가기처럼
    // 내가 아닌 경로로 카드가 사라진 경우를 위한 것이라, 내가 지금 막 지운 경우엔 안 떠야 한다.
    if ((isDescriptionDirty || isTitleDirty) && !confirmDiscardEdit()) return;
    registerCloseGuard(null);
    onClose();
    onDeleteCard();
  };

  useEffect(() => {
    const sentinel = titleSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => setIsTitleStuck(!entry.isIntersecting), { threshold: 0 });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const middleActions = !isDualLayer
    ? <SingleWindowActions canGoDual={canGoDual} onSendToSide={onSendToSide} />
    : <DualWindowActions side={sideForRole(role === "main" ? "main" : "sub")} otherSideEmpty={binding.otherSideEmpty} onExpand={onExpand} onSwitchSide={onSwitchSide} />;

  return (
    <Window
      isSub={role === "sub"}
      bg={card.isDisabled ? "gray.100" : undefined}
      minimized={minimized}
      onToggleMinimize={() => {
        if (!minimized && editingField !== null) {
          if ((isDescriptionDirty || isTitleDirty) && !confirmDiscardEdit()) return;
          setEditingField(null);
          return;
        }
        onToggleMinimize();
      }}
      isClosing={isClosing}
      onRequestClose={handleRequestClose}
      middleActions={middleActions}
      headerLeftTogglesMinimize={false}
      headerLeft={
        // 내려가면 라벨 필터 줄 대신 카드 제목을 보여준다 — 창 자체의 동작(내리기/올리기,
        // 닫기, 딤 배경 등)은 전부 Window가 맡고, CardWindow는 이 표시 전환만 담당한다.
        <Box className={styles.headerLeftStack}>
          <Box
            className={cn(
              styles.labelFilterRow,
              styles.headerLeftLayer,
              minimized ? styles.headerLeftLayerOut : undefined,
            )}
          >
            {LABEL_COLORS.map((color) => (
              <Box
                key={color}
                as="button"
                className={styles.labelFilterDot}
                aria-label={LABEL_COLOR_NAME[color]}
                borderWidth="2px"
                borderColor={LABEL_COLOR_HEX[color]}
                bg={card.labels.includes(color) ? LABEL_COLOR_HEX[color] : "transparent"}
                cursor={isLabelLocked ? "default" : "pointer"}
                _active={isLabelLocked ? undefined : { transform: "scale(0.9)" }}
                onClick={(event) => {
                  event.stopPropagation();
                  toggleLabel(color);
                }}
              />
            ))}
          </Box>
          <Text
            className={cn(
              styles.minimizedTitle,
              styles.headerLeftLayer,
              !minimized ? styles.headerLeftLayerOut : undefined,
            )}
            fontWeight="semibold"
          >
            {title}
          </Text>
        </Box>
      }
    >
      <VerticalScrollBox gutter={16} scrollbarClassName={windowStyles.scrollbar}>
      <Box ref={contentRef} className={styles.cardContent}>
        {card.coverImageUrl && (
          <SkeletonWrapper
            className={styles.coverImage}
            style={{ backgroundImage: `url(${card.coverImageUrl})` }}
          />
        )}
        <div ref={titleSentinelRef} />
        <SkeletonWrapper
          className={cn(
            styles.section,
            styles.titleSection,
            isTitleStuck ? styles.titleStuck : undefined,
            isContentLocked ? styles.titleDisabled : undefined,
          )}
        >
          {editingField === "title" ? (
            <Box className={styles.editBox} ref={editBoxRef}>
              <input
                autoFocus
                className={styles.titleInput}
                aria-label="카드 제목"
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.target.value)}
                onKeyDown={stopEditingOnKeyDown}
              />
              <Box
                as="button"
                className={styles.editSendButton}
                aria-label="제목 저장"
                onClick={commitTitle}
              >
                <SendHorizonal size={16} />
              </Box>
            </Box>
          ) : (
            <Text
              className={cn(styles.title, isContentLocked ? styles.titleReadOnly : undefined)}
              fontSize="2xl"
              fontWeight="bold"
              onClick={startEditingTitle}
            >
              {title}
            </Text>
          )}
          {!isContentLocked && (
            <AppTooltip
              content={editingField ? "제목/설명 수정을 마친 뒤 기록할 수 있습니다" : "새 기록 작성"}
              placement="top"
            >
              <span
                className={styles.recordButtonSlot}
                onPointerDown={editingField ? (event) => event.stopPropagation() : undefined}
              >
                <Button size="sm" _disabled={{ color: "gray.500" }} disabled={editingField !== null} onClick={onOpenNewRecord}>
                  <PenBox size={14} />
                  기록하기
                </Button>
              </span>
            </AppTooltip>
          )}
        </SkeletonWrapper>
        <SkeletonWrapper className={cn(styles.section, styles.descriptionSection)}>
          {editingField === "description" ? (
            // 보내기 버튼이 SimpleMarkdownEditor 자신의 툴바에 있어서, 바깥 테두리/버튼을
            // 따로 그릴 필요 없이 바깥 클릭 감지용 ref만 얹는다.
            <Box ref={editBoxRef}>
              <SimpleMarkdownEditor
                value={draftDescription}
                onChange={setDraftDescription}
                onSubmit={commitDescription}
                placeholder="카드 설명을 마크다운으로 작성하세요"
              />
            </Box>
          ) : description ? (
            <Box
              className={cn(styles.descriptionText, styles.descriptionMarkdown, isContentLocked ? styles.titleReadOnly : undefined)}
              onClick={startEditingDescription}
            >
              <MarkdownViewer content={description} />
            </Box>
          ) : (
            <Text
              className={cn(styles.descriptionText, isContentLocked ? styles.titleReadOnly : undefined)}
              color="gray.500"
              onClick={startEditingDescription}
            >
              카드 설명
            </Text>
          )}
        </SkeletonWrapper>
        <SkeletonWrapper className={cn(styles.section, styles.metaLine)}>
          <Box className={styles.metaGroup}>
            <Box className={styles.metaItem}>
              <StretchHorizontal size={14} />
              <Text fontSize="xs">{listTitle}</Text>
            </Box>
            <Box className={styles.metaItem}>
              <PenLine size={14} />
              <Text fontSize="xs">{card.authorName} 만듦</Text>
            </Box>
            <Box className={styles.metaItem}>
              <CalendarPlus size={14} />
              <Text fontSize="xs">{formatDate(new Date(card.createdAt), DateFormats.DATETIME)} (생성)</Text>
            </Box>
            <Box className={styles.metaItem}>
              <User size={14} />
              {isContentLocked ? (
                <Text fontSize="xs">{card.assigneeName ?? "없음"}</Text>
              ) : card.assigneeName ? (
                <AssigneePicker
                  groupId={groupId}
                  onSelect={(userId) => onUpdateAssignee(card.id, userId)}
                  ariaLabel="담당자 변경"
                  triggerClassName={styles.assigneeTrigger}
                >
                  <Text fontSize="xs">{card.assigneeName}</Text>
                  <ChevronDown size={12} />
                </AssigneePicker>
              ) : (
                <AssigneePicker
                  groupId={groupId}
                  onSelect={(userId) => onUpdateAssignee(card.id, userId)}
                  ariaLabel="담당자 지정"
                  triggerClassName={styles.assigneeAddButton}
                >
                  <Plus size={12} />
                </AssigneePicker>
              )}
            </Box>
          </Box>
          <Box className={styles.metaIconGroup}>
            <RecordSortMenu value={sortOrder} onChange={setSortOrder} triggerClassName={styles.secondaryActionButton} />
            <AppTooltip content={showDeleted ? "삭제된 기록 숨기기" : "삭제된 기록 보이기"} placement="top">
              <Box
                as="button"
                className={styles.secondaryActionButton}
                aria-label={showDeleted ? "삭제된 기록 숨기기" : "삭제된 기록 보이기"}
                aria-pressed={showDeleted}
                onClick={() => setShowDeleted((current) => !current)}
              >
                {showDeleted ? <EyeOff size={16} /> : <Eye size={16} />}
              </Box>
            </AppTooltip>
            {isGroupEnded ? null : card.isDisabled ? (
              <>
                <Box as="button" className={styles.activateButton} onClick={handleActivate}>
                  <LockKeyholeOpen size={14} />
                  카드 활성화
                </Box>
                <AppTooltip content="카드 삭제" placement="top">
                  <Box as="button" className={cn(styles.secondaryActionButton, styles.deleteIconButton)} aria-label="카드 삭제" onClick={handleDelete}>
                    <Trash2 size={16} />
                  </Box>
                </AppTooltip>
              </>
            ) : (
              <>
                {isPortfolioPublished && !isGroupStopped && (
                  <AppTooltip content={card.isInPortfolio ? "포트폴리오에서 제외하기" : "포트폴리오에 포함하기"} placement="top">
                    <Box
                      as="button"
                      className={cn(styles.secondaryActionButton, card.isInPortfolio ? styles.portfolioActive : undefined)}
                      aria-label={card.isInPortfolio ? "포트폴리오에서 제외하기" : "포트폴리오에 포함하기"}
                      aria-pressed={card.isInPortfolio}
                      onClick={onTogglePortfolio}
                    >
                      <BriefcaseBusiness size={16} />
                    </Box>
                  </AppTooltip>
                )}
                <AppTooltip content="커버 이미지 설정" placement="top">
                  <Box
                    as="button"
                    className={cn(styles.secondaryActionButton, card.coverImageUrl ? styles.portfolioActive : undefined)}
                    aria-label="커버 이미지 설정"
                    aria-pressed={isCoverFormOpen}
                    onClick={() => setIsCoverFormOpen((prev) => !prev)}
                  >
                    <Image size={16} />
                  </Box>
                </AppTooltip>
                <AppTooltip content="다른 카드에서 이어받기" placement="top">
                  <Box as="button" className={styles.secondaryActionButton} aria-label="다른 카드에서 이어받기">
                    <Handshake size={16} />
                  </Box>
                </AppTooltip>
                <AppTooltip content="카드 비활성화" placement="top">
                  <Box as="button" className={styles.secondaryActionButton} aria-label="카드 비활성화" onClick={handleDisable}>
                    <LockKeyhole size={16} />
                  </Box>
                </AppTooltip>
                <AppTooltip content="카드 삭제" placement="top">
                  <Box as="button" className={cn(styles.secondaryActionButton, styles.deleteIconButton)} aria-label="카드 삭제" onClick={handleDelete}>
                    <Trash2 size={16} />
                  </Box>
                </AppTooltip>
              </>
            )}
          </Box>
        </SkeletonWrapper>
        <Collapse open={isCoverFormOpen}>
          <CoverImageForm
            groupId={groupId}
            cardId={card.id}
            hasCoverImage={Boolean(card.coverImageUrl)}
            onSubmit={(input) => onUpdateCoverImage(card.id, input)}
            onClose={() => setIsCoverFormOpen(false)}
          />
        </Collapse>
        <Box className={styles.records}>
          {recordsQuery.isPending ? (
            <ContentSkeleton />
          ) : recordsQuery.isError && !recordsQuery.data ? (
            <Box className={styles.recordsFooter} role="alert">
              <Text>기록을 불러오지 못했습니다.</Text>
              <button type="button" className={styles.moreRecords} onClick={() => { void recordsQuery.refetch(); }}>다시 시도</button>
            </Box>
          ) : records.length === 0 ? (
            <Text className={styles.noRecords}>기록이 없습니다</Text>
          ) : (
            records.map((record) => (
              <RecordItem
                key={record.id}
                groupId={groupId}
                cardId={card.id}
                record={record}
                disabled={isContentLocked}
                canArchive={!isGroupEnded && !isGroupStopped}
                isPortfolioPublished={isPortfolioPublished}
                onToggleDeleted={handleToggleRecordDeleted}
                onEdit={() => onOpenEditRecord(String(record.id))}
                onOpenCard={onOpenCard}
                highlighted={String(record.id) === highlightedRecordId}
                onHighlightEnd={() => setHighlightedRecordId(null)}
              />
            ))
          )}
          {/* 다음 기록이 남아 있으면 끝에 스켈레톤을 늘 두고, 이 스켈레톤이 보이면 이어서 불러온다. */}
          {recordsQuery.hasNextPage && !recordsQuery.isFetchNextPageError && (
            <div ref={recordsSentinelRef} aria-busy={recordsQuery.isFetchingNextPage}>
              <ContentSkeleton />
            </div>
          )}
          {recordsQuery.isFetchNextPageError && (
            <Text className={styles.noRecords} role="alert">다음 기록을 불러오지 못했습니다. 다시 시도를 눌러 주세요.</Text>
          )}
          {recordsQuery.data && (recordsQuery.isFetchNextPageError || (!recordsQuery.hasNextPage && records.length > 0)) && (
            <Box className={styles.recordsFooter}>
              {recordsQuery.isFetchNextPageError ? (
                <button
                  type="button"
                  className={styles.moreRecords}
                  disabled={recordsQuery.isFetching}
                  onClick={() => { if (!recordsQuery.isFetching) void recordsQuery.fetchNextPage(); }}
                >
                  - 다시 시도 -
                </button>
              ) : (
                <Text className={styles.lastRecord}>- 마지막 기록입니다 -</Text>
              )}
            </Box>
          )}
        </Box>
      </Box>
      </VerticalScrollBox>
    </Window>
  );
}
