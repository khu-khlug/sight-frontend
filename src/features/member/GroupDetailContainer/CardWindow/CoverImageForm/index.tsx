import { Box, Text } from "@chakra-ui/react";
import { ImagePlus } from "lucide-react";
import { ChangeEvent, ClipboardEvent, KeyboardEvent, useRef, useState } from "react";
import { toast } from "react-toastify";

import { KanbanApi, type CardCoverImageInput } from "../../../../../api/public/group/KanbanApi";
import Button from "../../../../../components/Button";
import { useDropTarget } from "../../../../../hooks/dragAndDrop/useDropTarget";
import { cn } from "../../../../../util/cn";
import { isImageUrl } from "../../../../../util/isImageUrl";
import styles from "./style.module.css";

// 다른 업로드(활동보고서, GroupExposureApi) 20MB보다 커버이미지는 더 작게 잡는다.
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

type Props = {
  groupId: number;
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
      await onSubmit({ coverImageUrl: null });
      onClose();
    } catch {
      // useGroupAction이 오류를 표시하고 폼은 재시도할 수 있도록 유지한다.
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 커버로 설정할 수 있습니다.", { autoClose: 2500, hideProgressBar: true });
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error("이미지 용량이 너무 커서 설정할 수 없습니다 (최대 10MB).", { autoClose: 2500, hideProgressBar: true });
      return;
    }
    setIsSubmitting(true);
    try {
      const upload = await KanbanApi.issueCardCoverImageUploadLink(groupId, cardId, { fileName: file.name, contentType: file.type });
      await KanbanApi.uploadCardCoverImageFile(upload.url, file);
      await onSubmit({ fileUploadId: upload.fileUploadId });
      onClose();
    } catch {
      // 실패 토스트는 onSubmit을 감싼 useGroupAction(onError)이 이미 띄운다 — 여기서는
      // 폼을 닫지 않고 그대로 둬서 사용자가 다시 시도할 수 있게 한다.
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitUrlValue = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || isSubmitting) return;
    setIsSubmitting(true);
    try {
      // 파일 업로드(submitFile)는 File.type으로 바로 검증되지만, URL은 실제로 불러와
      // 보기 전엔 이미지인지 알 수 없다 — <img> 로딩 성공 여부로 확인한다.
      if (!(await isImageUrl(trimmed))) {
        toast.error("이미지로 불러올 수 없는 URL입니다.", { autoClose: 2500, hideProgressBar: true });
        return;
      }
      await onSubmit({ coverImageUrl: trimmed });
      onClose();
    } catch {
      // 위와 같음.
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
