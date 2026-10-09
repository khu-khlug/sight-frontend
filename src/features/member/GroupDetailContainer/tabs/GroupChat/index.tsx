import ContentSkeleton from "../../../../../components/ContentSkeleton";
import { useQuery } from "@tanstack/react-query";
import { GroupChatApi } from "../../../../../api/public/group/GroupChatApi";
import { useGroupAction } from "../../../../../hooks/group/useGroupAction";
import { Box, IconButton, ScrollArea, Text, Textarea } from "@chakra-ui/react";
import { File, MessageCircle, MessageCirclePlus, Plus, Send, Smile, X } from "lucide-react";
import { ChangeEvent, DragEvent, KeyboardEvent, ReactNode, Suspense, lazy, useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

import AppTooltip from "../../../../../components/AppTooltip";
import HoverScrollbar from "../../../../../components/HoverScrollbar";
import RelativeDateTime from "../../../../../components/RelativeDateTime";
import { DateFormats, formatDate } from "../../../../../util/date";
import { draggableFileProps, hasFileDrag, readDraggedFile, type DraggedFile } from "../../../../../util/draggableFile";
import { fileApi } from "../../actions";
import styles from "./style.module.css";

const EmojiPicker = lazy(() => import("../../../../../components/EmojiPicker"));

type Props = {
  isMember: boolean;
  groupId: number;
  onTabChange: (id: string) => void;
};

// 실제 눌리는 버튼이 아니라, 정보 탭에 있는 버튼이 어떻게 생겼는지 보여주는 축소 모형이다.
function ButtonPreview({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <Box
      as="span"
      display="inline-flex"
      alignItems="center"
      gap="2px"
      verticalAlign="middle"
      mx="2px"
      px="6px"
      py="1px"
      fontSize="2xs"
      color="gray.600"
      border="1px solid"
      borderColor="gray.300"
      borderRadius="md"
    >
      {icon} {label}
    </Box>
  );
}

// "정보 탭"처럼, 밑줄이 있고 누르면 정보 탭으로 이동하는 텍스트.
function InfoTabLink({ onTabChange }: { onTabChange: (id: string) => void }) {
  return (
    <Text
      as="span"
      textDecoration="underline"
      cursor="pointer"
      _hover={{ color: "brand.600" }}
      onClick={() => onTabChange("info")}
    >
      정보 탭
    </Text>
  );
}

const PAGE_SIZE = 10;
// 입력창이 최대 몇 px까지 늘어날지 — style.module.css의 max-height 대신 여기서만 정의해서
// autosize 계산(JS)과 늘어나는 한계(inline style)가 항상 같은 값을 쓰게 한다.
const MAX_TEXTAREA_HEIGHT = 132;

// lucide-react의 File 아이콘과 이름이 겹쳐서, 브라우저 내장 File 타입은 별칭을 준다.
type File_ = globalThis.File;
type Attachment = { file: File_; previewUrl: string | null };

/*
 * 디스코드 첨부파일 용량 제한 — 확장자 제한은 없고(디스코드가 막는 파일 형식은 없음),
 * 용량만 제한된다. 다만 정확한 기준값이 계정/서버 부스트 등급에 따라 다르고 최근에도
 * 바뀐 적이 있어서(2026-08 기준 공식 안내로는 일반 계정 20MB), 여기 값은 그 중 가장
 * 오래 통용된 보수적인 기준(10MB)이다 — 실제 이 그룹의 디스코드 서버가 부스트로 더 큰
 * 한도를 갖고 있다면 이 상수만 바꾸면 된다.
 */
const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;

function isSameDay(a: string, b: string) {
  return formatDate(new Date(a), DateFormats.DATE) === formatDate(new Date(b), DateFormats.DATE);
}

// 디스코드에 있는 그 날짜 구분선 — 가운데 날짜, 양옆에 선.
function DateDivider({ value }: { value: string }) {
  return (
    <Box display="flex" alignItems="center" gap="8px">
      <Box flex="1" h="1px" bg="gray.200" />
      <Text fontSize="xs" color="gray.400" flex="none">
        {formatDate(new Date(value), DateFormats.DATE_KOR)}
      </Text>
      <Box flex="1" h="1px" bg="gray.200" />
    </Box>
  );
}

/*
 * 디스코드 채팅방을 그대로 가져온 모습. 메시지는 오래된 것부터 위에서 아래로 쌓이고, 날짜가
 * 바뀌는 지점마다 구분선이 낀다. 처음엔 최근 10건만 보여주고, 메시지 영역 맨 위 "더보기"를
 * 누르면 10건씩 더 불러온다(과거로 확장).
 *
 * 스크롤은 이 탭 전체가 아니라 메시지 영역 안에서만 생겨야 해서, ScrollArea가 필요하다.
 * ScrollArea가 실제 높이를 가지려면 이 컴포넌트 자신부터 실제 높이(style.module.css의
 * .container, height: 100%)가 있어야 하는데, Dashboard가 뱃지·제목 헤더(flex: none)와
 * 탭 콘텐츠(.tabArea, flex: 1)를 나눠서 "남는 공간"을 정확히 계산해 내려주므로, vh를 직접
 * 계산할 필요 없이 100%만 쓰면 된다(Dashboard/index.tsx, Dashboard/style.module.css의
 * .tabArea 참고).
 * 각 컨테이너의 레이아웃 스타일(크기·flex·간격)은 style.module.css에 두고, 컴포넌트에는
 * 데이터에 따라 달라지는 것(뱃지 색, 아이콘 등)만 인라인으로 남긴다.
 */
export default function GroupChat({ groupId, isMember, onTabChange }: Props) {
  const action = useGroupAction(groupId);
  const channelQuery = useQuery({ queryKey: ["group-detail", groupId, "chat-channel"], queryFn: () => GroupChatApi.getGroupDiscordChannel(groupId), enabled: isMember });
  const hasChatRoom = channelQuery.data?.hasChatRoom ?? false;
  const isChatParticipant = channelQuery.data?.isChatParticipant ?? false;
  const messagesQuery = useQuery({ queryKey: ["group-detail", groupId, "chat-messages"], queryFn: () => GroupChatApi.listGroupDiscordMessages(groupId), enabled: isMember && hasChatRoom });
  const messages = messagesQuery.data ?? [];
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [draft, setDraft] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [loadingAttachmentCount, setLoadingAttachmentCount] = useState(0);
  const dragDepthRef = useRef(0);
  const mountedRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentsRef = useRef(attachments);
  attachmentsRef.current = attachments;

  const isChatReady = isMember && hasChatRoom && channelQuery.isSuccess && messagesQuery.isSuccess;
  // 로딩 중에는 viewport가 없다. 메시지가 표시되는 첫 렌더에서 화면을 그리기 전에 내린다.
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (isChatReady && viewport) viewport.scrollTop = viewport.scrollHeight;
  }, [isChatReady, groupId]);

  // 미리보기용 objectURL은 메모리에 남아있는 blob 참조라, 탭을 떠날 때(언마운트) 살아있는
  // 것들을 한 번에 정리한다 — attachmentsRef로 매 렌더의 최신 값을 들고 있다가 언마운트
  // 시점에만 읽는다(effect deps에 attachments를 넣으면 제거할 때마다 다시 실행돼 버린다).
  useEffect(() => {
    mountedRef.current = true;
    const clearDrag = () => {
      dragDepthRef.current = 0;
      setIsDragOver(false);
    };
    window.addEventListener("dragend", clearDrag);
    window.addEventListener("drop", clearDrag);
    window.addEventListener("blur", clearDrag);
    return () => {
      mountedRef.current = false;
      window.removeEventListener("dragend", clearDrag);
      window.removeEventListener("drop", clearDrag);
      window.removeEventListener("blur", clearDrag);
      attachmentsRef.current.forEach((a) => a.previewUrl && URL.revokeObjectURL(a.previewUrl));
    };
  }, []);

  const handlePickFiles = () => {
    fileInputRef.current?.click();
  };

  const addFiles = (files: File_[]) => {
    if (!mountedRef.current || action.isPending) return;
    const accepted: Attachment[] = [];

    for (const file of files) {
      if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
        toast.error(`"${file.name}"의 용량이 너무 커서 첨부할 수 없습니다 (최대 10MB).`, {
          autoClose: 2500,
          hideProgressBar: true,
        });
        continue;
      }
      accepted.push({
        file,
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      });
    }

    setAttachments((prev) => [...prev, ...accepted]);
  };

  const handleFilesSelected = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(event.target.files ?? []));
    // 같은 파일을 다시 골라도 onChange가 뜨도록 값을 비운다.
    event.target.value = "";
  };

  const addRemoteFile = async (dragged: DraggedFile) => {
    if (dragged.size !== undefined && dragged.size > MAX_ATTACHMENT_SIZE_BYTES) {
      toast.error(`"${dragged.name}"의 용량이 너무 커서 첨부할 수 없습니다 (최대 10MB).`);
      return;
    }
    setLoadingAttachmentCount((count) => count + 1);
    try {
      const { blob } = await fileApi.get(dragged.url);
      if (!mountedRef.current) return;
      addFiles([new globalThis.File([blob], dragged.name, { type: dragged.contentType || blob.type })]);
    } catch {
      if (mountedRef.current) toast.error(`"${dragged.name}" 파일을 불러오지 못했습니다.`);
    } finally {
      if (mountedRef.current) setLoadingAttachmentCount((count) => count - 1);
    }
  };

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    if (!hasFileDrag(event.dataTransfer)) return;
    event.preventDefault();
    if (action.isPending) return;
    dragDepthRef.current += 1;
    setIsDragOver(true);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!hasFileDrag(event.dataTransfer)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = action.isPending ? "none" : "copy";
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (!hasFileDrag(event.dataTransfer)) return;
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setIsDragOver(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    if (!hasFileDrag(event.dataTransfer)) return;
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = 0;
    setIsDragOver(false);
    if (action.isPending) return;
    const dragged = readDraggedFile(event.dataTransfer);
    if (dragged) void addRemoteFile(dragged);
    else addFiles(Array.from(event.dataTransfer.files));
  };

  const handleRemoveAttachment = (index: number) => {
    if (action.isPending) return;
    setAttachments((prev) => {
      const target = prev[index];
      if (target.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  /*
   * 입력할 때마다 내용 높이(scrollHeight)만큼 늘리되, MAX_TEXTAREA_HEIGHT부터는 늘어나지
   * 않고 안에서 스크롤된다 — height를 먼저 auto로 되돌려야 줄었을 때도 다시 줄어든다.
   * 입력창(.form, flex: none)이 늘어나면 형제인 메시지 영역(.messages, flex: 1)이 그만큼
   * 줄어드는데, 스크롤 위치(scrollTop)는 그대로라 이미 맨 아래를 보고 있던 경우 마지막
   * 메시지가 가려져 버린다 — 늘어나기 전에 "맨 아래를 보고 있었는지"를 먼저 재고, 그 경우만
   * 늘어난 뒤에 다시 맨 아래로 맞춘다(위로 스크롤해서 과거 메시지를 보던 중이면 건드리지 않는다).
   */
  const handleDraftChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(event.target.value);

    const viewport = viewportRef.current;
    const wasAtBottom = viewport
      ? viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 4
      : false;

    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
    }

    if (viewport && wasAtBottom) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  };

  // 파일은 SIGHT 서버로 전송한다. 실패하면 입력과 첨부를 그대로 유지한다.
  const handleSend = () => {
    if (action.isPending || loadingAttachmentCount > 0 || (!draft.trim() && attachments.length === 0)) return;
    action.mutate(async () => {
      const uploaded = await Promise.all(attachments.map(async ({ file }) => ({
        name: file.name,
        type: file.type,
        data: await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error ?? new Error("파일을 읽지 못했습니다."));
          reader.readAsDataURL(file);
        }),
      })));
      return GroupChatApi.sendGroupDiscordMessage(groupId, { content: draft.trim(), attachments: uploaded });
    }, { onSuccess: () => {
      setDraft("");
      attachments.forEach((attachment) => attachment.previewUrl && URL.revokeObjectURL(attachment.previewUrl));
      setAttachments([]);
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      requestAnimationFrame(() => { const viewport = viewportRef.current; if (viewport) viewport.scrollTop = viewport.scrollHeight; });
    } });
  };

  const handleDraftKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!event.nativeEvent.isComposing) handleSend();
    }
  };

  // 이모지 피커에서 고르면 (커서가 있던 자리에) 끼워 넣는다. 값 변경 직후엔 아직 textarea가
  // 리렌더되기 전이라 새 커서 위치를 바로 못 잡아서, 다음 프레임에서 위치/높이를 맞춘다.
  const handleInsertEmoji = (text: string) => {
    if (action.isPending) return;
    const el = textareaRef.current;
    const start = el?.selectionStart ?? draft.length;
    const end = el?.selectionEnd ?? draft.length;
    setDraft(draft.slice(0, start) + text + draft.slice(end));

    requestAnimationFrame(() => {
      if (!el) return;
      const caret = start + text.length;
      el.focus();
      el.setSelectionRange(caret, caret);
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
    });
  };

  if (!isMember) {
    return (
      <Text fontSize="sm" color="gray.500">
        그룹원만 볼 수 있습니다.
      </Text>
    );
  }

  if (channelQuery.isPending || (hasChatRoom && messagesQuery.isPending)) return <ContentSkeleton />;
  if (channelQuery.isError || messagesQuery.isError) return <Text role="alert">채팅을 불러오지 못했습니다.</Text>;

  if (!hasChatRoom) {
    return (
      <Text fontSize="sm" color="gray.500" mx="15px">
        채팅방이 아직 없습니다.<br/>
        채팅방은 그룹장이 <InfoTabLink onTabChange={onTabChange} />의{" "}
        <ButtonPreview icon={<MessageCirclePlus size={10} />} label="채팅방 생성" /> 버튼으로
        생성할 수 있습니다.
      </Text>
    );
  }

  const visibleMessages = messages.slice(-visibleCount);
  const hasMore = visibleCount < messages.length;

  return (
    <Box
      className={styles.container}
      onDragEnterCapture={handleDragEnter}
      onDragOverCapture={handleDragOver}
      onDragLeaveCapture={handleDragLeave}
      onDropCapture={handleDrop}
    >
      {isDragOver && !action.isPending && (
        <div className={styles.dropOverlay}>
          <File size={28} />
          <span>파일을 놓아 첨부</span>
        </div>
      )}
      <Text fontSize="sm" color="gray.500" mb={4}>
        {isChatParticipant ? "디스코드 채팅방에 참여 중입니다." : <>
          &ensp;디스코드에서 채팅방을 보려면 <InfoTabLink onTabChange={onTabChange} />의{" "}
          <ButtonPreview icon={<MessageCircle size={10} />} label="채팅 참여" /> 버튼을 눌러야
          참여가 됩니다.
        </>}
      </Text>
      <ScrollArea.Root className={styles.messages} size="sm" variant="hover">
        <ScrollArea.Viewport ref={viewportRef} h="100%" className={styles.viewport}>
          {/* 높이 0인 sticky 앵커 — 흐름 공간을 전혀 차지하지 않아서(음수 margin으로 상쇄할
              필요가 없다) 스크롤 맨 끝에 여백을 만들지 않는다. 그라데이션 자체는 이 앵커의
              ::after로, 앵커 기준 절대위치로 그려서 기존 메시지 위에 겹쳐 보이게 한다. */}
          <div className={styles.fadeTopAnchor} />
          {/* w="100%"를 명시한다 — Ark UI가 Content에 인라인으로 minWidth: fit-content를
              박아 넣어서, 명시하지 않으면 자식 내용 크기에 따라 폭이 줄어들 수 있다. */}
          <ScrollArea.Content w="100%" className={styles.messagesContent}>
            {hasMore && (
              // 채팅 흐름 안에 있으니 테두리·배경 있는 일반 버튼 대신, 날짜 구분선과 같은
              // 톤(gray.400)의 텍스트 버튼으로 — 호버할 때만 링크처럼 진해진다.
              <Box
                as="button"
                flex="none"
                alignSelf="center"
                fontSize="xs"
                color="gray.400"
                _hover={{ color: "brand.600", textDecoration: "underline" }}
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
              >
                이전 메시지 더 보기
              </Box>
            )}
            {visibleMessages.map((message, index) => {
              const prev = visibleMessages[index - 1];
              const showDateDivider = !prev || !isSameDay(prev.createdAt, message.createdAt);

              return (
                <Box key={message.id} display="flex" flexDirection="column" gap="10px">
                  {showDateDivider && <DateDivider value={message.createdAt} />}
                  <Box display="flex" flexDirection="column" gap="2px" pr="15px">
                    <Box display="flex" alignItems="baseline" gap="6px" flexWrap="wrap">
                      <Text fontSize="md" fontWeight="medium" color="brand.600">
                        {message.authorName}
                      </Text>
                      <Text fontSize="xs" color="gray.400">
                        <RelativeDateTime value={message.createdAt} withSeconds />
                      </Text>
                    </Box>
                    <Text fontSize="sm" wordBreak="break-all">
                      {message.content}
                    </Text>
                    {message.attachments?.map((attachment, attachmentIndex) => (
                      <a
                        key={attachmentIndex}
                        href={attachment.data}
                        download={attachment.name}
                        {...draggableFileProps({ url: attachment.data, name: attachment.name, contentType: attachment.type })}
                      >
                        {attachment.name}
                      </a>
                    ))}
                  </Box>
                </Box>
              );
            })}
            {visibleMessages.length > 0 && (
              <Box display="flex" alignItems="center" gap="8px">
                <Box flex="1" h="1px" bg="gray.200" />
                <Text fontSize="xs" color="gray.400" flex="none">
                  마지막 메시지
                </Text>
                <Box flex="1" h="1px" bg="gray.200" />
              </Box>
            )}
          </ScrollArea.Content>
          <div className={styles.fadeBottomAnchor} />
        </ScrollArea.Viewport>
        <HoverScrollbar />
      </ScrollArea.Root>
      {attachments.length > 0 && (
        <Box className={styles.attachments}>
          {attachments.map((attachment, index) => (
            <Box key={index} className={styles.attachmentItem}>
              {attachment.previewUrl ? (
                <img src={attachment.previewUrl} alt={attachment.file.name} />
              ) : (
                <Box className={styles.attachmentFile}>
                  <File size={20} />
                  <AppTooltip content={attachment.file.name}>
                    <Text as="span" className={styles.attachmentFileName}>
                      {attachment.file.name}
                    </Text>
                  </AppTooltip>
                </Box>
              )}
              <Box
                as="button"
                className={styles.attachmentRemove}
                aria-label="첨부 제거"
                onClick={() => handleRemoveAttachment(index)}
              >
                <X size={10} />
              </Box>
            </Box>
          ))}
        </Box>
      )}
      {loadingAttachmentCount > 0 && <Text fontSize="xs" color="gray.500" role="status">첨부 파일 불러오는 중…</Text>}
      <Box as="form" className={styles.form} onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={handleFilesSelected}
        />
        <IconButton
          type="button"
          size="xs"
          variant="ghost"
          aria-label="파일 첨부"
          minW="28px"
          h="28px"
          p={0}
          onClick={handlePickFiles}
          disabled={action.isPending}
        >
          <Plus size={16} />
        </IconButton>
        <Textarea
          ref={textareaRef}
          disabled={action.isPending}
          value={draft}
          onChange={handleDraftChange}
          onKeyDown={handleDraftKeyDown}
          placeholder="메시지 입력"
          rows={1}
          className={styles.textarea}
          border="none"
          boxShadow="none"
          _focus={{ boxShadow: "none" }}
          style={{ maxHeight: MAX_TEXTAREA_HEIGHT }}
        />
        {showEmojiPicker ? (
          <Suspense fallback={<IconButton size="xs" variant="ghost" aria-label="이모지 불러오는 중" minW="28px" h="28px" p={0} disabled><Smile size={16} /></IconButton>}>
            <EmojiPicker onSelect={handleInsertEmoji} onClose={() => setShowEmojiPicker(false)} />
          </Suspense>
        ) : (
          <IconButton disabled={action.isPending} type="button" size="xs" variant="ghost" aria-label="이모지" minW="28px" h="28px" p={0} onClick={() => setShowEmojiPicker(true)}>
            <Smile size={16} />
          </IconButton>
        )}
        <IconButton type="submit" disabled={action.isPending || loadingAttachmentCount > 0 || (!draft.trim() && attachments.length === 0)} size="xs" variant="ghost" aria-label="전송" minW="28px" h="28px" p={0}>
          <Send size={16} />
        </IconButton>
      </Box>
    </Box>
  );
}
