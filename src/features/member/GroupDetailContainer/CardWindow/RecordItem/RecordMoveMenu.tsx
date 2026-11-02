import { Box, Popover, Portal, ScrollArea, Text } from "@chakra-ui/react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ArrowRightLeft } from "lucide-react";
import { useState } from "react";

import { KanbanApi, type KanbanListDto } from "../../../../../api/public/group/KanbanApi";
import AppTooltip from "../../../../../components/AppTooltip";
import HoverScrollbar from "../../../../../components/HoverScrollbar";
import { cn } from "../../../../../util/cn";
import styles from "./style.module.css";

type Props = {
  groupId: number;
  cardId: string;
  disabled: boolean;
  onMove: (targetCardId: string) => void;
};

// 리스트 하나의 이동 대상 카드. 리스트 응답에 든 처음 카드들로 시작하고, 더보기를 누르면 이어서 받는다.
function MoveTargetList({ groupId, list, cardId, disabled, onPick }: {
  groupId: number;
  list: KanbanListDto;
  cardId: string;
  disabled: boolean;
  onPick: (list: KanbanListDto, card: KanbanListDto["cards"][number]) => void;
}) {
  const [cards, setCards] = useState(list.cards);
  const [totalCount, setTotalCount] = useState(list.cardCount);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const hasMore = cards.length < totalCount;
  const targets = cards.filter((card) => card.id !== cardId && !card.isDisabled);
  if (targets.length === 0 && !hasMore) return null;

  const loadMore = () => {
    if (isLoading) return;
    setIsLoading(true);
    setIsError(false);
    KanbanApi.listGroupCards(groupId, list.id, cards.length)
      .then((page) => {
        setTotalCount(page.totalCount);
        setCards((previous) => [...previous, ...page.cards.filter((card) => !previous.some((item) => item.id === card.id))]);
      })
      .catch(() => setIsError(true))
      .finally(() => setIsLoading(false));
  };

  return (
    <section className={styles.moveList} aria-label={list.title}>
      <div className={styles.moveListTitle}>{list.title}</div>
      {targets.map((card) => (
        <button key={card.id} type="button" className={styles.moveCard} disabled={disabled} onClick={() => onPick(list, card)}>
          {card.title}
        </button>
      ))}
      {hasMore && (
        <button type="button" className={cn(styles.moveCard, styles.moveMore)} disabled={isLoading} onClick={loadMore}>
          {isLoading ? "불러오는 중…" : isError ? "다시 시도" : "카드 더보기"}
        </button>
      )}
    </section>
  );
}

/*
 * 이동 대상은 칸반 보드가 불러온 범위와 상관없이 메뉴가 따로 받는다. 보드와 같은 쿼리 키를 쓰면 메뉴의 첫 페이지
 * 조회가 보드가 펼친 범위를 덮어쓸 수 있어서, 메뉴 전용 키를 쓴다. 메뉴를 닫으면 받은 범위는 버린다.
 */
export default function RecordMoveMenu({ groupId, cardId, disabled, onMove }: Props) {
  const [open, setOpen] = useState(false);
  const query = useInfiniteQuery({
    queryKey: ["group-detail", groupId, "record-move-targets"],
    queryFn: ({ pageParam, signal }) => KanbanApi.listGroupLists(groupId, pageParam, signal),
    initialPageParam: 0,
    getNextPageParam: (last) => {
      const next = last.skip + last.receivedCount;
      return last.receivedCount > 0 && next < last.totalCount ? next : undefined;
    },
    enabled: open,
    gcTime: 0,
  });
  const lists = query.data?.pages.flatMap((page) => page.lists) ?? [];
  const hasTargets = lists.some((list) => list.cards.some((card) => card.id !== cardId && !card.isDisabled) || list.cards.length < list.cardCount);
  const handlePick = (list: KanbanListDto, card: KanbanListDto["cards"][number]) => {
    setOpen(false);
    if (window.confirm(`이 기록을 “${list.title} / ${card.title}” 카드로 이동하시겠습니까?`)) onMove(card.id);
  };

  return (
    <Popover.Root open={open} onOpenChange={(details) => setOpen(details.open)} lazyMount unmountOnExit
      positioning={{ placement: "bottom-end" }}>
      {/* 툴팁과 팝오버가 같은 요소를 트리거로 쓰면 서로의 속성이 겹치므로, 툴팁은 감싼 span에 둔다. */}
      <AppTooltip content="기록 이동" placement="top">
        <span className={styles.tooltipAnchor}>
          <Popover.Trigger asChild>
            <button type="button" className={styles.actionButton} aria-label="다른 카드로 이동" disabled={disabled}>
              <ArrowRightLeft size={16} />
            </button>
          </Popover.Trigger>
        </span>
      </AppTooltip>
      <Portal>
        <Popover.Positioner>
          <Popover.Content className={styles.moveMenu}>
            <Popover.Title className={styles.moveMenuTitle}>기록 이동</Popover.Title>
            <ScrollArea.Root size="sm" variant="hover">
              <ScrollArea.Viewport className={styles.moveViewport}>
                <ScrollArea.Content>
            {query.isPending ? <Text p={2} fontSize="sm">불러오는 중…</Text>
              : query.isError ? <Box p={2}><Text fontSize="sm">카드를 불러오지 못했습니다.</Text>
                <button type="button" onClick={() => { void query.refetch(); }}>다시 시도</button></Box>
              : !hasTargets && !query.hasNextPage ? <Text p={2} fontSize="sm">이동할 카드가 없습니다.</Text>
              : <>
                {lists.map((list) => (
                  <MoveTargetList key={list.id} groupId={groupId} list={list} cardId={cardId} disabled={disabled} onPick={handlePick} />
                ))}
                {query.hasNextPage && (
                  <button type="button" className={cn(styles.moveCard, styles.moveMore)} disabled={query.isFetchingNextPage}
                    onClick={() => { void query.fetchNextPage(); }}>
                    {query.isFetchingNextPage ? "불러오는 중…" : query.isFetchNextPageError ? "다시 시도" : "리스트 더보기"}
                  </button>
                )}
              </>}
                </ScrollArea.Content>
              </ScrollArea.Viewport>
              <HoverScrollbar orientation="vertical" />
            </ScrollArea.Root>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
