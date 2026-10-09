import ContentSkeleton from "../../../../../components/ContentSkeleton";
import { AutosaveApi } from "../../../../../api/public/group/AutosaveApi";
import { GroupArchiveApi } from "../../../../../api/public/group/GroupArchiveApi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useGroupAction } from "../../../../../hooks/group/useGroupAction";
import { Box, Button, createListCollection, Portal, ScrollArea, Select, Text } from "@chakra-ui/react";
import { ChevronDown, CreditCard, PenBox } from "lucide-react";
import { useRef, useState } from "react";

import Collapse from "../../../../../components/Collapse";
import HoverScrollbar from "../../../../../components/HoverScrollbar";
import RelativeDateTime from "../../../../../components/RelativeDateTime";
import { decodeEditContentKey, encodeDraftOpenHash } from "../../EditWindow/types";
import RecordViewer from "../../RecordViewer";
import { groupSavedRecords } from "../../savedRecords";
import { useGroupDetailPageState } from "../../pageState";
import { ArchivedCard } from "./types";
import styles from "./style.module.css";

// EditWindow가 AutosaveApi.save 때 넣어주는 extra 모양 — 지금 그룹과 같을 때만 이 탭에 노출한다
// (자동저장은 회원별 전역 슬롯 하나뿐이라 다른 그룹 카드 것일 수도 있다).
type AutosaveExtra = { groupId: number; cardTitle: string | null };

type ListOption = { id: string; title: string };

type Props = {
  groupId: number;
  lists: ListOption[];
};

type ArchiveView = "cards" | "records";

const sortByNewest = (cards: ArchivedCard[]) =>
  [...cards].sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());

/*
 * 삭제된 카드와 개인이 보관한 기록을 전환해 보여준다. 삭제된 카드를 선택하면 그 밑에
 * 복구 폼(리스트 선택 + 복구하기 버튼)이 펼쳐진다.
 */
