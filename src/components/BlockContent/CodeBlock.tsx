import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import type { CodeBlockLowlightOptions } from "@tiptap/extension-code-block-lowlight";
import { TextSelection } from "@tiptap/pm/state";
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { WrapText } from "lucide-react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { createLowlight } from "lowlight";

import CodeLanguageMenu, { CodeLanguageLabel } from "./CodeLanguageMenu";
import styles from "./codeBlock.module.css";

function CodeBlockView({ node, editor, extension, updateAttributes, getPos }: NodeViewProps) {
  // 확장 옵션은 기본값만 제공한다. 각 NodeView는 생성 시 한 번 읽고 독립적으로 토글한다.
  const [wrap, setWrap] = useState(() => extension.options.defaultWrap as boolean);
  const codeAreaRef = useRef<HTMLDivElement>(null);
  const [gutter, setGutter] = useState({
    lines: [] as { top: number; height: number }[],
    fontSize: "", fontFamily: "",
  });
  const language = node.attrs.language as string | null;
  const lowlight = extension.options.lowlight as ReturnType<typeof createLowlight>;
  const languages = useMemo(() => lowlight.listLanguages(), [lowlight]);
  const detectedLanguage = useMemo(() => {
    if (language || !node.textContent.trim()) return null;
    const detected = lowlight.highlightAuto(node.textContent).data?.language;
    return typeof detected === "string" ? detected : null;
  }, [language, lowlight, node.textContent]);

  useLayoutEffect(() => {
    const area = codeAreaRef.current;
    if (!area) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const position = getPos();
      const code = area.querySelector("code");
      if (position === undefined || !code || editor.isDestroyed) return;
      const origin = area.getBoundingClientRect();
      const codeStyle = getComputedStyle(code);
      let offset = 0;
      const lines = node.textContent.split("\n").map((line) => {
        const coordinates = editor.view.coordsAtPos(position + 1 + offset, 1);
        offset += line.length + 1;
        return { top: coordinates.top - origin.top, height: coordinates.bottom - coordinates.top };
      });
      setGutter({ lines, fontSize: codeStyle.fontSize, fontFamily: codeStyle.fontFamily });
    };
    const scheduleMeasure = () => {
      cancelAnimationFrame(frame);
      // ProseMirror가 하이라이트 DOM을 반영한 뒤 위치만 읽는다. 선택 영역은 건드리지 않는다.
      frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(area);
    scheduleMeasure();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [editor, getPos, node.textContent, wrap]);

  return (
    <NodeViewWrapper
      className={styles.block}
      style={{ "--code-line-number-width": `${String(node.textContent.split("\n").length).length + 2}ch` } as CSSProperties}
    >
      <div className={styles.toolbar} contentEditable={false}>
        {editor.isEditable ? (
          <CodeLanguageMenu
            language={language}
            detectedLanguage={detectedLanguage}
            languages={languages}
            onSelect={(selectedLanguage) => updateAttributes({ language: selectedLanguage })}
          />
        ) : <CodeLanguageLabel language={language} detectedLanguage={detectedLanguage} />}
        <button
          type="button"
          className={styles.wrapButton}
          aria-label={wrap ? "가로스크롤로 보기" : "자동 줄바꿈으로 보기"}
          title={wrap ? "가로스크롤로 보기" : "자동 줄바꿈으로 보기"}
          aria-pressed={wrap}
          onClick={() => setWrap((previous) => !previous)}
        >
          <WrapText size={16} />
        </button>
      </div>
      <div ref={codeAreaRef} className={styles.codeContainer}>
        <div
          className={styles.lineNumbers}
          contentEditable={false}
          aria-hidden="true"
          style={{ fontSize: gutter.fontSize, fontFamily: gutter.fontFamily }}
        >
          {gutter.lines.map(({ top, height }, index) => (
            <span key={index} className={styles.lineNumber} style={{ top, height, lineHeight: `${height}px` }}>
              {index + 1}
            </span>
          ))}
        </div>
        <NodeViewContent<"pre">
          as="pre"
          className={styles.codeArea}
          style={{ whiteSpace: wrap ? "pre-wrap" : "pre", overflowWrap: wrap ? "anywhere" : "normal" }}
        />
      </div>
    </NodeViewWrapper>
  );
}

export const CodeBlock = CodeBlockLowlight.extend<CodeBlockLowlightOptions & { defaultWrap: boolean }>({
  addOptions() {
    // CodeBlockLowlight가 기본 옵션을 항상 제공하므로 parent는 반드시 있다.
    return { ...(this.parent?.() as CodeBlockLowlightOptions), defaultWrap: false };
  },
  addKeyboardShortcuts() {
    return {
      ...(this.parent?.() ?? {}),
      Backspace: () => {
        const selection = this.editor.state.selection;
        // 블록 안의 시작점(빈 블록 포함)에서는 노드 해제·병합을 막는다.
        // 텍스트 삭제나 블록 밖에서의 삭제는 기존 키맵으로 넘긴다.
        return selection instanceof TextSelection
          && selection.empty
          && selection.$from.parent.type === this.type
          && selection.$from.parentOffset === 0;
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView, { contentDOMElementTag: "code" });
  },
});
