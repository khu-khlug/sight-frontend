import { Box, ScrollArea, Text } from "@chakra-ui/react";
import HoverScrollbar from "../../../../../components/HoverScrollbar";
import { registerSiteFiles, siteFileDrag } from "../../EditWindow/recordFiles";
import { Archive, Clock, Hash, History, MoreHorizontal, PenLine, RotateCcw, SquarePen, Trash2, BriefcaseBusiness, Paperclip } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { RecordDto } from "../../../../../api/public/group/KanbanApi";
import { KanbanApi } from "../../../../../api/public/group/KanbanApi";
import { toast } from "react-toastify";
import { useGroupAction } from "../../../../../hooks/group/useGroupAction";
import AppTooltip from "../../../../../components/AppTooltip";
import SkeletonWrapper from "../../../../../components/SkeletonWrapper";
import { cn } from "../../../../../util/cn";
import { draggableFileProps } from "../../../../../util/draggableFile";
import { calcDateInterval, DateFormats, formatDate } from "../../../../../util/date";
import RecordViewer from "../../RecordViewer";
import { groupSavedRecords } from "../../savedRecords";
import { useGroupDetailPageState } from "../../pageState";
import styles from "./style.module.css";
import RecordMoveMenu from "./RecordMoveMenu";

type Props = {
  className?: string;
  locationLabel?: string;
  // 그룹 포트폴리오가 발행 중일 때만 기록의 포트폴리오 포함 버튼을 보인다.
  isPortfolioPublished?: boolean;
  // 중단·종료 그룹에서는 개인 보관·보관 해제와 기록 포트폴리오 변경을 할 수 없다.
  canArchive?: boolean;
  groupId: number;
  cardId: string;
  record: RecordDto;
  disabled?: boolean;
  onToggleDeleted?: (recordId: string) => void;
  onEdit?: () => void;
  // 본문의 카드 링크(#카드id)를 누르면 그 카드 창을 연다.
  onOpenCard?: (cardId: string) => void;
  // 다른 곳(보관한 기록의 "더보기" 등)에서 이 기록으로 이동해 왔을 때 잠깐 강조한다.
  highlighted?: boolean;
  onHighlightEnd?: () => void;
};

// .metaLine의 gap(14px)/.metaIconGroup의 gap(2px)과 같은 값 — JS로 "들어갈 공간이 있는지"
// 계산할 때 CSS의 실제 간격을 그대로 반영해야 한다.
const META_LINE_GAP = 14;
const ICON_GROUP_GAP = 2;