export default function GroupArchive({ groupId, lists }: Props) {
  const { pageState } = useGroupDetailPageState();
  const queryClient = useQueryClient();
  const cardsQuery = useQuery({ queryKey: ["group-detail", groupId, "archived-cards"], queryFn: () => GroupArchiveApi.listArchivedGroupCards(groupId) });
  const recordsQuery = useQuery(groupSavedRecords.queryOptions(groupId));
  const autosaveQuery = useQuery({ queryKey: ["group-detail", groupId, "autosave-metadata"], queryFn: () => AutosaveApi.getMetadata() });
  const cards = cardsQuery.data ?? [];
  const savedRecords = recordsQuery.data ?? [];

  // 자동저장은 회원별 전역 슬롯 하나뿐이다 — "새 기록"이든 "기록 수정"이든, extra에 담긴
  // groupId가 지금 보고 있는 그룹과 같을 때만 "임시저장: 카드명" 버튼을 띄운다. 눌렀을 때는
  // "불러올까요?"를 다시 묻지 않도록 encodeDraftOpenHash로 전용 해시를 만든다.
  const autosave = autosaveQuery.data;
  const autosaveTarget = autosave ? decodeEditContentKey(autosave.location) : null;
  const autosaveExtra = autosave?.extra ? (JSON.parse(autosave.extra) as AutosaveExtra) : null;
  const draft = autosaveTarget && autosaveExtra?.groupId === groupId
    ? { cardTitle: autosaveExtra.cardTitle ?? "제목 없음", hash: encodeDraftOpenHash(autosaveTarget) }
    : null;
  const action = useGroupAction(groupId);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [activeView, setActiveView] = useState<ArchiveView>("records");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [targetListId, setTargetListId] = useState<string | null>(null);

  const listCollection = createListCollection({
    items: lists.map((list) => ({ label: list.title, value: list.id })),
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

  if (cardsQuery.isPending || recordsQuery.isPending) return <ContentSkeleton />;
  if (cardsQuery.isError || recordsQuery.isError) return <Text role="alert">아카이브를 불러오지 못했습니다.</Text>;
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
          보관한 기록 <span className={styles.count}>{savedRecords.length}</span>
        </button>
        <button
          type="button"
          className={`${styles.viewButton} ${activeView === "cards" ? styles.activeView : ""}`}
          aria-pressed={activeView === "cards"}
          onClick={() => handleViewChange("cards")}
        >
          삭제된 카드 <span className={styles.count}>{cards.length}</span>
        </button>
      </div>
      <ScrollArea.Root className={styles.listArea} size="sm" variant="hover">
        <ScrollArea.Viewport ref={viewportRef} h="100%" style={{ overflowX: "hidden" }}>
          <ScrollArea.Content w="100%" px="15px" pb="12px">
      {activeView === "cards" ? (
        <Box key="cards" className={styles.viewContent} display="flex" flexDirection="column" gap="8px">
          {cards.length === 0 && <Text fontSize="sm" color="gray.500">삭제된 카드가 없습니다.</Text>}
          {sortByNewest(cards).map((card) => {
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
                  cursor="pointer"
                  transition="background-color 150ms ease, transform 100ms ease"
                  _hover={{ bg: "blackAlpha.50" }}
                  _active={{ transform: "scale(0.97)" }}
                  onClick={() => handleSelectCard(card.id)}
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
                <Collapse open={isSelected}>
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
                    <Button size="sm" disabled={!targetListId || action.isPending} onClick={() => targetListId && action.mutate(() => GroupArchiveApi.restoreGroupCard(groupId, card.id, { targetListId }), { onSuccess: () => { setSelectedCardId(null); setTargetListId(null); } })}>
                      복구하기
                    </Button>
                  </Box>
                </Collapse>
              </Box>
            );
          })}
        </Box>
      ) : (
        <Box key="records" className={styles.viewContent} display="flex" flexDirection="column" gap="8px">
          {savedRecords.length === 0 && <Text fontSize="sm" color="gray.500">보관한 기록이 없습니다.</Text>}
          {[...savedRecords]
            .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
            .map((record) => (
              <Box key={record.id} className={styles.savedRecord}>
                <Text fontSize="sm" color="gray.500" className={styles.recordMeta}>
                  {/* 이 링크를 누르는 시점에 이미 그룹 상세 페이지(경로)에 있으므로 해시만
                      바꾸면 된다 — groupId나 /dev/group/ 같은 경로 문자열을 몰라도 된다.
                      접두사 없는 bare id 형태(windowHash.ts)는 예전에 외부로 공유된 카드
                      URL과의 하위 호환용이고, 앱 내부에서 새로 만드는 링크는 명시적인
                      "card=<id>" 형태를 쓴다. */}
                  <a className={styles.cardLink} href={`#card=${record.cardId}`}><CreditCard size={14} className={styles.icon} />{record.cardTitle}</a> · {record.authorName} 작성
                </Text>
                <Text fontSize="xs" color="gray.500" className={styles.recordMeta}>
                  <RelativeDateTime value={record.savedAt} /> 보관됨
                </Text>
                <RecordViewer type={record.type} content={record.content} className={styles.recordContent} defaultCodeWrap={pageState.textWrap} />
                <div className={styles.recordActions}>
                  <button
                    type="button"
                    className={styles.moreButton}
                    onClick={() => {
                      // TODO: 기록 상세 팝업이 구현되면 record.id를 전달해 팝업을 여는 이벤트를 연결한다.
                    }}
                  >
                    더보기
                  </button>
                  <button
                    type="button"
                    className={styles.removeButton}
                    disabled={action.isPending}
                    onClick={() => action.mutate(() => groupSavedRecords.remove(queryClient, groupId, record.id))}
                  >
                    제거
                  </button>
                </div>
              </Box>
            ))}
        </Box>
      )}
          </ScrollArea.Content>
        </ScrollArea.Viewport>
        <HoverScrollbar />
      </ScrollArea.Root>
    </Box>
  );
}
