import { mergeAttributes, Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Download } from "lucide-react";
import type { DragEvent } from "react";

import { formatFileSize } from "../../util/formatFileSize";
import { draggableFileProps } from "../../util/draggableFile";
import AppTooltip from "../AppTooltip";
import MaterialFileIcon from "../MaterialFileIcon";
import styles from "./fileAttachment.module.css";

export type FileAttachmentAttrs = { src: string; name: string; size: number | null; contentType: string | null };

function FileAttachmentView({ node }: NodeViewProps) {
  const { src, name, size, contentType } = node.attrs as FileAttachmentAttrs;
  const dragProps = draggableFileProps({ url: src, name, size: size ?? undefined, contentType: contentType ?? undefined });
  return (
    // data-type은 BlockEditor가 이 블록의 드래그 핸들 높이를 고르는 데 쓴다.
    <NodeViewWrapper
      className={styles.file}
      contentEditable={false}
      data-type="file-attachment"
      draggable={dragProps.draggable}
      // NodeViewWrapper는 onDragStart를 자체 핸들러로 덮어쓴다. 캡처에서 파일 데이터를 넣는다.
      onDragStartCapture={(event: DragEvent<HTMLDivElement>) => {
        dragProps.onDragStart(event);
        event.dataTransfer.effectAllowed = "copy";
        event.stopPropagation();
      }}
    >
      <span className={styles.icon}>
        <MaterialFileIcon fileName={name} />
      </span>
      <span className={styles.name}>{name}</span>
      {size !== null && <span className={styles.size}>{formatFileSize(size)}</span>}
      <AppTooltip content="다운로드" placement="top">
        {/* 다른 출처의 주소는 브라우저가 download 속성을 무시하고 연다 — 편집 중인 페이지를 떠나지 않도록 새 탭으로 연다. */}
        <a
          className={styles.download}
          href={src}
          download={name}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${name} 다운로드`}
          data-file-download=""
        >
          <Download size={16} />
        </a>
      </AppTooltip>
    </NodeViewWrapper>
  );
}

/*
 * 이미지·오디오가 아닌 일반 파일을 [확장자 아이콘 · 파일명 · 용량 · 다운로드] 박스로 보여주는 블록이다.
 * 문서에는 주소와 파일 정보만 data 속성으로 저장하고, 모양은 에디터·뷰어 모두 이 NodeView가 그린다.
 * renderHTML의 <a>는 NodeView 없이 HTML만 볼 때도 내려받을 수 있게 하는 대체 표시다.
 */
export const FileAttachment = Node.create({
  name: "fileAttachment",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-src") ?? "",
        renderHTML: (attributes) => ({ "data-src": attributes.src }),
      },
      name: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-name") ?? "",
        renderHTML: (attributes) => ({ "data-name": attributes.name }),
      },
      size: {
        default: null,
        parseHTML: (element) => {
          const size = Number(element.getAttribute("data-size"));
          return element.hasAttribute("data-size") && Number.isSafeInteger(size) && size >= 0 ? size : null;
        },
        renderHTML: (attributes) => (attributes.size === null ? {} : { "data-size": String(attributes.size) }),
      },
      contentType: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-content-type"),
        renderHTML: (attributes) => (attributes.contentType === null ? {} : { "data-content-type": attributes.contentType }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="file-attachment"]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "div",
      mergeAttributes({ "data-type": "file-attachment" }, HTMLAttributes),
      ["a", { href: node.attrs.src, download: node.attrs.name }, node.attrs.name],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FileAttachmentView, {
      // 파일 드래그 데이터를 ProseMirror가 블록 이동 데이터로 덮어쓰지 않게 한다.
      // 다운로드 링크 클릭도 노드 선택으로 가로채지 않는다.
      stopEvent: ({ event }) => event.type === "dragstart"
        || (event.target instanceof Element && event.target.closest("[data-file-download]") !== null),
    });
  },
});
