import ContentSkeleton from "../../../../../components/ContentSkeleton";
import { useQuery } from "@tanstack/react-query";
import { GroupExposureApi } from "../../../../../api/public/group/GroupExposureApi";
import { useGroupAction } from "../../../../../hooks/group/useGroupAction";
import { Box, Button, Input, Link, RadioGroup, Strong, Text } from "@chakra-ui/react";
import { ChangeEvent, useRef, useState } from "react";
import { ScrollText, CreditCard, X } from "lucide-react";
import { toast } from "react-toastify";

import Collapse from "../../../../../components/Collapse";
import { useCurrentUser } from "../../../../../hooks/user/useCurrentUser";
import { useUnsavedChangesBeforeUnload } from "../../../../../hooks/useUnsavedChangesBeforeUnload";
import type { FileWindowContent } from "../../FileWindow/types";
import { GroupInfo as GroupInfoData } from "../GroupInfo/types";
import {
  ACTIVITY_REPORT_TYPE_LABEL,
  ActivityReport,
  SEASON_LABEL,
  SPEAK_ORDER_LABEL,
} from "./types";
import ReportHistory from "./ReportHistory";
import styles from "./style.module.css";

type Props = {
  info: GroupInfoData;
  portfolioCounts: { listCount: number; cardCount: number };
  onOpenFile: (content: FileWindowContent) => void;
};

const sortByNewest = <T extends ActivityReport,>(reports: T[]) =>
  [...reports].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

// activity-report-upload-link.md: Presigned URL 발급 시 R2에 강제하는 실제 상한.
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

/*
 * sight-spring-backend/docs/plans/activity-report-*.md, group-portfolio-*.md 기준.
 * - 포트폴리오 발행/취소: 그룹장만 (group-portfolio-publish.md)
 * - 활동보고 제출/파일 업로드 링크 발급: 그룹장만 (activity-report-submit.md,
 *   activity-report-upload-link.md) — 그룹원은 버튼 자체를 못 본다
 * - 활동보고 조회: 그룹 멤버 누구나 (activity-report-get.md)
 * - 세미나 접수 기간(기수)은 그룹이 아니라 운영진이 클럽 전체 단위로 연다, 한 번에 하나만
 * 제출물은 서버가 반환한 세미나 ID로 현재 접수 기간과 연결한다.
 */
