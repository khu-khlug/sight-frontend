import type { JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import { memo, useEffect, useMemo, useRef } from "react";

import { createBlockExtensions } from "../BlockContent/extensions";
import type { LinkServices } from "../BlockContent/linkIcons";
import styles from "../BlockContent/style.module.css";

type Props = {
  content: string;
  className?: string;
  // 코드 블록이 처음에 자동 줄바꿈으로 보일지 — 만들어질 때 한 번만 반영된다.
  defaultCodeWrap?: boolean;
  // 카드 링크(#카드id)를 누르면 호출된다. 없으면 링크의 창 주소(#card=)로 이동한다.
  onOpenCard?: (cardId: string) => void;
};

// 기존 일반 텍스트 기록은 HTML로 해석하지 않고 줄바꿈을 유지한다.
function normalizeContent(content: string): string | JSONContent {
  if (/^\s*<(?:p|h[1-6]|ul|ol|blockquote|details|pre|table|hr|img|audio|video|div)(?:\s|\/?>)/i.test(content)) {
    return content;
  }
  return {
    type: "doc",
    content: content.split(/\r?\n/).map((text) => ({
      type: "paragraph",
      content: text ? [{ type: "text", text }] : [],
    })),
  };
}

function BlockViewer({ content, className, defaultCodeWrap, onOpenCard }: Props) {
  const document = useMemo(() => normalizeContent(content), [content]);
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

  return <EditorContent editor={editor} className={className} />;
}

export default memo(BlockViewer);
