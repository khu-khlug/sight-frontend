import { CSSProperties, FormEvent, memo, PointerEvent as ReactPointerEvent, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ScrollArea } from "@chakra-ui/react";
import { Plus } from "lucide-react";

import Container from "../../../../components/Container";
import Card from "../Card";
import { isCardDimmed, LABEL_FILTER_KEYS } from "../label";
import { BoardList, DraggedListContent } from "./BoardList";
import type { Props } from "./types";
export type { CardListData } from "./types";
import styles from "./style.module.css";

type DragSession = {
  id: string;
  originIndex: number;
  targetIndex: number;
  pointerId: number;
  mode: "drag" | "picked";
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
};

type PendingPointer = Omit<DragSession, "targetIndex" | "mode">;

type CardDragSession = {
  cardId: string;
  sourceListId: string;
  sourceIndex: number;
  targetListId: string;
  targetIndex: number;
  pointerId: number;
  mode: "drag" | "picked";
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
};

type PendingCardPointer = Omit<CardDragSession, "targetListId" | "targetIndex" | "mode">;

const LIST_WIDTH = 232;
const LIST_GAP = 10;
const DEFAULT_ENABLED_FILTERS = new Set(LABEL_FILTER_KEYS);
// 창에 가려진 칸반 영역이 실제 창 폭만큼만 스크롤되면 경계선이 딱 맞아 보여 살짝 더 여유를 둔다.
const WINDOW_COVER_EXTRA_SCROLL = 40;

