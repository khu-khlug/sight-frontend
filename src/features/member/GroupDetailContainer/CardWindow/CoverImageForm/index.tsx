import { Box, Text } from "@chakra-ui/react";
import { ImagePlus } from "lucide-react";
import { ChangeEvent, ClipboardEvent, KeyboardEvent, useRef, useState } from "react";
import { toast } from "react-toastify";

import { KanbanApi, type CardCoverImageInput } from "../../../../../api/public/group/KanbanApi";
import Button from "../../../../../components/Button";
import { useDropTarget } from "../../../../../hooks/dragAndDrop/useDropTarget";
import { cn } from "../../../../../util/cn";
import { fileApi } from "../../actions";
import { extractErrorMessage } from "../../../../../util/extractErrorMessage";
import styles from "./style.module.css";

// 백엔드 업로드 링크 기준: 파일 하나 20 MiB, 커버 허용 형식은 아래 다섯 가지다.
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const COVER_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

type Props = {
  groupId: string;
  cardId: string;
  hasCoverImage: boolean;
  // 실제 커밋(KanbanApi.updateGroupCardCoverImage)은 호출부(CardWindow→GroupDetailContainer)가
  // useGroupAction으로 감싸서 토스트/쿼리 무효화까지 책임진다 — 이 폼은 업로드(URL 발급+PUT)
  // 까지만 직접 하고, 마지막 커밋 호출만 위로 넘긴다.
  onSubmit: (input: CardCoverImageInput) => Promise<unknown>;
  onClose: () => void;
};

/*
 * 붙여넣기·URL 입력·파일 선택·드래그 앤 드롭(실제 파일뿐 아니라 깃허브/채팅의 링크 드래그도
 * useDropTarget이 같이 받는다)을 한 영역에서 받는다 — 넷 다 최종적으로 submitFile(파일
 * 경로)이나 submitUrlValue(문자열 경로) 중 하나로 모인다. 팝업 모달이 아니라 CardWindow가
 * Collapse로 감싸 카드 헤더(.metaLine) 바로 아래에 펼치는 인라인 폼이다.
 */
export default function CoverImageForm({ groupId, cardId, hasCoverImage, onSubmit, onClose }: Props) {
  const [url, setUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const removeCoverImage = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(null);
      onClose();
    } catch {
      // useGroupAction이 오류를 표시하고 폼은 재시도할 수 있도록 유지한다.
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadFile = async (file: File) => {
    if (!COVER_IMAGE_TYPES.has(file.type)) {
      toast.error("커버로 쓸 수 있는 형식은 JPEG·PNG·WebP·GIF·AVIF입니다.", { autoClose: 2500, hideProgressBar: true });
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error("이미지 용량이 너무 커서 설정할 수 없습니다 (최대 20MB).", { autoClose: 2500, hideProgressBar: true });
      return;
    }
    let isCommitting = false;
    try {
      const upload = await KanbanApi.issueCardCoverImageUploadLink(groupId, cardId, { fileName: file.name, contentType: file.type });
      await KanbanApi.uploadCardCoverImageFile(upload.url, file);
      isCommitting = true;
      await onSubmit({ fileUploadId: upload.fileUploadId });
      onClose();
    } catch (error) {
      if (!isCommitting) toast.error(extractErrorMessage(error));
    }
  };

  const submitFile = async (file: File) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try { await uploadFile(file); } finally { setIsSubmitting(false); }
  };

  const submitUrlValue = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith("/groups/")) {
        toast.error("http 또는 https 주소만 커버로 쓸 수 있습니다.", { autoClose: 2500, hideProgressBar: true });
        return;
      }
      const { blob } = await fileApi.get(trimmed);
      const extension = blob.type.split("/")[1] || "image";
      await uploadFile(new File([blob], `cover.${extension}`, { type: blob.type }));
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  // 깃허브 파일 목록·채팅 첨부파일 등 draggableFileProps를 붙인 요소를
  // 드래그해서 놓으면 실제 파일 바이트 없이 URL만 넘어온다 — useDropTarget이 그 경우 kind:
  // "url"로 구분해준다.
  const { isDragOver, dropTargetProps } = useDropTarget((payload) => {
    if (payload.kind === "file") void submitFile(payload.file);
    else void submitUrlValue(payload.url);
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    event.target.value = "";
    if (picked) void submitFile(picked);
  };

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const item = Array.from(event.clipboardData.items).find((entry) => entry.type.startsWith("image/"));
    const file = item?.getAsFile();
    if (file) {
      event.preventDefault();
      void submitFile(file);
    }
  };

  const handleUrlKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") void submitUrlValue(url);
  };

  return (
    <Box className={styles.form}>
      <Box
        className={cn(styles.dropZone, isDragOver ? styles.dropZoneActive : undefined)}
        tabIndex={0}
        onPaste={handlePaste}
        {...dropTargetProps}
      >
        <ImagePlus size={20} />
        <Text fontSize="sm" color="gray.600">이미지를 끌어다 놓거나, 여기를 클릭한 뒤 붙여넣으세요(Ctrl+V)</Text>
        <Button size="sm" variant="neutral" disabled={isSubmitting} onClick={() => fileInputRef.current?.click()}>
          파일 선택
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className={styles.hiddenFileInput}
          onChange={handleFileChange}
          aria-label="커버 이미지 파일 선택"
        />
      </Box>
      <Box className={styles.urlRow}>
        <input
          className={styles.urlInput}
          type="text"
          placeholder="또는 이미지 URL 입력"
          value={url}
          disabled={isSubmitting}
          onChange={(event) => setUrl(event.target.value)}
          onKeyDown={handleUrlKeyDown}
          aria-label="커버 이미지 URL"
        />
        <Button size="sm" _disabled={{ color: "gray.500" }} disabled={!url.trim() || isSubmitting} onClick={() => void submitUrlValue(url)}>
          적용
        </Button>
        {hasCoverImage && (
          <Button size="sm" variant="danger-outline" disabled={isSubmitting} onClick={() => void removeCoverImage()}>
            삭제
          </Button>
        )}
      </Box>
    </Box>
  );
}
