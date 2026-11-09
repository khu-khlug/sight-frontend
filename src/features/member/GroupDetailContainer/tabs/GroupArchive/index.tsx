import ContentSkeleton from "../../../../../components/ContentSkeleton";
import { AutosaveApi } from "../../../../../api/public/group/AutosaveApi";
import { GroupArchiveApi } from "../../../../../api/public/group/GroupArchiveApi";
import { KanbanApi } from "../../../../../api/public/group/KanbanApi";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useGroupAction } from "../../../../../hooks/group/useGroupAction";
import { Box, Button, createListCollection, Portal, ScrollArea, Select, Text } from "@chakra-ui/react";
import { ChevronDown, CreditCard, PenBox } from "lucide-react";
import { useRef, useState } from "react";

import Collapse from "../../../../../components/Collapse";
import HoverScrollbar from "../../../../../components/HoverScrollbar";
import RelativeDateTime from "../../../../../components/RelativeDateTime";
import { cn } from "../../../../../util/cn";
import { encodeDraftOpenHash } from "../../EditWindow/types";
import RecordViewer from "../../RecordViewer";
import { groupSavedRecords } from "../../savedRecords";
import { useGroupDetailPageState } from "../../pageState";
import styles from "./style.module.css";

type ListOption = { id: string; title: string };

type Props = {
  groupId: string;
  lists: ListOption[];
  canRestore: boolean;
  canViewDeletedCards: boolean;
  // 보관한 기록의 "더보기"는 그룹과 기록을 식별해 읽기 전용 창을 연다.
  onOpenRecord: (groupId: string, recordId: string) => void;
};

type ArchiveView = "cards" | "records";

/*
 * 삭제된 카드와 개인이 보관한 기록을 전환해 보여준다. 삭제된 카드를 선택하면 그 밑에
 * 복구 폼(리스트 선택 + 복구하기 버튼)이 펼쳐진다.
 */