// 카드 창을 좌우로 전환할 때처럼, 이 폭 넓은 보드와 무관한 상위 상태(GroupDetailContainer의
// mainCardId)만 바뀌어도 부모가 리렌더된다 — memo로 감싸서 실제로 전달받는 props가
// 안 바뀌면(핸들러는 전부 useGroupAction의 안정적인 mutate에 물린 useCallback) 이 무거운
// 보드 전체가 같이 리렌더(깜빡임)되지 않게 막는다.
const KanbanBoard = memo(function KanbanBoard({ lists, isMovePending, isPortfolioPublished, dashboardOverlayRef, dashboardExtraWidthPx, enabledFilters = DEFAULT_ENABLED_FILTERS, windowCoverage = null, onMinimizedHoverRequest, onScrollbarGrabbedChange, onAddCard, onAddList, onDeleteList, onMoveList, onMoveCard, onToggleCardPortfolio, onCardClick, onUpdateList }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const addListFormRef = useRef<HTMLFormElement>(null);
  const pendingPointerRef = useRef<PendingPointer | null>(null);
  const dragRef = useRef<DragSession | null>(null);
  const pendingCardPointerRef = useRef<PendingCardPointer | null>(null);
  const cardDragRef = useRef<CardDragSession | null>(null);
  const listPreviewRef = useRef<HTMLDivElement>(null);
  const cardPreviewRef = useRef<HTMLDivElement>(null);
  const cardMoveFrameRef = useRef<number | null>(null);
  const pendingCardCoordinatesRef = useRef<{ x: number; y: number } | null>(null);
  const listMoveFrameRef = useRef<number | null>(null);
  const pendingListCoordinatesRef = useRef<{ x: number; y: number } | null>(null);
  const suppressClickRef = useRef(false);
  const placedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleFrameRef = useRef<number | null>(null);
  const placedCardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [listTitle, setListTitle] = useState("");
  const [deletingListIds, setDeletingListIds] = useState<Set<string>>(() => new Set());
  const [drag, setDrag] = useState<DragSession | null>(null);
  const [cardDrag, setCardDrag] = useState<CardDragSession | null>(null);
  const [placedCardId, setPlacedCardId] = useState<string | null>(null);
  const [placedListId, setPlacedListId] = useState<string | null>(null);
  const [isSettling, setIsSettling] = useState(false);

  // 대시보드의 왼쪽 패딩이나 .coverSpacer 폭이 바뀌면 그만큼 scrollLeft를 같이 보정한다 —
  // 안 그러면 스크롤 위치(scrollLeft)는 그대로인데 콘텐츠 앞에 빈 공간만 늘어나/줄어들어서,
  // 양 끝이 아닌 곳을 보고 있던 사용자 눈엔 지금 보이던 리스트들이 옆으로 밀려 보인다.
  // (오른쪽은 끝에 공간을 더하는 것뿐이라 기존 콘텐츠를 안 밀어서 이 보정이 필요 없다.)
  const leftCoverSpacerWidth = windowCoverage?.side === "left" ? windowCoverage.widthPx + WINDOW_COVER_EXTRA_SCROLL : 0;
  // spacer는 {leftCoverSpacerWidth > 0 && ...}로 아예 있다/없다가 갈리는 조건부 렌더링이라,
  // "없음(0)" 쪽은 flex gap도 전혀 안 붙는다 — spacer 자신의 폭만 비교하면 "없음→있음"
  // 전환 순간에 새로 붙는 gap(LIST_GAP)만큼 보정이 모자라서 약간 어긋난다. gap까지 포함한
  // "실제로 차지하는 폭"을 비교 기준으로 쓴다.
  const leftCoverSpacerSpace = leftCoverSpacerWidth > 0 ? leftCoverSpacerWidth + LIST_GAP : 0;
  const leftSpace = dashboardExtraWidthPx + leftCoverSpacerSpace;
  const prevLeftSpaceRef = useRef(leftSpace);
  // useEffect(페인트 이후 실행)로 두면, spacer 폭은 이미 반영됐는데 scrollLeft는 아직 안
  // 바뀐 프레임이 브라우저에 실제로 한 번 그려진다 — 콘텐츠가 밀렸다가 다음 프레임에 제자리로
  // "돌아오는" 깜빡임의 원인이었다. useLayoutEffect(페인트 이전 실행)로 같은 커밋 안에서
  // scrollLeft까지 맞춘 뒤에 그려야 그 프레임 자체가 생기지 않는다.
  useLayoutEffect(() => {
    const delta = leftSpace - prevLeftSpaceRef.current;
    prevLeftSpaceRef.current = leftSpace;
    const viewport = viewportRef.current;
    if (delta === 0 || !viewport) return;
    // 스크롤이 이미 양 끝 중 한쪽이면 보정하지 않는다 — 양 끝에서는 콘텐츠가 밀리는 바로 그
    // 효과가 "창에 가려졌던 리스트를 드러낸다"는 spacer 본연의 목적이다(보정해버리면 가려진
    // 리스트가 다시 안 보이게 된다). 중간 어딘가를 보고 있을 때만 "보던 자리 유지"가 맞다.
    const isAtStart = viewport.scrollLeft <= 0;
    const isAtEnd = viewport.scrollLeft >= viewport.scrollWidth - viewport.clientWidth - 1;
    if (isAtStart || isAtEnd) return;
    viewport.scrollLeft += delta;
  }, [leftSpace]);

  const setDragSession = useCallback((next: DragSession | null) => {
    dragRef.current = next;
    setDrag(next);
  }, []);

  const setCardDragSession = useCallback((next: CardDragSession | null) => {
    cardDragRef.current = next;
    setCardDrag(next);
  }, []);

  const moveListPreview = useCallback((next: DragSession) => {
    const previous = dragRef.current;
    dragRef.current = next;
    if (listPreviewRef.current) {
      listPreviewRef.current.style.left = `${next.x - next.offsetX}px`;
      listPreviewRef.current.style.top = `${next.y - next.offsetY}px`;
    }
    if (previous?.targetIndex !== next.targetIndex) setDrag(next);
  }, []);

  const moveCardPreview = useCallback((next: CardDragSession) => {
    const previous = cardDragRef.current;
    cardDragRef.current = next;
    if (cardPreviewRef.current) {
      cardPreviewRef.current.style.left = `${next.x - next.offsetX}px`;
      cardPreviewRef.current.style.top = `${next.y - next.offsetY}px`;
    }
    if (previous?.targetListId !== next.targetListId || previous?.targetIndex !== next.targetIndex) setCardDrag(next);
  }, []);

  const getCardTarget = useCallback((clientX: number, clientY: number, movingCardId: string) => {
    const listElements = Array.from(contentRef.current?.querySelectorAll<HTMLElement>("[data-kanban-list-id]") ?? []);
    const nearestList = listElements.reduce<HTMLElement | null>((nearest, candidate) => {
      if (!nearest) return candidate;
      const candidateRect = candidate.getBoundingClientRect();
      const nearestRect = nearest.getBoundingClientRect();
      const candidateDistance = Math.abs(clientX - (candidateRect.left + candidateRect.right) / 2);
      const nearestDistance = Math.abs(clientX - (nearestRect.left + nearestRect.right) / 2);
      return candidateDistance < nearestDistance ? candidate : nearest;
    }, null);
    if (!nearestList?.dataset.kanbanListId) return null;

    const cardList = nearestList.querySelector<HTMLElement>("[data-kanban-card-items]");
    if (!cardList) return { listId: nearestList.dataset.kanbanListId, index: 0 };

    const listTop = cardList.getBoundingClientRect().top;
    const cardElements = Array.from(cardList.querySelectorAll<HTMLElement>("[data-card-id]"))
      .filter((element) => element.dataset.cardId !== movingCardId);
    // offsetTop은 카드의 이동 애니메이션을 반영하지 않아 드롭 위치가 왕복하지 않는다.
    const index = cardElements.filter((element) => clientY > listTop + element.offsetTop + element.offsetHeight / 2).length;
    return { listId: nearestList.dataset.kanbanListId, index };
  }, []);

  const flushCardMove = useCallback(() => {
    if (cardMoveFrameRef.current !== null) {
      cancelAnimationFrame(cardMoveFrameRef.current);
      cardMoveFrameRef.current = null;
    }
    const coordinates = pendingCardCoordinatesRef.current;
    pendingCardCoordinatesRef.current = null;
    const current = cardDragRef.current;
    if (!coordinates || !current) return;
    const target = getCardTarget(coordinates.x, coordinates.y, current.cardId);
    moveCardPreview({
      ...current,
      x: coordinates.x,
      y: coordinates.y,
      targetListId: target?.listId ?? current.targetListId,
      targetIndex: target?.index ?? current.targetIndex,
    });
  }, [getCardTarget, moveCardPreview]);

  const scheduleCardMove = useCallback((x: number, y: number) => {
    pendingCardCoordinatesRef.current = { x, y };
    if (cardMoveFrameRef.current === null) cardMoveFrameRef.current = requestAnimationFrame(flushCardMove);
  }, [flushCardMove]);

  const finishCardDrag = useCallback(() => {
    const current = cardDragRef.current;
    if (!current) return;
    onMoveCard(current.sourceListId, current.cardId, current.targetListId, current.targetIndex);
    setCardDragSession(null);
    setPlacedCardId(current.cardId);
    if (placedCardTimerRef.current !== null) clearTimeout(placedCardTimerRef.current);
    placedCardTimerRef.current = setTimeout(() => setPlacedCardId(null), 220);
  }, [onMoveCard, setCardDragSession]);

  const handleCardHandlePointerDown = useCallback((event: ReactPointerEvent<HTMLButtonElement>, listId: string, cardId: string, cardIndex: number) => {
    if (isMovePending || event.button !== 0 || dragRef.current || cardDragRef.current) return;
    const rect = event.currentTarget.closest("[data-card-id]")?.getBoundingClientRect();
    if (!rect) return;
    event.preventDefault();
    event.stopPropagation();
    pendingCardPointerRef.current = {
      cardId,
      sourceListId: listId,
      sourceIndex: cardIndex,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    };
  }, [isMovePending]);

  const handleCardHandleKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>, listId: string, cardId: string, cardIndex: number) => {
    if (isMovePending || event.repeat || dragRef.current || cardDragRef.current || (event.key !== "Enter" && event.key !== " ")) return;
    const rect = event.currentTarget.closest("[data-card-id]")?.getBoundingClientRect();
    if (!rect) return;
    event.preventDefault();
    event.stopPropagation();
    setCardDragSession({
      cardId,
      sourceListId: listId,
      sourceIndex: cardIndex,
      targetListId: listId,
      targetIndex: cardIndex,
      pointerId: -1,
      mode: "picked",
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      offsetX: rect.width / 2,
      offsetY: rect.height / 2,
      width: rect.width,
      height: rect.height,
    });
  }, [isMovePending, setCardDragSession]);

  const getTargetIndex = useCallback((clientX: number) => {
    const content = contentRef.current;
    if (!content || lists.length === 0) return 0;
    // 왼쪽에 .coverSpacer가 있으면 첫 리스트가 그 폭(+gap)만큼 더 밀려서 시작한다.
    const firstCenter = content.getBoundingClientRect().left
      + parseFloat(window.getComputedStyle(content).paddingLeft) + leftCoverSpacerSpace + LIST_WIDTH / 2;
    return Math.max(0, Math.min(lists.length - 1, Math.round((clientX - firstCenter) / (LIST_WIDTH + LIST_GAP))));
  }, [lists.length, leftCoverSpacerSpace]);

  const flushListMove = useCallback(() => {
    if (listMoveFrameRef.current !== null) {
      cancelAnimationFrame(listMoveFrameRef.current);
      listMoveFrameRef.current = null;
    }
    const coordinates = pendingListCoordinatesRef.current;
    pendingListCoordinatesRef.current = null;
    const current = dragRef.current;
    if (!coordinates || !current) return;
    moveListPreview({
      ...current,
      x: coordinates.x,
      y: coordinates.y,
      targetIndex: getTargetIndex(coordinates.x),
    });
  }, [getTargetIndex, moveListPreview]);

  const scheduleListMove = useCallback((x: number, y: number) => {
    pendingListCoordinatesRef.current = { x, y };
    if (listMoveFrameRef.current === null) listMoveFrameRef.current = requestAnimationFrame(flushListMove);
  }, [flushListMove]);

  const finishDrag = useCallback(() => {
    const current = dragRef.current;
    if (!current) return;

    setIsSettling(true);
    onMoveList(current.id, current.targetIndex);
    setDragSession(null);
    setPlacedListId(current.id);
    if (placedTimerRef.current !== null) clearTimeout(placedTimerRef.current);
    placedTimerRef.current = setTimeout(() => setPlacedListId(null), 240);
    if (settleFrameRef.current !== null) cancelAnimationFrame(settleFrameRef.current);
    settleFrameRef.current = requestAnimationFrame(() => {
      settleFrameRef.current = requestAnimationFrame(() => setIsSettling(false));
    });
  }, [onMoveList, setDragSession]);

  const handleHandlePointerDown = useCallback((event: ReactPointerEvent<HTMLButtonElement>, id: string, index: number) => {
    if (isMovePending || event.button !== 0 || dragRef.current || cardDragRef.current) return;
    event.preventDefault();
    const rect = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!rect) return;
    pendingPointerRef.current = {
      id,
      originIndex: index,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
  }, [isMovePending]);

  const handleHandleKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>, id: string, index: number) => {
    if (isMovePending || event.repeat || dragRef.current || cardDragRef.current || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!rect) return;
    setDragSession({
      id,
      originIndex: index,
      targetIndex: index,
      pointerId: -1,
      mode: "picked",
      x: rect.left + LIST_WIDTH / 2,
      y: rect.top + 14,
      offsetX: LIST_WIDTH / 2,
      offsetY: 14,
    });
  }, [isMovePending, setDragSession]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const pending = pendingPointerRef.current;
      const current = dragRef.current;
      if (pending && pending.pointerId === event.pointerId && !current) {
        if (Math.hypot(event.clientX - pending.x, event.clientY - pending.y) < 5) return;
        setDragSession({ ...pending, mode: "drag", targetIndex: getTargetIndex(event.clientX), x: event.clientX, y: event.clientY });
        event.preventDefault();
        return;
      }
      if (!current || (current.mode === "drag" && current.pointerId !== event.pointerId)) return;
      if (current.mode === "drag") event.preventDefault();
      scheduleListMove(event.clientX, event.clientY);
    };

    const handlePointerUp = (event: PointerEvent) => {
      const pending = pendingPointerRef.current;
      if (!pending || pending.pointerId !== event.pointerId) return;
      pendingPointerRef.current = null;
      if (dragRef.current?.mode === "drag") {
        pendingListCoordinatesRef.current = { x: event.clientX, y: event.clientY };
        flushListMove();
        finishDrag();
      } else {
        setDragSession({ ...pending, mode: "picked", targetIndex: pending.originIndex });
      }
    };

    const handlePointerCancel = (event: PointerEvent) => {
      if (pendingPointerRef.current?.pointerId !== event.pointerId) return;
      pendingPointerRef.current = null;
      if (listMoveFrameRef.current !== null) cancelAnimationFrame(listMoveFrameRef.current);
      listMoveFrameRef.current = null;
      pendingListCoordinatesRef.current = null;
      setDragSession(null);
    };

    const handlePickedClick = (event: PointerEvent) => {
      if (dragRef.current?.mode !== "picked") return;
      const viewport = viewportRef.current;
      const rect = viewport?.getBoundingClientRect();
      if (!rect || event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
        setDragSession(null);
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      suppressClickRef.current = true;
      setDragSession({ ...dragRef.current, x: event.clientX, y: event.clientY, targetIndex: getTargetIndex(event.clientX) });
      finishDrag();
    };

    const handleClick = (event: MouseEvent) => {
      if (!suppressClickRef.current) return;
      suppressClickRef.current = false;
      event.preventDefault();
      event.stopPropagation();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const current = dragRef.current;
      if (!current) return;
      if (event.repeat && (event.key === "Enter" || event.key === " ")) return;
      if (event.key === "Escape") {
        event.preventDefault();
        pendingPointerRef.current = null;
        setDragSession(null);
      } else if (current.mode === "picked" && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
        event.preventDefault();
        const step = event.key === "ArrowLeft" ? -1 : 1;
        setDragSession({ ...current, targetIndex: Math.max(0, Math.min(lists.length - 1, current.targetIndex + step)) });
      } else if (current.mode === "picked" && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        finishDrag();
      }
    };

    document.addEventListener("pointermove", handlePointerMove, { passive: false });
    document.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("pointercancel", handlePointerCancel);
    document.addEventListener("pointerdown", handlePickedClick, true);
    document.addEventListener("click", handleClick, true);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointercancel", handlePointerCancel);
      document.removeEventListener("pointerdown", handlePickedClick, true);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [finishDrag, flushListMove, getTargetIndex, lists.length, scheduleListMove, setDragSession]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const pending = pendingCardPointerRef.current;
      const current = cardDragRef.current;
      if (pending && pending.pointerId === event.pointerId && !current) {
        if (Math.hypot(event.clientX - pending.x, event.clientY - pending.y) < 5) return;
        const target = getCardTarget(event.clientX, event.clientY, pending.cardId);
        setCardDragSession({
          ...pending,
          mode: "drag",
          targetListId: target?.listId ?? pending.sourceListId,
          targetIndex: target?.index ?? pending.sourceIndex,
          x: event.clientX,
          y: event.clientY,
        });
        event.preventDefault();
        return;
      }
      if (!current || (current.mode === "drag" && current.pointerId !== event.pointerId)) return;
      if (current.mode === "drag") event.preventDefault();
      scheduleCardMove(event.clientX, event.clientY);
    };

    const handlePointerUp = (event: PointerEvent) => {
      const pending = pendingCardPointerRef.current;
      if (!pending || pending.pointerId !== event.pointerId) return;
      pendingCardPointerRef.current = null;
      if (cardDragRef.current?.mode === "drag") {
        pendingCardCoordinatesRef.current = { x: event.clientX, y: event.clientY };
        flushCardMove();
        finishCardDrag();
      } else {
        setCardDragSession({ ...pending, mode: "picked", targetListId: pending.sourceListId, targetIndex: pending.sourceIndex });
      }
    };

    const handlePointerCancel = (event: PointerEvent) => {
      if (pendingCardPointerRef.current?.pointerId !== event.pointerId) return;
      pendingCardPointerRef.current = null;
      if (cardMoveFrameRef.current !== null) cancelAnimationFrame(cardMoveFrameRef.current);
      cardMoveFrameRef.current = null;
      pendingCardCoordinatesRef.current = null;
      setCardDragSession(null);
    };

    const handlePickedClick = (event: PointerEvent) => {
      const current = cardDragRef.current;
      if (current?.mode !== "picked") return;
      const rect = viewportRef.current?.getBoundingClientRect();
      if (!rect || event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
        setCardDragSession(null);
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      suppressClickRef.current = true;
      const target = getCardTarget(event.clientX, event.clientY, current.cardId);
      setCardDragSession({
        ...current,
        x: event.clientX,
        y: event.clientY,
        targetListId: target?.listId ?? current.targetListId,
        targetIndex: target?.index ?? current.targetIndex,
      });
      finishCardDrag();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const current = cardDragRef.current;
      if (!current) return;
      if (event.key === "Escape") {
        event.preventDefault();
        pendingCardPointerRef.current = null;
        setCardDragSession(null);
      } else if (current.mode === "picked" && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
        event.preventDefault();
        const currentListIndex = lists.findIndex((list) => list.id === current.targetListId);
        const nextList = lists[Math.max(0, Math.min(lists.length - 1, currentListIndex + (event.key === "ArrowLeft" ? -1 : 1)))];
        if (nextList) {
          const maxIndex = nextList.cards.length - (nextList.id === current.sourceListId ? 1 : 0);
          setCardDragSession({ ...current, targetListId: nextList.id, targetIndex: Math.min(current.targetIndex, maxIndex) });
        }
      } else if (current.mode === "picked" && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
        event.preventDefault();
        const targetList = lists.find((list) => list.id === current.targetListId);
        const maxIndex = (targetList?.cards.length ?? 0) - (current.targetListId === current.sourceListId ? 1 : 0);
        const step = event.key === "ArrowUp" ? -1 : 1;
        setCardDragSession({ ...current, targetIndex: Math.max(0, Math.min(maxIndex, current.targetIndex + step)) });
      } else if (current.mode === "picked" && (event.key === "Enter" || event.key === " ") && !event.repeat) {
        event.preventDefault();
        finishCardDrag();
      }
    };

    document.addEventListener("pointermove", handlePointerMove, { passive: false });
    document.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("pointercancel", handlePointerCancel);
    document.addEventListener("pointerdown", handlePickedClick, true);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointercancel", handlePointerCancel);
      document.removeEventListener("pointerdown", handlePickedClick, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [finishCardDrag, flushCardMove, getCardTarget, lists, scheduleCardMove, setCardDragSession]);

  useEffect(() => () => {
    if (placedTimerRef.current !== null) clearTimeout(placedTimerRef.current);
    if (placedCardTimerRef.current !== null) clearTimeout(placedCardTimerRef.current);
    if (settleFrameRef.current !== null) cancelAnimationFrame(settleFrameRef.current);
    if (cardMoveFrameRef.current !== null) cancelAnimationFrame(cardMoveFrameRef.current);
    if (listMoveFrameRef.current !== null) cancelAnimationFrame(listMoveFrameRef.current);
  }, []);

  const isDragging = drag !== null || cardDrag !== null;
  useEffect(() => {
    if (!isDragging) return;
    let frame: number;

    const scrollNearEdge = () => {
      const currentList = dragRef.current;
      const currentCard = cardDragRef.current;
      const current = currentList ?? currentCard;
      const viewport = viewportRef.current;
      if (current && viewport && viewport.scrollWidth > viewport.clientWidth) {
        const rect = viewport.getBoundingClientRect();
        const visibleLeft = Math.max(rect.left, dashboardOverlayRef.current?.getBoundingClientRect().right ?? rect.left);
        const edge = 48;
        const direction = current.x > rect.right - edge && current.x <= rect.right + edge ? 1
          : current.x < visibleLeft + edge && current.x >= rect.left ? -1 : 0;
        if (direction) {
          const before = viewport.scrollLeft;
          viewport.scrollLeft += direction * 12;
          if (viewport.scrollLeft !== before) {
            if (currentList) {
              const targetIndex = getTargetIndex(currentList.x);
              if (targetIndex !== currentList.targetIndex) setDragSession({ ...currentList, targetIndex });
            } else if (currentCard) {
              const target = getCardTarget(currentCard.x, currentCard.y, currentCard.cardId);
              if (target && (target.listId !== currentCard.targetListId || target.index !== currentCard.targetIndex)) {
                setCardDragSession({ ...currentCard, targetListId: target.listId, targetIndex: target.index });
              }
            }
          }
        }
      }
      frame = requestAnimationFrame(scrollNearEdge);
    };

    frame = requestAnimationFrame(scrollNearEdge);
    return () => cancelAnimationFrame(frame);
  }, [dashboardOverlayRef, getCardTarget, getTargetIndex, isDragging, setCardDragSession, setDragSession]);

  const markListDeleting = useCallback((id: string) => {
    setDeletingListIds((current) => new Set(current).add(id));
  }, []);

  const finishDeletingList = useCallback(async (id: string) => {
    try {
      await onDeleteList(id);
    } finally {
      setDeletingListIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  }, [onDeleteList]);

  useEffect(() => {
    if (!listTitle) return;

    const cancelListAddOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !addListFormRef.current?.contains(event.target)) {
        setListTitle("");
      }
    };

    document.addEventListener("pointerdown", cancelListAddOnOutsideClick);
    return () => document.removeEventListener("pointerdown", cancelListAddOnOutsideClick);
  }, [listTitle]);

  const handleAddList = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = listTitle.trim();
    if (!trimmedTitle) return;
    onAddList(trimmedTitle);
    setListTitle("");
  };

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey || !(event.target instanceof Element)) return;
      if (event.target.closest("input, textarea, select")) return;
      const cardArea = event.target.closest<HTMLElement>("[data-kanban-card-scroll-area]");
      const cardViewport = cardArea?.querySelector<HTMLElement>("[data-kanban-card-list]");
      if (cardViewport && cardViewport.scrollHeight > cardViewport.clientHeight + 1) return;
      if (event.target.closest("button") && !cardArea && !event.target.closest("[data-kanban-header]")) return;
      if (viewport.scrollWidth <= viewport.clientWidth || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

      const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? viewport.clientWidth : 1;
      viewport.scrollLeft += event.deltaY * unit;
      event.preventDefault();
    };

    viewport.addEventListener("wheel", handleWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", handleWheel);
  }, []);

  // 내려간 카드 창이 이 가로 스크롤바 트랙과 같은 자리를 차지하면 스크롤바가 창에 가려
  // 네이티브 :hover를 못 받는다 — 그래서 좌표를 직접 비교해서 겹칠 때만 scrollbar에
  // data-force-visible을 찍는다. "커서 아래 hit-test된 요소가 헤더인가"(event.target 기준)로
  // 내려간 헤더 위인지를 판정하면 안 된다 — 스크롤바가 뜨자마자 z-index로 헤더보다 위로
  // 올라와서, 바로 다음 pointermove에서는 hit-test 대상 자체가 스크롤바로 바뀌어 "헤더 위가
  // 아님"으로 뒤집히고, 그러면 다시 꺼졌다 켜졌다를 매 프레임 반복한다(자기 판정 근거를 자기가
  // 가리는 셈). 대신 "내려간 창이 하나라도 있는가"는 hit-test와 무관한 사실이고, 그 상태에서
  // 커서가 스크롤바의 실제 좌표 안에 있다는 것 자체가 이미 "내려간 헤더 위에서 스크롤바와
  // 겹친다"는 뜻이다(내려간 창이 없으면 애초에 스크롤바를 가릴 것도 없으니 보통 :hover로 충분).
  // 그 들뜨기는 직접 흉내 내지 않고(WindowLayer가 이미 liftMinimizedSlots라는 같은 로직을
  // 갖고 있으므로) WindowOpenRequest와 같은 패턴의 요청(MinimizedHoverRequest)만 던져
  // WindowLayer가 그 함수를 그대로 쓰게 한다(GroupDetailContainer가
  // WindowLayerHandle.requestMinimizedHover로 중계).
  const wasOverScrollbarRef = useRef(false);
  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const scrollbar = scrollbarRef.current;
      if (!scrollbar) return;
      const hasMinimizedWindow = document.querySelector(".js-window-minimized") !== null;
      const rect = scrollbar.getBoundingClientRect();
      const isOverScrollbar = hasMinimizedWindow
        && event.clientX >= rect.left && event.clientX <= rect.right
        && event.clientY >= rect.top && event.clientY <= rect.bottom;
      if (isOverScrollbar) scrollbar.dataset.forceVisible = "true";
      else delete scrollbar.dataset.forceVisible;
      if (isOverScrollbar !== wasOverScrollbarRef.current) {
        wasOverScrollbarRef.current = isOverScrollbar;
        onMinimizedHoverRequest?.({ hovering: isOverScrollbar });
      }
    };

    document.addEventListener("pointermove", handlePointerMove);
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      delete scrollbarRef.current?.dataset.forceVisible;
      if (wasOverScrollbarRef.current) {
        wasOverScrollbarRef.current = false;
        onMinimizedHoverRequest?.({ hovering: false });
      }
    };
  }, [onMinimizedHoverRequest]);

  // 스크롤바 썸을 드래그로 잡고 있는 동안(zag-js가 드래그 시작~끝 사이에 data-scrolling
  // 속성을 붙였다 뗀다)도 독립된 호버 소스로 등록한다 — 드래그 중 포인터가 트랙 바깥으로
  // 잠깐 나가도(포인터 캡처라 스크롤 자체는 계속됨) 좌표 기반 판정과 무관하게 계속 들떠
  // 있어야 한다.
  useEffect(() => {
    const scrollbar = scrollbarRef.current;
    if (!scrollbar) return;
    const notifyGrabbed = () => onScrollbarGrabbedChange?.(scrollbar.hasAttribute("data-scrolling"));
    const observer = new MutationObserver(notifyGrabbed);
    observer.observe(scrollbar, { attributes: true, attributeFilter: ["data-scrolling"] });
    return () => {
      observer.disconnect();
      onScrollbarGrabbedChange?.(false);
    };
  }, [onScrollbarGrabbedChange]);

  const draggedList = drag ? lists.find((list) => list.id === drag.id) : null;
  const draggedCard = cardDrag ? lists.find((list) => list.id === cardDrag.sourceListId)?.cards.find((card) => card.id === cardDrag.cardId) : null;
  const getListOffset = (index: number) => {
    if (!drag) return 0;
    if (index === drag.originIndex) return (drag.targetIndex - index) * (LIST_WIDTH + LIST_GAP);
    if (drag.originIndex < drag.targetIndex && index > drag.originIndex && index <= drag.targetIndex) {
      return -(LIST_WIDTH + LIST_GAP);
    }
    if (drag.originIndex > drag.targetIndex && index >= drag.targetIndex && index < drag.originIndex) {
      return LIST_WIDTH + LIST_GAP;
    }
    return 0;
  };

  return (
    <Container className={styles.box}>
      <ScrollArea.Root flex="1" minH="0" h="auto">
        <ScrollArea.Viewport ref={viewportRef} flex="1" minH="0" h="100%" style={{ overflowY: "hidden" }}>
          <ScrollArea.Content
            flex="1"
            display="flex"
            alignItems="stretch"
            gap="10px"
            h="100%"
            minH="0"
            w="max-content"
            ref={contentRef}
            className={`${styles.content} ${isSettling ? styles.settling : ""}`}
          >
            {leftCoverSpacerWidth > 0 && (
              <div className={styles.coverSpacer} style={{ width: leftCoverSpacerWidth }} aria-hidden="true" />
            )}
            {lists.map((list, index) => (
              <BoardList
                key={list.id}
                list={list}
                index={index}
                offset={getListOffset(index)}
                isListDragActive={drag !== null}
                isDraggedList={drag?.id === list.id}
                isNew={list.id.startsWith("local-list-")}
                isDeleting={deletingListIds.has(list.id)}
                isPlaced={placedListId === list.id}
                sourceCardId={cardDrag?.sourceListId === list.id ? cardDrag.cardId : undefined}
                dropIndex={cardDrag?.targetListId === list.id ? cardDrag.targetIndex : undefined}
                dropHeight={cardDrag?.targetListId === list.id ? cardDrag.height : undefined}
                placedCardId={placedCardId && list.cards.some((card) => card.id === placedCardId) ? placedCardId : undefined}
                isPortfolioPublished={isPortfolioPublished}
                enabledFilters={enabledFilters}
                onAddCard={onAddCard}
                onDeleteStart={markListDeleting}
                onDeleteList={finishDeletingList}
                onToggleCardPortfolio={onToggleCardPortfolio}
                onCardClick={onCardClick}
                onUpdateList={onUpdateList}
                onListHandlePointerDown={handleHandlePointerDown}
                onListHandleKeyDown={handleHandleKeyDown}
                onCardHandlePointerDown={handleCardHandlePointerDown}
                onCardHandleKeyDown={handleCardHandleKeyDown}
              />
            ))}
            <form ref={addListFormRef} className={styles.addListForm} onSubmit={handleAddList}>
              <input
                className={styles.addListInput}
                type="text"
                aria-label="리스트 이름"
                value={listTitle}
                onChange={(event) => setListTitle(event.target.value)}
                placeholder="리스트 이름"
                required
              />
              <button className={styles.addListButton} type="submit" disabled={!listTitle.trim()}>
                <Plus size={16} aria-hidden="true" />
                리스트 생성
              </button>
            </form>
            {windowCoverage?.side === "right" && (
              <div className={styles.coverSpacer} style={{ width: windowCoverage.widthPx + WINDOW_COVER_EXTRA_SCROLL }} aria-hidden="true" />
            )}
          </ScrollArea.Content>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar ref={scrollbarRef} orientation="horizontal" className={styles.scrollbar} />
      </ScrollArea.Root>
      {drag && draggedList && createPortal(
        <div
          ref={listPreviewRef}
          className={styles.dragPreview}
          style={{ left: drag.x - drag.offsetX, top: drag.y - drag.offsetY } as CSSProperties}
          aria-hidden="true"
        >
          <div className={styles.previewHandle} />
          <DraggedListContent list={draggedList} isPortfolioPublished={isPortfolioPublished} enabledFilters={enabledFilters} />
        </div>,
        document.body,
      )}
      {cardDrag && draggedCard && createPortal(
        <div
          ref={cardPreviewRef}
          className={styles.cardDragPreview}
          style={{ left: cardDrag.x - cardDrag.offsetX, top: cardDrag.y - cardDrag.offsetY, width: cardDrag.width } as CSSProperties}
          aria-hidden="true"
        >
          <Card
            title={draggedCard.title}
            recordCount={draggedCard.recordCount}
            hasDescription={draggedCard.hasDescription}
            inPortfolio={draggedCard.portfolio}
            showPortfolioStatus={isPortfolioPublished}
            assigneeName={draggedCard.assigneeName}
            inheritedFrom={draggedCard.inheritedFrom}
            coverImageUrl={draggedCard.coverImageUrl}
            labels={draggedCard.labels}
            disabled={draggedCard.disabled}
            dimmed={isCardDimmed(draggedCard.labels ?? [], enabledFilters)}
            showDragHandle
          />
        </div>,
        document.body,
      )}
    </Container>
  );
});

export default KanbanBoard;
