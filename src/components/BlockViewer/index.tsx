import type { JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import { memo, useEffect, useMemo, useRef, type DragEvent } from "react";

import { setDraggedFileData, type DraggedFile } from "../../util/draggableFile";

import { createBlockExtensions } from "../BlockContent/extensions";
import { removeMediaElements } from "../BlockContent/removeMediaElements";
import type { LinkServices } from "../BlockContent/linkIcons";
import styles from "../BlockContent/style.module.css";

type Props = {
  content: string;
  className?: string;
  // 미리보기에서는 미디어·파일 첨부 블록을 문서에서 제외해 화면 DOM을 생성하지 않는다.
  hideMedia?: boolean;
  // 코드 블록이 처음에 자동 줄바꿈으로 보일지 — 만들어질 때 한 번만 반영된다.
  defaultCodeWrap?: boolean;
  // 카드 링크(#카드id)를 누르면 호출된다. 없으면 링크의 창 주소(#card=)로 이동한다.
  onOpenCard?: (cardId: string) => void;
  // 본문 이미지를 끌 때 사이트에 저장된 파일이면 그 정보를 돌려준다. 돌려주면 앱 안 파일 요소처럼 끌리고,
  // 없거나 null이면 브라우저 기본 끌기 그대로다. 안정된 함수를 넘긴다(바뀌면 뷰어가 다시 그려진다).
  getDraggedFile?: (url: string) => DraggedFile | null;
};

// 기존 일반 텍스트 기록은 HTML로 해석하지 않고 줄바꿈을 유지한다.
function normalizeContent(content: string, hideMedia: boolean): string | JSONContent {
  if (/^\s*<(?:p|h[1-6]|ul|ol|blockquote|details|pre|table|hr|img|audio|video|div)(?:\s|\/?>)/i.test(content)) {
    if (!hideMedia) return content;
    // template 내부는 비활성 문서다. 뷰어가 노드를 만들기 전에 첨부 요소를 제거한다.
    const template = document.createElement("template");
    template.innerHTML = content;
    removeMediaElements(template.content);
    return template.innerHTML;
  }
  return {
    type: "doc",
    content: content.split(/\r?\n/).map((text) => ({
      type: "paragraph",
      content: text ? [{ type: "text", text }] : [],
    })),
  };
}

function BlockViewer({ content, className, hideMedia = false, defaultCodeWrap, onOpenCard, getDraggedFile }: Props) {
  const document = useMemo(() => normalizeContent(content, hideMedia), [content, hideMedia]);
  // 확장은 뷰어가 만들어질 때 한 번 등록되므로, 링크는 이 ref로 최신 콜백을 읽는다.
  const linkServices = useRef<LinkServices>({});
  linkServices.current = { onOpenCard };
  const editor = useEditor({
    extensions: createBlockExtensions(undefined, defaultCodeWrap, undefined, true, linkServices),
    content: document,
    // 지연 로딩 중 렌더와 effect 사이에 에디터가 해제되지 않도록 effect에서 생성한다.
    immediatelyRender: false,
    editable: false,
    editorProps: { attributes: { class: styles.document } },
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.commands.setContent(document, { emitUpdate: false });
  }, [editor, document]);

  // 버블 단계에서 싣는다 — ProseMirror는 자기 dragstart에서 끌기 데이터를 비울 수 있어서 그 뒤에 실어야 남는다. 기본 주소 데이터는
  // draggableFileProps와 같이 함께 실어 바깥 앱으로 끄는 동작도 유지한다.
  const handleDragStart = (event: DragEvent<HTMLDivElement>) => {
    const target = event.target;
    if (!getDraggedFile || !(target instanceof HTMLImageElement)) return;
    const file = getDraggedFile(target.getAttribute("src") ?? "");
    if (file) setDraggedFileData(event.dataTransfer, file);
  };

  // display: contents라 레이아웃에는 끼지 않고 끌기 이벤트만 받는다.
  return (
    <div style={{ display: "contents" }} onDragStart={handleDragStart}>
      <EditorContent editor={editor} className={className} />
    </div>
  );
}

export default memo(BlockViewer);
