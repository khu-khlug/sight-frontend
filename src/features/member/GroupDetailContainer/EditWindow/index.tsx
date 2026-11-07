import ContentSkeleton from "../../../../components/ContentSkeleton";
import { GroupStatus } from "../../../../constant";
import type { RecordFileInput, RecordUploadDto } from "../../../../api/public/group/KanbanApi";
import { findSiteFile, RecordFileTracker } from "./recordFiles";
import type { DraggedFile } from "../../../../util/draggableFile";
import { toast } from "react-toastify";
import SkeletonWrapper from "../../../../components/SkeletonWrapper";
import { Box, Button, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";

import { KanbanApi, KanbanCardDto } from "../../../../api/public/group/KanbanApi";
import type { BlockEditorHandle } from "../../../../components/BlockEditor";
import { useUnsavedChangesBeforeUnload } from "../../../../hooks/browser/useUnsavedChangesBeforeUnload";
import { cn } from "../../../../util/cn";
import Window from "../Window";
import { DualWindowActions, SingleWindowActions } from "../Window/HeaderActions";
import { WindowBinding } from "../WindowLayer";
import { fileApi, sideForRole } from "../actions";
import { useGroupDetailPageState } from "../pageState";
import styles from "./style.module.css";
import { EditWindowTarget } from "./types";
import { useRecordDraft } from "./useRecordDraft";

// 에디터 계열(tiptap, prosemirror, katex, highlight.js)이 첫 화면 번들에 들어가지 않도록
// 기록 작성창이 처음 그려질 때 불러온다.
const BlockEditor = lazy(() => import("../../../../components/BlockEditor"));

type Props = {
  binding: WindowBinding;
  groupId: string;
  target: EditWindowTarget;
  // "new" 케이스는 cardId를 이미 알고 있어서, 추가 API 호출 없이 이미 로드된 카드 목록에서
  // 카드명만 찾으면 된다(§기존 설계: 전체 lists는 GroupDetailContainer가 이미 들고 있다).
  // 중단·종료 그룹에서는 서버 임시저장을 쓰지 않는다.
  groupStatus: GroupStatus;
  cards: KanbanCardDto[];
  // 저장 응답의 새 파일 업로드 정보를 돌려준다.
  onCreateRecord: (cardId: string, content: string, files: RecordFileInput[]) => Promise<{ id: string; uploads: RecordUploadDto[] }>;
  onUpdateRecord: (cardId: string, recordId: string, content: string, files: RecordFileInput[]) => Promise<RecordUploadDto[]>;
};

// 기록 본문 최대 크기(UTF-8 바이트).
const MAX_RECORD_CONTENT_BYTES = 1024 * 1024;

export default function EditWindow({ binding, groupId, groupStatus, target, cards, onCreateRecord, onUpdateRecord }: Props) {
  const { role, minimized, isClosing, canGoDual, onToggleMinimize, onClose, onSwitchSide, onExpand, onSendToSide, registerCloseGuard } = binding;
  const isDualLayer = role !== "single";
  const { pageState } = useGroupDetailPageState();

  // "record" 케이스는 이 기록이 어느 카드 소속인지 URL만으로는 알 수 없다(기록id -> 카드id
  // 역방향 조회 API가 아직 없음) — KanbanApi.getGroupRecord(mock)가 전체 카드를 뒤져 카드id·
  // 카드명·본문을 한 번에 돌려준다.
  const recordQuery = useQuery({
    queryKey: ["group-detail", groupId, "kanban-record", target.kind === "record" ? target.recordId : null],
    queryFn: () => KanbanApi.getGroupRecord(groupId, (target as { kind: "record"; recordId: string }).recordId),
    enabled: target.kind === "record",
  });

  const cardId = target.kind === "new" ? target.cardId : recordQuery.data?.cardId ?? null;
  const cardTitle = target.kind === "new"
    ? cards.find((card) => card.id === target.cardId)?.title ?? null
    : recordQuery.data?.cardTitle ?? null;
  const recordId = target.kind === "record" ? target.recordId : null;

  // 에디터에 넣어 줄 시작 본문이다. 입력할 때마다 바뀌지 않는다 — 입력 중인 본문은 에디터가 들고 있고,
  // 저장이 필요한 순간에만 editorHandle로 직렬화해서 가져온다.
  // 첨부 파일 연결 정보와 업로드 대기 파일을 편집기 밖에서 관리한다.
  const [fileTracker] = useState(() => new RecordFileTracker());
  useEffect(() => () => fileTracker.dispose(), [fileTracker]);
  const [initialContent, setInitialContent] = useState(() => {
    fileTracker.reset(recordQuery.data?.files);
    return recordQuery.data?.content ?? "";
  });
  const [recordInitialized, setRecordInitialized] = useState(() => target.kind === "new" || !!recordQuery.data);
  // 직접 진입은 원문 조회 후 한 번만 초기화한다. 재조회로 작성 중인 내용을 덮어쓰지 않는다.
  useEffect(() => {
    if (!recordInitialized && target.kind === "record" && recordQuery.data) {
      fileTracker.reset(recordQuery.data.files);
      setInitialContent(recordQuery.data.content);
      setRecordInitialized(true);
    }
  }, [fileTracker, recordInitialized, target.kind, recordQuery.data]);

  // 새 기록이든 기존 기록 수정이든 입력이 한 번이라도 있었으면 수정 중으로 본다(되돌려도 유지).
  const [hasInput, setHasInput] = useState(false);
  const isDirty = hasInput;
  useUnsavedChangesBeforeUnload(isDirty);
  const [isSaving, setIsSaving] = useState(false);
  // 닫힘 도중 히스토리로 되살아난 창도 다시 편집·제출할 수 있게 한다.
  useEffect(() => {
    if (!isClosing) setIsSaving(false);
  }, [isClosing]);
  const confirmDiscardEdit = () => window.confirm("작성 중인 내용이 있습니다. 편집을 종료하시겠습니까?");

  const editorHandle = useRef<BlockEditorHandle | null>(null);
  // 에디터가 아직 없거나 이미 해제된 시점(창 교체 직전의 마지막 저장 등)에는 마지막으로 읽은 본문을 쓴다.
  const lastContent = useRef(initialContent);
  const getContent = useCallback(() => {
    const content = editorHandle.current?.getContent();
    if (content !== undefined) lastContent.current = content;
    return lastContent.current;
  }, []);

  const draft = useRecordDraft({
    groupId,
    // 중단 그룹에서도 기록을 작성·수정할 수 있으므로 임시저장 API를 쓴다. 종료 그룹은 서버가 거부한다.
    serverEnabled: groupStatus !== GroupStatus.SUCCESS && groupStatus !== GroupStatus.FAIL,
    cardId,
    recordId,
    // 임시저장에는 영구 주소가 담긴 JSON 본문과 파일 배열을 보낸다.
    getContent: () => fileTracker.toServer(getContent()).content,
    getFiles: () => fileTracker.toServer(getContent()).files,
    onUploads: async (uploads) => {
      await fileTracker.applyUploads(groupId, uploads);
      editorHandle.current?.replaceFileUrls(fileTracker.replacements());
    },
    isDirty,
    ready: recordInitialized,
    autoload: target.autoloadDraft ?? false,
    onRestore: (content, files) => {
      fileTracker.merge(files);
      setInitialContent(content);
      setHasInput(true);
    },
    // 입력이 잠잠해지면 그동안 바뀐 제목을 목차에 반영한다.
    onSettled: () => editorHandle.current?.refreshTableOfContents(),
  });
  const { touch } = draft;
  const handleInput = useCallback(() => {
    setHasInput(true);
    touch();
  }, [touch]);

  useEffect(() => {
    registerCloseGuard(isDirty ? () => {
      if (!confirmDiscardEdit()) return false;
      void draft.flush();
      return true;
    } : null);
    return () => registerCloseGuard(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, isClosing]);

  // 제출·임시저장 처리 후 복귀를 요청한다. 닫힘 애니메이션과 제거는 WindowLayer가 맡는다.
  const closeEditor = () => {
    registerCloseGuard(null);
    // 새 기록/기록 수정 모두 편집을 마치면 소속 카드가 편집창 자리에 돌아온다.
    const restoreCardId = cards.some((card) => card.id === cardId) ? cardId : null;
    onClose(restoreCardId ? { restoreContentKey: restoreCardId } : undefined);
  };
  const handleRequestClose = async () => {
    if (isSaving || isClosing) return;
    if (isDirty && !confirmDiscardEdit()) return;
    setIsSaving(true);
    await draft.flush();
    closeEditor();
  };

  const createdRecordId = useRef<string | null>(null);

  const handleSubmit = async (document: string) => {
    if (!cardId) return;
    if (isSaving || isClosing) return;
    let content: string;
    let files: RecordFileInput[];
    try { ({ content, files } = fileTracker.toServer(document, "submit")); }
    catch (error) { toast.error(error instanceof Error ? error.message : "첨부 파일을 확인해 주세요."); return; }
    // 서버는 UTF-8 기준 1 MiB를 넘는 기록 본문을 받지 않는다. 보내기 전에 막고 입력은 그대로 둔다.
    if (new TextEncoder().encode(content).length > MAX_RECORD_CONTENT_BYTES) {
      toast.error("기록 본문이 너무 깁니다. 1MB 이하로 줄여 주세요.");
      return;
    }
    setIsSaving(true);
    try {
      await draft.pause();
      // 진행 중이던 임시저장이 파일 ID를 발급했을 수 있으므로 완료 후 다시 읽는다.
      ({ content, files } = fileTracker.toServer(getContent(), "submit"));
      if (new TextEncoder().encode(content).length > MAX_RECORD_CONTENT_BYTES) throw new Error("기록 본문이 너무 깁니다. 1MB 이하로 줄여 주세요.");
      let savedRecordId = recordId ?? createdRecordId.current;
      let uploads: RecordUploadDto[];
      if (savedRecordId) uploads = await onUpdateRecord(cardId, savedRecordId, content, files);
      else {
        const created = await onCreateRecord(cardId, content, files);
        savedRecordId = created.id;
        createdRecordId.current = savedRecordId;
        uploads = created.uploads;
      }
      await fileTracker.applyUploads(groupId, uploads);
      editorHandle.current?.replaceFileUrls(fileTracker.replacements());
      const final = fileTracker.toServer(getContent(), "complete");
      if (new TextEncoder().encode(final.content).length > MAX_RECORD_CONTENT_BYTES) throw new Error("기록 본문이 너무 깁니다. 1MB 이하로 줄여 주세요.");
      if (final.content !== content || uploads.length) {
        await onUpdateRecord(cardId, savedRecordId, final.content, final.files);
      }
      // 삭제 실패 때문에 이미 제출한 기록을 다시 제출하지 않도록 한다.
      await draft.clear().catch(() => undefined);
      setHasInput(false);
      closeEditor();
    } catch (error) {
      draft.resume(createdRecordId.current ?? undefined);
      toast.error(error instanceof Error ? error.message : "저장을 완료하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setIsSaving(false);
    }
  };
  // BlockEditor는 props가 같으면 다시 그려지지 않으므로, 매 렌더 새로 만들어지는 handleSubmit 대신
  // 항상 최신 handleSubmit을 부르는 안정된 함수를 넘긴다.
  const submitRef = useRef(handleSubmit);
  submitRef.current = handleSubmit;
  const stableSubmit = useCallback((content: string) => submitRef.current(content), []);

  // 본문에 넣는 파일은 바로 올리지 않는다. 편집기에는 blob 주소로 보여 주고, 저장 응답의 업로드 정보로 올린다.
  const uploadRecordMedia = useCallback(async (file: File) => fileTracker.addLocal(file), [fileTracker]);
  // 같은 그룹의 업로드된 파일은 다시 올리지 않고 백엔드 파일 아이디로 참조한다. 다른 그룹 파일은 서버가 참조를 거부한다.
  const referenceRecordFile = useCallback((url: string) => {
    const found = findSiteFile(url);
    if (!found || found.groupId !== groupId || !found.file.url) return null;
    return { src: fileTracker.addExisting({ ...found.file, url: found.file.url }), size: found.file.size, contentType: found.file.contentType };
  }, [fileTracker, groupId]);
  // 그 밖의 앱 안 파일(다른 그룹 파일, 채팅·저장소·활동보고서 파일)은 링크가 만료되거나 이 기록과 연결되지 않으므로
  // 내려받아 이 기록의 새 파일로 올린다.
  const fetchRemoteFile = useCallback(async (file: DraggedFile) => {
    const { blob } = await fileApi.get(file.url);
    return new File([blob], file.name, { type: file.contentType || blob.type });
  }, []);

  const middleActions = !isDualLayer
    ? <SingleWindowActions canGoDual={canGoDual} onSendToSide={onSendToSide} />
    : <DualWindowActions side={sideForRole(role === "main" ? "main" : "sub")} otherSideEmpty={binding.otherSideEmpty} onExpand={onExpand} onSwitchSide={onSwitchSide} />;

  const recordLoadFailed = target.kind === "record" && recordQuery.isError && !recordQuery.data;
  const isLoadingRecord = target.kind === "record" && (
    recordQuery.isPending || (!recordInitialized && !!recordQuery.data)
  );
  const recordNotFound = target.kind === "record" && recordQuery.isSuccess && recordQuery.data === null;

  return (
    <Window
      isSub={role === "sub"}
      minimized={minimized}
      onToggleMinimize={onToggleMinimize}
      isClosing={isClosing}
      onRequestClose={handleRequestClose}
      middleActions={middleActions}
      headerLeftTogglesMinimize={false}
      headerLeft={
        <Box className={styles.headerLeft}>
          <Text className={styles.headerTitle} fontWeight="semibold">
            {cardTitle ?? "..."}#{recordId ?? "새 기록"}
          </Text>
          {draft.isSaved && <Text className={styles.draftBadge}>임시저장됨</Text>}
        </Box>
      }
    >
      <SkeletonWrapper className={cn(styles.content)}>
        {draft.error && <Text fontSize="xs" color="red.500" role="status">{draft.error}</Text>}
        {isLoadingRecord ? (
          <ContentSkeleton />
        ) : recordLoadFailed ? (
          <Box display="flex" flexDirection="column" gap={3} alignItems="center" justifyContent="center" h="100%">
            <Text>기록을 불러오지 못했습니다.</Text>
            <Button onClick={() => { void recordQuery.refetch(); }}>다시 시도</Button>
          </Box>
        ) : recordNotFound ? (
          <Box display="flex" alignItems="center" justifyContent="center" h="100%" color="gray.500">
            존재하지 않는 기록입니다.
          </Box>
        ) : recordQuery.data?.type === "legacy" ? (
          <Text color="gray.500">레거시 기록은 아직 수정할 수 없습니다.</Text>
        ) : (
          <Suspense fallback={<ContentSkeleton />}>
            <BlockEditor
              initialValue={initialContent}
              onInput={handleInput}
              onSubmit={stableSubmit}
              handleRef={editorHandle}
              placeholder="기록 내용을 작성하세요"
              disabled={isSaving}
              defaultCodeWrap={pageState.textWrap}
              uploadFile={uploadRecordMedia}
              resolveFileMetadata={fileApi.getMetadata}
              referenceFile={referenceRecordFile}
              fetchFile={fetchRemoteFile}
              linkCards={cards}
            />
          </Suspense>
        )}
      </SkeletonWrapper>
    </Window>
  );
}
