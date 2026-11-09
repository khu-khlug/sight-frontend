import { isValidLogData } from "./logData";
import { GroupActivityLogApi } from "../../../../../api/public/group/GroupActivityLogApi";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Box, Button, Text } from "@chakra-ui/react";
import { type MouseEvent } from "react";

import RelativeDateTime from "../../../../../components/RelativeDateTime";
import ContentSkeleton from "../../../../../components/ContentSkeleton";
import { legacyCardIdFromHref, renderLogMessage, sanitizeLegacyLogHtml } from "./logMessage";
import type { ActivityLogEntry } from "./types";

type Props = {
  groupId: string;
  // 로그의 같은 그룹 카드 링크를 누르면 기존 카드 열기 흐름으로 넘긴다.
  onOpenCard: (cardId: string) => void;
};

function LogBody({ log, onOpenCard }: { log: ActivityLogEntry; onOpenCard: (cardId: string) => void }) {
  if (!isValidLogData(log.logType, log.logData)) {
    return <Text fontSize="sm" color="gray.500">표시할 수 없는 로그입니다.</Text>;
  }
  if (log.logType === "LEGACY") {
    const html = typeof log.logData?.html === "string" ? log.logData.html : "";
    const handleClick = (event: MouseEvent<HTMLDivElement>) => {
      const anchor = (event.target as HTMLElement).closest("a");
      const cardId = legacyCardIdFromHref(anchor?.getAttribute("href") ?? null);
      if (!cardId || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      onOpenCard(cardId);
    };
    return <Box fontSize="sm" wordBreak="break-all" onClick={handleClick} dangerouslySetInnerHTML={{ __html: sanitizeLegacyLogHtml(html) }} />;
  }
  const message = renderLogMessage(log, onOpenCard);
  if (!message) return <Text fontSize="sm" color="gray.500">표시할 수 없는 로그입니다.</Text>;
  return <Text fontSize="sm" wordBreak="break-all" whiteSpace="pre-wrap">{message}</Text>;
}

export default function GroupActivityLog({ groupId, onOpenCard }: Props) {
  const logsQuery = useInfiniteQuery({
    queryKey: ["group-detail", groupId, "logs"],
    queryFn: ({ pageParam, signal }) => GroupActivityLogApi.listGroupLogsPage(groupId, pageParam, signal),
    initialPageParam: 0,
    getNextPageParam: (last) => {
      const next = last.page + 1;
      return last.receivedCount > 0 && next * 50 < last.totalCount ? next : undefined;
    },
  });
  const logs = logsQuery.data?.pages.flatMap((page) => page.logs) ?? [];
  const totalCount = logsQuery.data?.pages[0]?.totalCount ?? 0;

  if (logsQuery.isPending) return <ContentSkeleton />;
  if (logsQuery.isError && !logsQuery.data) return (
    <Box><Text role="alert">활동 로그를 불러오지 못했습니다.</Text><Button size="sm" mt={2} onClick={() => void logsQuery.refetch()}>다시 시도</Button></Box>
  );
  return (
    <Box>
      <Text fontSize="sm" color="gray.500" mb={3}>
        활동 로그 {totalCount}건
      </Text>
      <Box display="flex" flexDirection="column" gap="8px">
        {logs.map((log) => (
          <Box key={log.id} display="flex" flexDirection="column" gap="4px" px="8px" py="6px" borderRadius="6px" bg="whiteAlpha.700">
            <Text fontSize="sm" fontWeight="medium">
              {log.actor?.name ?? "시스템"}
            </Text>
            <Text fontSize="xs" color="gray.500">
              <RelativeDateTime value={log.createdAt} withSeconds />
            </Text>
            <LogBody log={log} onOpenCard={onOpenCard} />
          </Box>
        ))}
      </Box>
      {logsQuery.isFetchingNextPage && (
        <Box mt="8px" aria-busy>
          <ContentSkeleton />
        </Box>
      )}
      {logsQuery.isFetchNextPageError && <Text role="alert" fontSize="sm">로그를 더 불러오지 못했습니다. 다시 시도해주세요.</Text>}
      {logsQuery.hasNextPage && !logsQuery.isFetchingNextPage && (
        <Button mt="8px" w="100%" size="sm" variant="outline" onClick={() => void logsQuery.fetchNextPage()}>
          {logsQuery.isFetchNextPageError ? "다시 시도" : "더보기"}
        </Button>
      )}
    </Box>
  );
}
