import { NodeViewWrapper, useEditorState } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { LoaderCircle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, ClipboardEvent, DragEvent, KeyboardEvent } from "react";

import { cn } from "../../../util/cn";
import AppTooltip from "../../AppTooltip";
import { selectBeside } from "../selectBeside";
import { acceptFor, describeMediaInput, MEDIA_KINDS } from "./mediaKinds";
import {
  mediaInputKey, pendingFocus, readDroppedItems, submitMediaItems, submitMediaUrl,
} from "./mediaInputState";
import type { MediaInputAttrs, MediaInputOptions } from "./mediaInputState";
import styles from "./style.module.css";

export default function MediaInputView({ node, editor, extension, getPos, deleteNode }: NodeViewProps) {
  const { kind, id } = node.attrs as MediaInputAttrs;
  const config = MEDIA_KINDS[kind];
  const Icon = config.icon;
  const canUpload = !!(extension.options as MediaInputOptions).services?.current.uploadFile;
  // 진행·오류 상태는 플러그인 상태에 있어서, 바뀔 때 이 박스만 다시 그리도록 구독한다.
  const status = useEditorState({
    editor,
    selector: ({ editor: current }) => (current ? mediaInputKey.getState(current.state)?.get(id) ?? null : null),
  });
  const busy = status?.busy === true;
  const guide = describeMediaInput(kind, canUpload);
  const [url, setUrl] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (pendingFocus.delete(id)) inputRef.current?.focus();
  }, [id]);

  const remove = () => {
    deleteNode();
    editor.commands.focus();
  };

  const submitUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || busy) return;
    submitMediaUrl(editor, id, kind, trimmed);
  };

  // 박스 앞(-1)이나 뒤(1)의 가장 가까운 블록으로 커서를 옮긴다. 그쪽에 블록이 없으면 빈 문단을 만들어 옮긴다.
  const leave = (direction: -1 | 1) => {
    const pos = getPos();
    if (typeof pos === "number") selectBeside(editor.view, pos, node.nodeSize, direction);
  };

  // 한 줄 입력창이라 위아래 방향키는 박스를 빠져나가는 데 쓴다.
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Enter") {
      event.preventDefault();
      submitUrl(url);
    } else if (event.key === "Escape") {
      event.preventDefault();
      remove();
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      leave(event.key === "ArrowUp" ? -1 : 1);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length) submitMediaItems(editor, id, files.map((file) => ({ kind: "file", file })));
  };

  // 파일을 붙여넣으면 올리고, 글(주소)을 붙여넣으면 입력창에 그대로 들어간다.
  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const files = Array.from(event.clipboardData.files);
    if (!files.length || busy) return;
    event.preventDefault();
    submitMediaItems(editor, id, files.map((file) => ({ kind: "file", file })));
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragOver(false);
  };
  // 파일은 본문에 놓을 때와 같은 방식으로 이 박스 자리에 넣고, 주소(링크)만 끌어오면 입력창 주소로 처리한다.
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    if (busy) return;
    const items = readDroppedItems(event.dataTransfer);
    if (items.length) {
      submitMediaItems(editor, id, items);
      return;
    }
    const dropped = event.dataTransfer.getData("text/uri-list") || event.dataTransfer.getData("text/plain");
    if (!dropped.trim()) return;
    setUrl(dropped.trim());
    submitUrl(dropped);
  };

  return (
    <NodeViewWrapper
      className={cn(styles.box, isDragOver && styles.dragOver)}
      contentEditable={false}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      <div className={styles.row}>
        <Icon className={styles.kindIcon} aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          data-media-input-url=""
          className={styles.urlInput}
          placeholder={config.urlPlaceholder}
          value={url}
          disabled={busy}
          onChange={(event) => setUrl(event.target.value)}
          onKeyDown={handleKeyDown}
          aria-label={`${config.label} 주소`}
        />
        <button
          type="button"
          className={styles.button}
          disabled={busy || !canUpload}
          onClick={() => fileInputRef.current?.click()}
        >
          파일 선택
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptFor(kind)}
          className={styles.hiddenFileInput}
          onChange={handleFileChange}
          aria-label={`${config.label} 파일 선택`}
        />
        <AppTooltip content="닫기" placement="top">
          <button type="button" className={styles.iconButton} onClick={remove} aria-label="닫기">
            <X size={16} />
          </button>
        </AppTooltip>
      </div>
      {/* 진행·오류 문구가 있으면 사용법 대신 보여준다. */}
      {status ? (
        <p className={cn(styles.message, styles.status, !status.busy && styles.error)} role="status">
          {busy && <LoaderCircle size={14} className={styles.spinner} aria-hidden="true" />}
          {status.message}
        </p>
      ) : guide.length > 0 && (
        // 본문의 목록 스타일(.document ul)이 적용되지 않도록 목록 요소 대신 div를 쓴다.
        <div className={cn(styles.message, styles.guide)}>
          {guide.map((line) => <div key={line}>{line}</div>)}
        </div>
      )}
    </NodeViewWrapper>
  );
}