export default function GroupArchive({ groupId, lists, canRestore, canViewDeletedCards, onOpenRecord }: Props) {
  const { pageState } = useGroupDetailPageState();
  const queryClient = useQueryClient();
  const cardsQuery = useInfiniteQuery({
    queryKey: ["group-detail", groupId, "archived-cards"],
    queryFn: ({ pageParam, signal }) => GroupArchiveApi.listDeletedGroupCardsPage(groupId, pageParam, signal),
    initialPageParam: 0,
    enabled: canViewDeletedCards,
    getNextPageParam: (last) => {
      const next = last.page + 1;
      return last.receivedCount > 0 && next * 20 < last.totalCount ? next : undefined;
    },
  });
  // 보관한 기록은 그룹에 관계없이 사용자 기준으로 10개씩 받는다.
  const recordsQuery = useInfiniteQuery({
    queryKey: ["saved-records-page"],
    queryFn: ({ pageParam, signal }) => GroupArchiveApi.listSavedRecordsPage(pageParam, signal),
    initialPageParam: 0,
    getNextPageParam: (last) => {
      const next = last.page + 1;
      return last.receivedCount > 0 && next * 10 < last.totalCount ? next : undefined;
    },
  });
  const autosaveQuery = useQuery({ queryKey: ["group-detail", groupId, "autosave-metadata"], queryFn: () => AutosaveApi.getMetadata(groupId), enabled: canViewDeletedCards });
  const cards = canViewDeletedCards ? cardsQuery.data?.pages.flatMap((page) => page.cards) ?? [] : [];
  const deletedCardCount = cardsQuery.data?.pages[0]?.totalCount ?? 0;
  const savedRecords = recordsQuery.data?.pages.flatMap((page) => page.records) ?? [];
  const savedRecordCount = recordsQuery.data?.pages[0]?.totalCount ?? 0;

  // 임시저장은 회원별 전역 슬롯 하나뿐이고, 서버는 그 슬롯이 이 그룹 것일 때만 메타데이터를 돌려준다 —
  // 있으면 "임시저장: 카드명" 버튼을 띄운다. 눌렀을 때는 "불러올까요?"를 다시 묻지 않도록
  // encodeDraftOpenHash로 전용 해시를 만든다.
  const autosave = canViewDeletedCards ? autosaveQuery.data : undefined;
  const draft = autosave
    ? {
      cardTitle: autosave.cardTitle || "제목 없음",
      hash: encodeDraftOpenHash(autosave.recordId === null
        ? { kind: "new", cardId: autosave.cardId }
        : { kind: "record", recordId: autosave.recordId }),
    }
    : null;
  const action = useGroupAction(groupId);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [activeView, setActiveView] = useState<ArchiveView>("records");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [targetListId, setTargetListId] = useState<string | null>(null);
  const restoreListsQuery = useInfiniteQuery({
    queryKey: ["group-detail", groupId, "restore-lists"],
    queryFn: ({ pageParam, signal }) => KanbanApi.listGroupLists(groupId, pageParam, signal),
    initialPageParam: 0,
    enabled: canRestore && selectedCardId !== null,
    getNextPageParam: (last) => last.receivedCount > 0 && (last.page + 1) * 10 < last.totalCount ? last.page + 1 : undefined,
  });

  const listCollection = createListCollection({
    items: (restoreListsQuery.data?.pages.flatMap((page) => page.lists) ?? lists).map((list) => ({ label: list.title, value: list.id })),
  });

  const handleSelectCard = (cardId: string) => {
    setSelectedCardId((prev) => (prev === cardId ? null : cardId));
    setTargetListId(null);
  };

  const handleViewChange = (view: ArchiveView) => {
    if (view === activeView) return;
    setActiveView(view);
    setSelectedCardId(null);
    setTargetListId(null);
    viewportRef.current?.scrollTo({ top: 0 });
  };

  return (
    <Box className={styles.container}>
      {draft && (
        <a className={styles.draftButton} href={`#${draft.hash}`}>
          <PenBox size={14} />
          임시저장: {draft.cardTitle}
        </a>
      )}
      <div className={styles.viewSwitch} role="group" aria-label="아카이브 목록 선택">
        <button
          type="button"
          className={`${styles.viewButton} ${activeView === "records" ? styles.activeView : ""}`}
          aria-pressed={activeView === "records"}
          onClick={() => handleViewChange("records")}
        >
          보관한 기록 <span className={styles.count}>{savedRecordCount}</span>
        </button>
        <button
          type="button"
          className={`${styles.viewButton} ${activeView === "cards" ? styles.activeView : ""}`}
          aria-pressed={activeView === "cards"}
          onClick={() => handleViewChange("cards")}
        >
          삭제된 카드 <span className={styles.count}>{deletedCardCount}</span>
        </button>
      </div>
      <ScrollArea.Root className={styles.listArea} size="sm" variant="hover">
        <ScrollArea.Viewport ref={viewportRef} h="100%" style={{ overflowX: "hidden" }}>
          <ScrollArea.Content w="100%" px="15px" pb="12px">
      {activeView === "cards" ? (
        <Box key="cards" className={styles.viewContent} display="flex" flexDirection="column" gap="8px">
          {!canViewDeletedCards ? <Text fontSize="sm">그룹 멤버만 삭제된 카드를 볼 수 있습니다.</Text> : cardsQuery.isPending ? <ContentSkeleton /> : cardsQuery.isError && !cardsQuery.data ? (
            <Box><Text role="alert">삭제된 카드를 불러오지 못했습니다.</Text><Button size="sm" onClick={() => void cardsQuery.refetch()}>다시 시도</Button></Box>
          ) : cards.length === 0 && <Text fontSize="sm" color="gray.500">삭제된 카드가 없습니다.</Text>}
          {cards.map((card) => {
            const isSelected = selectedCardId === card.id;

            return (
              <Box key={card.id}>
                <Box
                  display="flex"
                  flexDirection="column"
                  gap="4px"
                  px="8px"
                  py="6px"
                  borderRadius="6px"
                  bg={isSelected ? "blackAlpha.100" : "whiteAlpha.700"}
                  cursor={canRestore ? "pointer" : "default"}
                  transition="background-color 150ms ease, transform 100ms ease"
                  _hover={{ bg: "blackAlpha.50" }}
                  _active={{ transform: "scale(0.97)" }}
                  onClick={() => canRestore && handleSelectCard(card.id)}
                >
                  <Text fontSize="sm" fontWeight="medium" wordBreak="break-all">
                    {card.title}
                  </Text>
                  <Box display="flex" alignItems="center" gap="10px" flexWrap="wrap" fontSize="sm" color="gray.500">
                    <Box display="flex" alignItems="center" gap="4px">
                      <PenBox size={14} />
                      {card.recordCount}
                    </Box>
                    <Text>{card.authorName} 만듦</Text>
                    <Text>
                      <RelativeDateTime value={card.deletedAt} /> 삭제됨
                    </Text>
                  </Box>
                </Box>
                <Collapse open={isSelected && canRestore}>
                  <Box
                    display="flex"
                    flexDirection="column"
                    gap="6px"
                    mt="6px"
                    px="8px"
                    py="8px"
                    borderRadius="6px"
                    bg="blackAlpha.50"
                  >
                    <Select.Root
                      collection={listCollection}
                      value={targetListId ? [targetListId] : []}
                      onValueChange={(e) => setTargetListId(e.value[0] ?? null)}
                      size="sm"
                    >
                      <Select.Trigger>
                        <Select.ValueText placeholder="복구할 리스트 선택" />
                        <Select.Indicator>
                          <ChevronDown size={14} />
                        </Select.Indicator>
                      </Select.Trigger>
                      <Portal>
                        <Select.Positioner>
                          <Select.Content>
                            {listCollection.items.map((item) => (
                              <Select.Item key={item.value} item={item}>
                                {item.label}
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Positioner>
                      </Portal>
                    </Select.Root>
                    {restoreListsQuery.isError && <Text role="alert" fontSize="sm">복구할 리스트를 불러오지 못했습니다.</Text>}
                    {(restoreListsQuery.hasNextPage || restoreListsQuery.isError) && (
                      <Button size="sm" variant="outline" disabled={restoreListsQuery.isFetching} onClick={() => void (restoreListsQuery.isError && !restoreListsQuery.isFetchNextPageError ? restoreListsQuery.refetch() : restoreListsQuery.fetchNextPage())}>
                        {restoreListsQuery.isError ? "리스트 다시 불러오기" : "리스트 더보기"}
                      </Button>
                    )}
                    <Button size="sm" _disabled={{ color: "gray.500" }} disabled={!targetListId || action.isPending} onClick={() => targetListId && action.mutate(() => GroupArchiveApi.restoreGroupCard(groupId, card.id, { targetListId }), { onSuccess: () => { setSelectedCardId(null); setTargetListId(null); void queryClient.invalidateQueries({ queryKey: ["saved-records-page"] }); } })}>
                      복구하기
                    </Button>
                  </Box>
                </Collapse>
              </Box>
            );
          })}
          {cardsQuery.isFetchingNextPage && (
            <div aria-busy>
              <ContentSkeleton />
            </div>
          )}
          {canViewDeletedCards && cardsQuery.hasNextPage && !cardsQuery.isFetchingNextPage && (
            <Button w="100%" size="sm" variant="outline" onClick={() => void cardsQuery.fetchNextPage()}>
              {cardsQuery.isFetchNextPageError ? "다시 시도" : "더보기"}
            </Button>
          )}
        </Box>
      ) : (
        <Box key="records" className={styles.viewContent} display="flex" flexDirection="column" gap="8px">
          {recordsQuery.isPending ? <ContentSkeleton /> : recordsQuery.isError && !recordsQuery.data ? (
            <Box><Text role="alert">보관한 기록을 불러오지 못했습니다.</Text><Button size="sm" onClick={() => void recordsQuery.refetch()}>다시 시도</Button></Box>
          ) : savedRecords.length === 0 && <Text fontSize="sm" color="gray.500">보관한 기록이 없습니다.</Text>}
          {/* 서버가 최근 보관순으로 준다. */}
          {savedRecords.map((record) => (
              <Box key={record.id} className={cn(styles.savedRecord, (record.isDeleted || record.isCardDeleted) && styles.savedRecordDeleted)}>
                <Text fontSize="sm" color="gray.500" className={styles.recordMeta}>
                  {record.groupName}<br />
                  <CreditCard size={14} className={styles.icon} />{record.cardTitle} · {record.authorName} 작성
                </Text>
                <Text fontSize="xs" color="gray.500" className={styles.recordMeta}>
                  <RelativeDateTime value={record.savedAt} /> 보관됨
                </Text>
                <RecordViewer type={record.type} content={record.content} hideMedia className={styles.recordContent} defaultCodeWrap={pageState.textWrap} />
                <div className={styles.recordActions}>
                  <button
                    type="button"
                    className={styles.moreButton}
                    onClick={() => onOpenRecord(record.groupId, record.id)}
                  >
                    더보기
                  </button>
                  <button
                    type="button"
                    className={styles.removeButton}
                    disabled={action.isPending}
                    onClick={() => action.mutate(() => groupSavedRecords.remove(queryClient, record.groupId, record.id))}
                  >
                    제거
                  </button>
                </div>
              </Box>
            ))}
          {recordsQuery.isFetchingNextPage && (
            <div aria-busy>
              <ContentSkeleton />
            </div>
          )}
          {recordsQuery.hasNextPage && !recordsQuery.isFetchingNextPage && (
            <Button w="100%" size="sm" variant="outline" onClick={() => void recordsQuery.fetchNextPage()}>
              {recordsQuery.isFetchNextPageError ? "다시 시도" : "더보기"}
            </Button>
          )}
        </Box>
      )}
          </ScrollArea.Content>
        </ScrollArea.Viewport>
        <HoverScrollbar />
      </ScrollArea.Root>
    </Box>
  );
}
