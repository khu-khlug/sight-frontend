import { Box, Popover, Portal, ScrollArea, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRightLeft } from "lucide-react";
import { useState } from "react";

import { KanbanApi } from "../../../../../api/public/group/KanbanApi";
import HoverScrollbar from "../../../../../components/HoverScrollbar";
import styles from "./style.module.css";

type Props = {
  groupId: number;
  cardId: string;
  disabled: boolean;
  onMove: (targetCardId: string) => void;
};

export default function RecordMoveMenu({ groupId, cardId, disabled, onMove }: Props) {
  const [open, setOpen] = useState(false);
  const query = useQuery({
    queryKey: ["group-detail", groupId, "kanban"],
    queryFn: () => KanbanApi.listGroupLists(groupId),
    enabled: open,
  });
  const lists = (query.data ?? []).map((list) => ({
    ...list, cards: list.cards.filter((card) => card.id !== cardId && !card.disabled),
  })).filter((list) => list.cards.length > 0);

  return (
    <Popover.Root open={open} onOpenChange={(details) => setOpen(details.open)} lazyMount unmountOnExit
      positioning={{ placement: "bottom-end" }}>
      <Popover.Trigger asChild>
        <button type="button" className={styles.actionButton} aria-label="다른 카드로 이동" disabled={disabled}>
          <ArrowRightLeft size={16} />
        </button>
      </Popover.Trigger>
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
              : lists.length === 0 ? <Text p={2} fontSize="sm">이동할 카드가 없습니다.</Text>
              : lists.map((list) => (
                <section key={list.id} className={styles.moveList} aria-label={list.title}>
                  <div className={styles.moveListTitle}>{list.title}</div>
                  {list.cards.map((card) => (
                    <button key={card.id} type="button" className={styles.moveCard} disabled={disabled}
                      onClick={() => {
                        setOpen(false);
                        if (window.confirm(`이 기록을 “${list.title} / ${card.title}” 카드로 이동하시겠습니까?`)) onMove(card.id);
                      }}>{card.title}</button>
                  ))}
                </section>
              ))}
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