export default function RecordItem({ className, locationLabel, groupId, cardId, record, disabled = false, isPortfolioPublished = false, canArchive = true, onToggleDeleted, onEdit, onOpenCard, highlighted = false, onHighlightEnd }: Props) {
  const queryClient = useQueryClient();
  const isSaved = record.isInUserArchive;
  const action = useGroupAction(groupId);
  const saveRecord = () => {
    if (action.isPending) return;
    void action.mutateAsync(() => isSaved
      ? groupSavedRecords.remove(queryClient, groupId, record.id)
      : groupSavedRecords.insert(queryClient, groupId, record.id))
      .then(() => { toast.success(isSaved ? "기록 보관을 해제했습니다." : "기록을 보관했습니다."); }).catch(() => undefined);
  };
  const toggleRecordPortfolio = () => {
    if (action.isPending) return;
    void action.mutateAsync(() => KanbanApi.updateGroupRecordPortfolio(groupId, record.id, { isInPortfolio: !record.isInPortfolio }))
      .then(() => { toast.success(record.isInPortfolio ? "기록을 포트폴리오에서 제외했습니다." : "기록을 포트폴리오에 포함했습니다."); }).catch(() => undefined);
  };
  const moveRecord = (targetCardId: string) => {
    if (action.isPending) return;
    void action.mutateAsync(() => KanbanApi.moveGroupRecord(groupId, record.id, { targetCardId }))
      .then(() => { toast.success("기록을 이동했습니다."); }).catch(() => undefined);
  };
  const { pageState } = useGroupDetailPageState();
  const metaLineRef = useRef<HTMLDivElement>(null);
  // 항상 4열로 고정된, 화면엔 안 보이는 측정 전용 사본 — 실제로 보여주는 .metaGroup은
  // isCompact에 따라 열 수가 바뀌는데, 그걸 그대로 관찰 대상으로 삼으면 "2열로 접히면
  // scrollWidth가 줄어서 다시 안 접어도 된다고 판단 → 4열로 복귀 → 다시 넘쳐서 또 접힘"이
  // 반복되는 무한 루프(ResizeObserver 피드백)가 생긴다. 열 수가 절대 안 바뀌는 별도
  // 엘리먼트를 측정해야 판단 기준 자체가 흔들리지 않는다.
  const measureGroupRef = useRef<HTMLDivElement>(null);
  // .moreActions는 평소 max-width:0인 flex 컨테이너라, 그 안의 버튼들(flex-shrink 기본값 1)이
  // 단순히 시각적으로 가려지는 게 아니라 실제로 0 폭에 맞춰 눌려서 렌더링된다 — 그래서
  // .moreActions 자신의 scrollWidth를 재면 "펼쳤을 때" 크기가 아니라 눌린 크기가 나온다.
  // max-width 제약이 없는 별도 측정용 사본에서 재야 펼쳤을 때의 진짜 폭이 나온다.
  const measureActionsRef = useRef<HTMLDivElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const savedButtonRef = useRef<HTMLButtonElement>(null);
  const restoreButtonRef = useRef<HTMLButtonElement>(null);
  const [isCompact, setIsCompact] = useState(false);
  // 기록 헤더 아래에 첨부 파일 목록을 펼친다.
  const [showFiles, setShowFiles] = useState(false);

  // .metaGroup이 2열로 접힐지는 고정 px 기준(예: 520px) 대신, 실제 콘텐츠 폭(measureGroup) +
  // 아이콘 묶음이 "펼쳐졌을 때"(마우스 오버로 .moreActions가 열렸을 때) 필요한 폭을 합쳐서
  // 실제 들어갈 공간이 있는지로 판단한다. .moreActions는 평소 max-width:0/overflow:hidden으로
  // 접혀 있지만, scrollWidth는 접히기 전의 실제 콘텐츠 폭(펼쳤을 때 폭)을 그대로 돌려준다 —
  // 그래서 마우스를 올리지 않은 상태에서도 "펼치면 얼마나 필요한지"를 미리 알 수 있다.
  useLayoutEffect(() => {
    const metaLine = metaLineRef.current;
    const measureGroup = measureGroupRef.current;
    if (!metaLine || !measureGroup) return;
    const recompute = () => {
      const available = metaLine.clientWidth;
      // 삭제된 기록은 "복구" 버튼 하나뿐이라 펼쳐지는 메뉴가 없다 — 그쪽은 그 버튼 폭만,
      // 아니면(일반 기록) moreActions가 펼쳐졌을 때 폭 + 수정 버튼 폭을 기준으로 삼는다.
      const iconGroupWidth = record.isDeleted
        ? (restoreButtonRef.current?.offsetWidth ?? 0)
        : (measureActionsRef.current?.scrollWidth ?? 0) + (editButtonRef.current?.offsetWidth ?? 0)
          + (savedButtonRef.current?.offsetWidth ?? 0)
          + ICON_GROUP_GAP * Math.max(0, Number(!disabled) + Number(!disabled && record.type !== "legacy") + Number(isSaved) - 1);
      const needed = measureGroup.scrollWidth + META_LINE_GAP + iconGroupWidth;
      setIsCompact(available < needed);
    };
    recompute();
    const observer = new ResizeObserver(recompute);
    observer.observe(metaLine);
    observer.observe(measureGroup);
    if (measureActionsRef.current) observer.observe(measureActionsRef.current);
    return () => observer.disconnect();
  }, [record.isDeleted, record.type, disabled, isSaved, locationLabel]);

  const handleDelete = () => {
    if (window.confirm("기록을 삭제하시겠습니까? 삭제한 기록은 나중에 복구할 수 있습니다.")) {
      onToggleDeleted?.(String(record.id));
    }
  };
  const handleRestore = () => {
    if (window.confirm("기록을 복구하시겠습니까?")) {
      onToggleDeleted?.(String(record.id));
    }
  };
  const metaItemsContent = (
    <>
      <Box className={styles.metaItem}>
        {!locationLabel && <Hash size={14} />}
        <Text fontSize="xs">{locationLabel ?? record.id}</Text>
      </Box>
      <Box className={styles.metaItem}>
        <PenLine size={14} />
        <Text fontSize="xs">{record.authorName}</Text>
      </Box>
      <AppTooltip content={formatDate(new Date(record.createdAt), DateFormats.DATETIME)} placement="top">
        <Box className={styles.metaItem}>
          <Clock size={14} />
          <Text fontSize="xs">{calcDateInterval(new Date(record.createdAt))} 생성</Text>
        </Box>
      </AppTooltip>
      <AppTooltip content={formatDate(new Date(record.updatedAt), DateFormats.DATETIME)} placement="top">
        <Box className={styles.metaItem}>
          {record.isDeleted ? <Trash2 size={14} /> : <History size={14} />}
          <Text fontSize="xs">{calcDateInterval(new Date(record.updatedAt))} {record.isDeleted ? "삭제" : "수정"}</Text>
        </Box>
      </AppTooltip>
    </>
  );
  return (
    <SkeletonWrapper
      data-record-id={record.id}
      className={cn(styles.record, record.isDeleted ? styles.recordDeleted : undefined, isCompact ? styles.recordCompactHeader : undefined, highlighted ? styles.recordHighlighted : undefined, className)}
      onAnimationEnd={(event) => {
        // 자식 요소의 애니메이션 종료도 버블링되므로 이 요소 자신의 강조 애니메이션만 본다.
        if (highlighted && event.target === event.currentTarget) onHighlightEnd?.();
      }}
    >
      <Box className={styles.metaLine} ref={metaLineRef} style={{ position: "relative" }}>
        {/* position:absolute로 .metaLine의 실제 flex 레이아웃에서 완전히 빠지고, top/left:0 +
            부모의 position:relative로 바로 그 자리에만 국한된다 — 그냥 flex 흐름에 두면 안
            보여도 자기 너비만큼 .metaLine의 다른 아이템들을 밀어낸다. */}
        <Box
          className={styles.metaGroup}
          style={{ position: "absolute", top: 0, left: 0, visibility: "hidden", pointerEvents: "none", height: 0, overflow: "hidden" }}
          aria-hidden
          ref={measureGroupRef}
        >
          {metaItemsContent}
        </Box>
        <Box className={cn(styles.metaGroup, isCompact ? styles.metaGroupCompact : undefined)}>
          {metaItemsContent}
        </Box>
        {record.isDeleted ? (
          // 비활성 카드의 기록은 복구할 수 없다.
          !disabled && (
            <AppTooltip content="기록 복구" placement="top">
              <Box as="button" className={styles.actionButton} aria-label="기록 복구" onClick={handleRestore} ref={restoreButtonRef}>
                <RotateCcw size={16} />
              </Box>
            </AppTooltip>
          )
        ) : (
          (
            <Box className={styles.metaIconGroup}>
              {/* 실제 버튼들과 똑같이 생겼지만 max-width 제약 없이 항상 펼쳐진 크기로 렌더링되는
                  측정 전용 사본 — .moreActions는 평소 눌려 있어서 그 자신의 scrollWidth로는
                  "펼쳤을 때" 진짜 폭을 못 잰다. */}
              {!disabled && <Box
                className={styles.moreActions}
                style={{ position: "absolute", top: 0, left: 0, visibility: "hidden", pointerEvents: "none", height: 0, overflow: "hidden", maxWidth: "none", opacity: 0 }}
                aria-hidden
                ref={measureActionsRef}
              >
                <Box className={styles.deleteButton} />
                <Box className={styles.actionButton} />
                {!isSaved && <Box className={styles.actionButton} />}
                <Box className={styles.actionButton} />
              </Box>}
              {!disabled && <Box className={styles.moreWrapper}>
                <Box className={cn(styles.actionButton, styles.moreTrigger)} aria-hidden>
                  <MoreHorizontal size={16} />
                </Box>
                <Box className={styles.moreActions}>
                  <AppTooltip content="기록 삭제" placement="top">
                    <Box as="button" className={styles.deleteButton} aria-label="기록 삭제" onClick={handleDelete}>
                      <Trash2 size={16} />
                    </Box>
                  </AppTooltip>
                  <AppTooltip content="사이트에 업로드된 파일" placement="top">
                    <button type="button" className={styles.actionButton} aria-label={showFiles ? "사이트에 업로드된 파일 닫기" : "사이트에 업로드된 파일 보기"} aria-expanded={showFiles} onClick={() => setShowFiles((value) => !value)}>
                      <Paperclip size={16} />
                    </button>
                  </AppTooltip>
                  <RecordMoveMenu groupId={groupId} cardId={cardId} disabled={action.isPending} onMove={moveRecord} />
                  {!isSaved && canArchive && <AppTooltip content="기록 보관" placement="top">
                    <button type="button" className={styles.actionButton} aria-label="기록 보관" disabled={action.isPending} onClick={saveRecord}>
                      <Archive size={16} />
                    </button>
                  </AppTooltip>}
                </Box>
              </Box>}
              {isSaved && canArchive && <AppTooltip content="기록 보관 해제" placement="top">
                <button type="button" ref={savedButtonRef} className={cn(styles.actionButton, styles.savedButton)}
                  aria-label="기록 보관 해제" aria-pressed disabled={action.isPending} onClick={saveRecord}>
                  <Archive size={16} />
                </button>
              </AppTooltip>}
              {/* 비활성 카드에서는 더보기 메뉴가 없으므로 첨부 파일 보기와 보관 버튼을 따로 둔다. */}
              {disabled && <AppTooltip content="사이트에 업로드된 파일" placement="top">
                <button type="button" className={styles.actionButton} aria-label={showFiles ? "사이트에 업로드된 파일 닫기" : "사이트에 업로드된 파일 보기"} aria-expanded={showFiles} onClick={() => setShowFiles((value) => !value)}>
                  <Paperclip size={16} />
                </button>
              </AppTooltip>}
              {disabled && !isSaved && canArchive && <AppTooltip content="기록 보관" placement="top">
                <button type="button" className={styles.actionButton} aria-label="기록 보관" disabled={action.isPending} onClick={saveRecord}>
                  <Archive size={16} />
                </button>
              </AppTooltip>}
              {!disabled && canArchive && isPortfolioPublished && <AppTooltip content={record.isInPortfolio ? "포트폴리오에서 제외하기" : "포트폴리오에 포함하기"} placement="top">
                <button type="button" className={cn(styles.actionButton, record.isInPortfolio ? styles.savedButton : undefined)}
                  aria-label={record.isInPortfolio ? "포트폴리오에서 제외하기" : "포트폴리오에 포함하기"} aria-pressed={record.isInPortfolio}
                  disabled={action.isPending} onClick={toggleRecordPortfolio}>
                  <BriefcaseBusiness size={16} />
                </button>
              </AppTooltip>}
              {!disabled && record.type !== "legacy" && <AppTooltip content="기록 수정" placement="top">
                <Box as="button" className={styles.actionButton} aria-label="기록 수정" ref={editButtonRef} onClick={onEdit}>
                  <SquarePen size={16} />
                </Box>
              </AppTooltip>}
            </Box>
          )
        )}
      </Box>
      {showFiles && !record.isDeleted && <RecordFileList files={record.files} />}
      {!record.isDeleted && (
        <RecordBody groupId={groupId} record={record} className={styles.content} defaultCodeWrap={pageState.textWrap} onOpenCard={onOpenCard} />
      )}
    </SkeletonWrapper>
  );
}

