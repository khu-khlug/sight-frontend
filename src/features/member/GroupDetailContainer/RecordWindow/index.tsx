import { Box, Button, Text } from "@chakra-ui/react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { KanbanApi } from "../../../../api/public/group/KanbanApi";
import { GroupInfoApi } from "../../../../api/public/group/GroupInfoApi";
import { GroupArchiveApi } from "../../../../api/public/group/GroupArchiveApi";
import ContentSkeleton from "../../../../components/ContentSkeleton";
import RelativeDateTime from "../../../../components/RelativeDateTime";
import { VerticalScrollBox } from "../../../../components/ScrollBox";
import { sideForRole } from "../actions";
import RecordItem from "../CardWindow/RecordItem";
import Window from "../Window";
import windowStyles from "../Window/style.module.css";
import { DualWindowActions, SingleWindowActions } from "../Window/HeaderActions";
import type { WindowBinding } from "../WindowLayer";
import type { RecordWindowTarget } from "./types";
import styles from "./style.module.css";

type Props = {
  binding: WindowBinding;
  target: RecordWindowTarget;
  currentGroupId: string;
  onOpenCard: (cardId: string) => void;
};

export default function RecordWindow({ binding, target, currentGroupId, onOpenCard }: Props) {
  const location = useLocation();
  const query = useQuery({
    queryKey: ["group-detail", target.groupId, "kanban-record", target.recordId],
    queryFn: () => KanbanApi.getGroupRecord(target.groupId, target.recordId),
  });
  const groupQuery = useQuery({
    queryKey: ["record-window-group", target.groupId],
    queryFn: () => GroupInfoApi.getGroup(target.groupId),
  });
  const record = query.data;
  const savedQuery = useInfiniteQuery({
    queryKey: ["saved-records-page"],
    queryFn: ({ pageParam, signal }) => GroupArchiveApi.listSavedRecordsPage(pageParam, signal),
    initialPageParam: 0,
    getNextPageParam: (last) => {
      const next = last.page + 1;
      return last.receivedCount > 0 && next * 10 < last.totalCount ? next : undefined;
    },
  });
  const savedAt = savedQuery.data?.pages.flatMap((page) => page.records)
    .find((item) => item.groupId === target.groupId && item.id === target.recordId)?.savedAt;
  // 주소로 복원한 기록이 아직 불러오지 않은 보관 목록 페이지에 있을 수도 있다.
  useEffect(() => {
    if (!savedAt && savedQuery.hasNextPage && !savedQuery.isFetching && !savedQuery.isFetchNextPageError) {
      void savedQuery.fetchNextPage();
    }
  }, [savedAt, savedQuery.hasNextPage, savedQuery.isFetching, savedQuery.isFetchNextPageError, savedQuery.fetchNextPage]);
  const groupUrl = location.pathname.replace(/\/group\/\d+\/?$/, `/group/${target.groupId}`);
  const actions = binding.role === "single"
    ? <SingleWindowActions canGoDual={binding.canGoDual} onSendToSide={binding.onSendToSide} />
    : <DualWindowActions side={sideForRole(binding.role === "main" ? "main" : "sub")} otherSideEmpty={binding.otherSideEmpty} onExpand={binding.onExpand} onSwitchSide={binding.onSwitchSide} />;
  return <Window
    headerLeftTogglesMinimize={false}
    headerLeft={<Box className={styles.headerLeft}><Text className={styles.headerTitle} fontWeight="semibold">{target.groupId === currentGroupId ? "기록" : groupQuery.data?.title ?? `그룹 ${target.groupId}`}#{target.recordId}</Text></Box>}
    minimized={binding.minimized} isSub={binding.role === "sub"} isClosing={binding.isClosing}
    onToggleMinimize={binding.onToggleMinimize} onRequestClose={() => binding.onClose()} middleActions={actions}
  >
    <VerticalScrollBox gutter={16} className={styles.content} scrollbarClassName={windowStyles.scrollbar}>
      {query.isPending ? <ContentSkeleton /> : query.isError || !record || record.isDeleted ? <Box role="status">
        <Text>기록을 열 수 없습니다. 삭제되었거나 열람 권한이 없을 수 있습니다.</Text>
        <Button onClick={() => void query.refetch()}>다시 시도</Button>
      </Box> : <Box className={styles.recordLayout}>
        <Box display="flex" alignItems="center" flexWrap="wrap" gap={3}>{target.groupId === currentGroupId
          ? <Button size="sm" variant="outline" onClick={() => onOpenCard(record.cardId)}>소속 카드 열기</Button>
          : <Button asChild size="sm" variant="outline"><a href={groupUrl} target="_blank" rel="noopener noreferrer">그룹을 새 탭에서 열기 ↗</a></Button>}
          {savedAt && <Text fontSize="xs" color="gray.500"><RelativeDateTime value={savedAt} /> 보관됨</Text>}
        </Box>
        <RecordItem
          className={styles.record}
          locationLabel={`${record.listTitle} · ${record.cardTitle}`}
          groupId={target.groupId}
          cardId={record.cardId}
          record={record}
          disabled
          canArchive={false}
        />
      </Box>}
    </VerticalScrollBox>
  </Window>;
}