export default function GroupExposure({ info, portfolioCounts, onOpenFile }: Props) {
  const action = useGroupAction(info.id);
  const contextQuery = useQuery({ queryKey: ["group-detail", info.id, "report-context"], queryFn: () => GroupExposureApi.getActivityReportContext(info.id) });
  const reportsQuery = useQuery({ queryKey: ["group-detail", info.id, "reports"], queryFn: () => GroupExposureApi.listActivityReports(info.id) });
  const openCohort = contextQuery.data;
  const localReports = reportsQuery.data ?? [];
  const currentUserQuery = useCurrentUser();
  const isLeader = currentUserQuery.data?.id === info.leaderUserId;

  const hasPublishedPortfolio = info.hasPublishedPortfolio;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPresentation, setIsPresentation] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [isFileRemoved, setIsFileRemoved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentReport = openCohort
    ? sortByNewest(localReports).find((report) =>
        report.seminarId === openCohort.id,
      )
    : undefined;
  const displayedFileName = file?.name ?? (!isFileRemoved && currentReport
    ? currentReport.fileName
    : null);
  const isCancelling = Boolean(currentReport && isFileRemoved && !file);
  const canSubmit = Boolean(openCohort && (
    isCancelling || file || (currentReport && isPresentation !== currentReport.isPresentation)
  ));
  useUnsavedChangesBeforeUnload(isFormOpen && Boolean(file || isFileRemoved
    || (currentReport && isPresentation !== currentReport.isPresentation)));

  const toggleReportForm = () => {
    if (!isFormOpen) {
      setIsPresentation(currentReport?.isPresentation ?? true);
      setFile(null);
      setIsFileRemoved(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    setIsFormOpen((prev) => !prev);
  };

  const handleTogglePortfolio = () => action.mutate(() => hasPublishedPortfolio
    ? GroupExposureApi.cancelGroupPortfolio(info.id)
    : GroupExposureApi.publishGroupPortfolio(info.id));

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0] ?? null;
    if (picked && picked.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`"${picked.name}"의 용량이 너무 커서 첨부할 수 없습니다 (최대 20MB).`, {
        autoClose: 2500,
        hideProgressBar: true,
      });
      event.target.value = "";
      setFile(null);
      return;
    }
    if (picked) {
      setFile(picked);
      setIsFileRemoved(false);
    }
  };

  const handleSubmit = () => {
    if (!openCohort || !canSubmit || action.isPending) return;
    if (isCancelling && !window.confirm("활동보고를 취소하시겠습니까? 제출한 파일도 삭제됩니다.")) return;
    if (!currentReport && file && !window.confirm("활동보고를 제출하시겠습니까?")) return;
    action.mutate(async () => {
      if (isCancelling && currentReport) {
        await GroupExposureApi.cancelActivityReport(info.id, currentReport.id);
        return;
      }
      let fileUploadId: string | undefined;
      if (file) {
        const upload = await GroupExposureApi.issueActivityReportUploadLink(info.id, { fileName: file.name, contentType: file.type || "application/octet-stream" });
        await GroupExposureApi.uploadActivityReportFile(upload.url, file);
        fileUploadId = upload.fileUploadId;
      }
      if (currentReport) {
        await GroupExposureApi.updateActivityReport(info.id, currentReport.id, { isPresentation, fileUploadId });
      } else if (fileUploadId) {
        await GroupExposureApi.submitActivityReport(info.id, { isPresentation, fileUploadId, seminarId: openCohort.id });
      }
    }, { onSuccess: () => {
      setFile(null);
      setIsFileRemoved(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setIsFormOpen(false);
    } });
  };

  if (contextQuery.isPending || reportsQuery.isPending) return <ContentSkeleton />;
  if (contextQuery.isError || reportsQuery.isError) return <Text role="alert">활동보고를 불러오지 못했습니다.</Text>;

  return (
    <Box className={styles.container}>
      <Box className={styles.header}>
      <Box display="flex" direction="row" alignItems="center" justifyContent="space-between" mb={hasPublishedPortfolio ? 2 : 8}>
        <Text fontSize="md" fontWeight="medium" mb={2}>
          포트폴리오&nbsp; - &nbsp;
          {hasPublishedPortfolio ? (
            <Link
              href={`https://khlug.org/folio/${info.id}`}
              target="_blank"
              rel="noreferrer"
              fontSize="sm"
              color="black"
            >
              발행 중
            </Link>
            ) : (<Text as="span" fontSize="sm">미발행</Text>) }
        </Text>
        <Button
          size="sm"
          variant="outline"
          disabled={!isLeader || action.isPending}
          onClick={handleTogglePortfolio}
          _active={{ transform: "scale(0.97)" }}
        >
          {hasPublishedPortfolio ? "발행 취소" : "발행하기"}
        </Button>
      </Box>
      {hasPublishedPortfolio && (
        <Box display="flex" alignItems="center" gap="12px" mb={8} color="gray.600" fontSize="sm">
          <Box display="flex" alignItems="center" gap="4px">
            <ScrollText size={14} aria-hidden="true" />
            리스트 {portfolioCounts.listCount}
          </Box>
          <Box display="flex" alignItems="center" gap="4px">
            <CreditCard size={14} aria-hidden="true" />
            카드 {portfolioCounts.cardCount}
          </Box>
        </Box>
      )}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Text fontSize="md" fontWeight="medium">
          활동보고
        </Text>
        {/* 제출/파일 업로드 링크 발급은 그룹장만 가능해서(activity-report-submit.md,
            activity-report-upload-link.md), 그룹원에게는 버튼 자체를 보여주지 않는다. */}
        {isLeader && (
          <Button
            size="sm"
            variant="outline"
            disabled={!openCohort || action.isPending}
            onClick={toggleReportForm}
            _active={{ transform: "scale(0.97)" }}
          >
            {currentReport ? "활동보고 수정" : "활동보고"}
          </Button>
        )}
      </Box>
      {!openCohort ? (
        <Text fontSize="sm" color="gray.500" mb={4}>
          열린 활동보고가 없습니다.
        </Text>
      ) : (
        <Box mb={4}>
            <Text as="div" fontSize="sm" color="gray.500" mb={2}>
              <Text color="brand.500" mb={1}><Strong>접수 중 </Strong></Text>
            {openCohort.year}년 · {SEASON_LABEL[openCohort.isSummerSeason ? "summer" : "winter"]} ·{" "}
            {SPEAK_ORDER_LABEL[openCohort.isSpeakAfter ? "after" : "before"]}
          </Text>
          {isLeader && (
            <Collapse open={isFormOpen}>
              <Box className={styles.form}>
                <RadioGroup.Root
                  value={isPresentation ? "presentation" : "report"}
                  onValueChange={(details) =>
                    setIsPresentation((details.value ?? "presentation") === "presentation")
                  }
                  mb={3}
                >
                  <Box display="flex" justifyContent="left" gap="8px">
                    <RadioGroup.Item value="presentation" className={styles.typeItem}>
                      <RadioGroup.ItemHiddenInput />
                      <RadioGroup.ItemText>{ACTIVITY_REPORT_TYPE_LABEL.presentation}</RadioGroup.ItemText>
                    </RadioGroup.Item>
                    <RadioGroup.Item value="report" className={styles.typeItem}>
                      <RadioGroup.ItemHiddenInput />
                      <RadioGroup.ItemText>{ACTIVITY_REPORT_TYPE_LABEL.report}</RadioGroup.ItemText>
                    </RadioGroup.Item>
                  </Box>
                </RadioGroup.Root>
                <Input
                  ref={fileInputRef}
                  type="file"
                  disabled={action.isPending}
                  className={styles.fileInput}
                  onChange={handleFileChange}
                  aria-label="활동보고 파일 선택"
                />
                <Box className={styles.fileRow} mb={3}>
                  <Button size="sm" variant="outline" disabled={action.isPending} onClick={() => fileInputRef.current?.click()}>
                    파일 선택
                  </Button>
                  <Text className={styles.fileName} fontSize="sm" color={displayedFileName ? "gray.700" : "gray.400"}>
                    {displayedFileName ?? "선택된 파일 없음"}
                  </Text>
                  {displayedFileName && (
                    <Button
                      size="xs"
                      variant="ghost"
                      className={styles.removeFile}
                      aria-label="활동보고 파일 제거"
                      disabled={action.isPending}
                      onClick={() => {
                        setFile(null);
                        setIsFileRemoved(true);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    >
                      <X size={16} />
                    </Button>
                  )}
                </Box>
                {isCancelling && <Text fontSize="xs" color="red.600" mb={2}>파일 없이 제출하면 활동보고가 취소됩니다.</Text>}
                <Button
                  size="sm"
                  colorPalette="brand"
                  disabled={!canSubmit || action.isPending}
                  onClick={handleSubmit}
                  _active={{ transform: "scale(0.97)" }}
                >
                  {isCancelling ? "취소하기" : currentReport ? "수정하기" : "제출하기"}
                </Button>
              </Box>
            </Collapse>
          )}
        </Box>
      )}
      </Box>

      <ReportHistory reports={sortByNewest(localReports)} onOpenFile={onOpenFile} />
    </Box>
  );
}
