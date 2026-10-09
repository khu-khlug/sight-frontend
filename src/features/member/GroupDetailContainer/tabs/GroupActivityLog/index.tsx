import { GroupActivityLogApi } from "../../../../../api/public/group/GroupActivityLogApi";
import { useQuery } from "@tanstack/react-query";
import { Box, Button, Text } from "@chakra-ui/react";
import { useState } from "react";

import RelativeDateTime from "../../../../../components/RelativeDateTime";
import ContentSkeleton from "../../../../../components/ContentSkeleton";
import { ActivityLogEntry } from "./types";

type Props = {
  groupId: number;
};

const PAGE_SIZE = 10;

const sortByNewest = (logs: ActivityLogEntry[]) =>
  [...logs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

export default function GroupActivityLog({ groupId }: Props) {
  const logsQuery = useQuery({ queryKey: ["group-detail", groupId, "logs"], queryFn: () => GroupActivityLogApi.listGroupLogs(groupId) });
  const logs = logsQuery.data ?? [];
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const sorted = sortByNewest(logs);
  const visible = sorted.slice(0, visibleCount);
  const hasMore = visibleCount < sorted.length;

  if (logsQuery.isPending) return <ContentSkeleton />;
  if (logsQuery.isError) return <Text role="alert">활동 로그를 불러오지 못했습니다.</Text>;
  return (
    <Box>
      <Text fontSize="sm" color="gray.500" mb={3}>
        활동 로그 {logs.length}건
      </Text>
      <Box display="flex" flexDirection="column" gap="8px">
        {visible.map((log) => (
          <Box key={log.id} display="flex" flexDirection="column" gap="4px" px="8px" py="6px" borderRadius="6px" bg="whiteAlpha.700">
            <Text fontSize="sm" fontWeight="medium">
              {log.memberName}
            </Text>
            <Text fontSize="xs" color="gray.500">
              <RelativeDateTime value={log.createdAt} withSeconds />
            </Text>
            <Text fontSize="sm" wordBreak="break-all">
              {log.message}
            </Text>
          </Box>
        ))}
      </Box>
      {hasMore && (
        <Button
          mt="8px"
          w="100%"
          size="sm"
          variant="outline"
          onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
        >
          더보기
        </Button>
      )}
    </Box>
  );
}
