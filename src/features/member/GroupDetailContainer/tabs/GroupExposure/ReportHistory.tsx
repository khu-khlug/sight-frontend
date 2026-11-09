import { Box, ScrollArea, Text } from "@chakra-ui/react";
import AppTooltip from "../../../../../components/AppTooltip";
import MaterialFileIcon from "../../../../../components/MaterialFileIcon";
import HoverScrollbar from "../../../../../components/HoverScrollbar";
import RelativeDateTime from "../../../../../components/RelativeDateTime";
import { draggableFileProps } from "../../../../../util/draggableFile";
import type { FileWindowContent } from "../../FileWindow/types";
import { activityReportFileName, ACTIVITY_REPORT_TYPE_LABEL, SEASON_LABEL, SPEAK_ORDER_LABEL, type ActivityReport } from "./types";
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
                    {report.seminarDate ? `${new Date(report.seminarDate).getFullYear()}년` : "일정 정보 없음"} ·{" "}
                    {report.seminarIsSummerSeason === null ? "계절 정보 없음" : SEASON_LABEL[report.seminarIsSummerSeason ? "summer" : "winter"]} ·{" "}
                    {report.seminarIsSpeakAfter === null ? "발표 순서 정보 없음" : SPEAK_ORDER_LABEL[report.seminarIsSpeakAfter ? "after" : "before"]}
                  </Text>
                  <Text fontSize="xs" color="gray.400">
                    <RelativeDateTime value={report.createdAt} />
                  </Text>
                </Box>
                {/* 파일명/URL 텍스트 대신, 확장자로 유추한 파일 종류 아이콘을 카드 우측에 둔다.
                    새 탭으로 내려받는 대신 파일 창으로 바로 미리보고, 기록 편집기로 끌어다 넣을 수도 있다. */}
                <AppTooltip content={activityReportFileName(report)}>
                  <Box
                    as="button"
                    aria-label={activityReportFileName(report)}
                    flex="none"
                    color="gray.500"
                    onClick={() => onOpenFile({ source: "activityReport", fileName: activityReportFileName(report), fileUrl: report.reportFileUrl })}
                    {...draggableFileProps({ url: report.reportFileUrl, name: activityReportFileName(report) })}
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
