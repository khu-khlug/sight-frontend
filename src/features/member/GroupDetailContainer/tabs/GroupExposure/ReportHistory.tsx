import { Box, ScrollArea, Text } from "@chakra-ui/react";
import AppTooltip from "../../../../../components/AppTooltip";
import MaterialFileIcon from "../../../../../components/MaterialFileIcon";
import HoverScrollbar from "../../../../../components/HoverScrollbar";
import RelativeDateTime from "../../../../../components/RelativeDateTime";
import { draggableFileProps } from "../../../../../util/draggableFile";
import type { FileWindowContent } from "../../FileWindow/types";
import { ACTIVITY_REPORT_TYPE_LABEL, SEASON_LABEL, SPEAK_ORDER_LABEL, type ActivityReport } from "./types";
import styles from "./style.module.css";

type Props = {
  reports: ActivityReport[];
  onOpenFile: (content: FileWindowContent) => void;
};

export default function ReportHistory({ reports, onOpenFile }: Props) {
  return (
    <>
      <Text fontSize="sm" fontWeight="medium" mb={2} className={styles.historyHeading}>
        이전 활동보고 내역
      </Text>
      <ScrollArea.Root className={styles.historyArea} size="sm" variant="hover">
        <ScrollArea.Viewport h="100%" style={{ overflowX: "hidden" }}>
          <ScrollArea.Content w="100%" className={styles.historyList}>
            {reports.length === 0 ? (
              <Text fontSize="sm" color="gray.400">
                제출한 활동보고가 없습니다.
              </Text>
            ) : (
              reports.map((report) => (
                <Box
                key={report.id}
                className={styles.historyItem}
                bg="whiteAlpha.800"
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                gap="8px"
              >
                <Box minW="0">
                  <Text fontSize="sm" fontWeight="medium">
                    {ACTIVITY_REPORT_TYPE_LABEL[report.isPresentation ? "presentation" : "report"]}
                  </Text>
                  <Text fontSize="xs" color="gray.400">
                    {new Date(report.seminarDate).getFullYear()}년 ·{" "}
                    {SEASON_LABEL[report.isSummerSeason ? "summer" : "winter"]} ·{" "}
                    {SPEAK_ORDER_LABEL[report.isSpeakAfter ? "after" : "before"]}
                  </Text>
                  <Text fontSize="xs" color="gray.400">
                    <RelativeDateTime value={report.createdAt} />
                  </Text>
                </Box>
                {/* 파일명/URL 텍스트 대신, 확장자로 유추한 파일 종류 아이콘을 카드 우측에 둔다.
                    새 탭으로 내려받는 대신 파일 창으로 바로 미리보고, 기록 편집기로 끌어다 넣을 수도 있다. */}
                <AppTooltip content={report.fileName}>
                  <Box
                    as="button"
                    aria-label={report.fileName}
                    flex="none"
                    color="gray.500"
                    onClick={() => onOpenFile({ source: "activityReport", fileName: report.fileName, fileUrl: report.reportFileUrl })}
                    {...draggableFileProps({ url: report.reportFileUrl, name: report.fileName })}
                  >
                    <MaterialFileIcon fileName={report.reportFileUrl} size={26} />
                  </Box>
                </AppTooltip>
                </Box>
              ))
            )}
          </ScrollArea.Content>
        </ScrollArea.Viewport>
        <HoverScrollbar />
      </ScrollArea.Root>
    </>
  );
}