const formatFileSize = (size: number) => size >= 1024 * 1024
  ? `${(size / (1024 * 1024)).toFixed(1)}MB`
  : size >= 1024 ? `${Math.round(size / 1024)}KB` : `${size}B`;

// 기록에 연결된 첨부 파일을 가로로 나열한다. 내려받기만 할 수 있고, 마우스를 올리면 백엔드 파일 아이디를 보인다.
// 아이디를 복사할 수 있게 커서를 툴팁 위로 옮겨도 닫히지 않는다.
function RecordFileList({ files }: { files: RecordDto["files"] }) {
  if (!files.length) return <Text className={styles.fileListEmpty} fontSize="xs">첨부 파일이 없습니다.</Text>;
  return (
    <ScrollArea.Root className={styles.fileList} size="xs" variant="hover" h="auto" flexShrink={0}>
      <ScrollArea.Viewport h="auto" style={{ overflowY: "hidden" }}>
        <ScrollArea.Content className={styles.fileListContent}>
          {files.map((file) => (
            <AppTooltip key={file.id} content={file.fileId} placement="top" interactive>
              {file.url ? (
                <a className={styles.fileItem} href={file.url} download={file.name}
                  {...draggableFileProps({ url: file.url, name: file.name, size: file.size, contentType: file.contentType })}>
                  <Text as="span" fontSize="xs" className={styles.fileName}>{file.name}</Text>
                  <Text as="span" fontSize="xs" color="gray.500">{formatFileSize(file.size)}</Text>
                </a>
              ) : (
                <span className={styles.fileItem} aria-disabled>
                  <Text as="span" fontSize="xs" className={styles.fileName}>{file.name}</Text>
                  <Text as="span" fontSize="xs" color="gray.500">업로드 전</Text>
                </span>
              )}
            </AppTooltip>
          ))}
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <HoverScrollbar orientation="horizontal" />
    </ScrollArea.Root>
  );
}

function RecordBody({ groupId, record, ...props }: Omit<ComponentProps<typeof RecordViewer>, "type" | "content" | "getDraggedFile"> & { groupId: number; record: RecordDto }) {
  useEffect(() => { registerSiteFiles(record.files, groupId); }, [record.files, groupId]);
  return <RecordViewer {...props} type={record.type} content={record.content} getDraggedFile={siteFileDrag} />;
}
