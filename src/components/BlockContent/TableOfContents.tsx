import { Node } from "@tiptap/core";
import type { Editor } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorState } from "@tiptap/pm/state";
import { insertPoint } from "@tiptap/pm/transform";
import { NodeViewWrapper, ReactNodeViewRenderer, useEditorState } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

import { cn } from "../../util/cn";
import { openCollapsedAncestors } from "./revealPosition";
import styles from "./tableOfContents.module.css";
import { buildTocRows, touchesHeadings } from "./tocTree";
import type { TocRow, TocSegment } from "./tocTree";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    tableOfContents: {
      // 목차가 있으면 없애고, 없으면 넣는다.
      toggleTableOfContents: () => ReturnType;
      // 지난 갱신 이후 제목이 바뀌었으면 목차를 다시 그린다.
      refreshTableOfContents: () => ReturnType;
    };
  }
}

const NODE_NAME = "tableOfContents";

/*
 * 목차 상태는 문서가 아니라 플러그인 상태에 둔다.
 * - version: 편집기 목차가 다시 그려질 때마다 오른다. 갱신 요청(refreshTableOfContents)이 올 때 dirty일 때만 오른다.
 * - dirty: 지난 갱신 이후 제목을 건드린 입력이 있었는지.
 * - count: 문서에 있는 목차 수 — 둘 이상이면 앞의 것만 남긴다.
 * - lastPos: 이 편집 중에 목차를 끈 자리. 다시 켜면 여기에 넣는다. 편집기 메모리에만 있고 저장되지 않는다.
 */
type TocState = { version: number; dirty: boolean; count: number; lastPos: number | null };
type TocMeta = { refresh: true } | { removedAt: number } | { inserted: true };

const tocKey = new PluginKey<TocState>(NODE_NAME);

function findTocPositions(doc: ProseMirrorNode): number[] {
  const positions: number[] = [];
  doc.descendants((node, pos) => {
    if (node.type.name === NODE_NAME) positions.push(pos);
    return node.type.name !== NODE_NAME;
  });
  return positions;
}

export function hasTableOfContents(state: EditorState): boolean {
  return (tocKey.getState(state)?.count ?? 0) > 0;
}

// 트리 글자 — 자기 가지 칸은 부모 글자 시작 열에 ├─/└─를 두고 한 칸 띄운다(칸 하나 = 3글자).
// 제목이 줄바꿈되면 아랫줄에는 이어지는 세로선만 남긴다.
const FIRST_LINE: Record<TocSegment, string> = { branch: "├─ ", last: "└─ ", through: "│  ", blank: "   " };
const NEXT_LINES: Record<TocSegment, string> = { branch: "│  ", last: "   ", through: "│  ", blank: "   " };

// 접힌 블록 안의 제목이면 바깥쪽부터 펼친 뒤 그 제목으로 스크롤한다.
function goToHeading(editor: Editor, pos: number) {
  openCollapsedAncestors(editor, pos);
  requestAnimationFrame(() => {
    const target = editor.view.nodeDOM(pos);
    if (target instanceof HTMLElement) target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function TocRowView({ row, onClick }: { row: TocRow; onClick?: () => void }) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [lines, setLines] = useState(1);

  // 제목이 몇 줄로 줄바꿈됐는지 재서, 트리 글자도 그 줄 수만큼 이어 그린다.
  useLayoutEffect(() => {
    const element = textRef.current;
    if (!element || !row.segments.length) return;
    const measure = () => {
      const lineHeight = parseFloat(getComputedStyle(element).lineHeight);
      if (lineHeight > 0) setLines(Math.max(1, Math.round(element.getBoundingClientRect().height / lineHeight)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [row.segments.length]);

  const prefix = row.segments.length
    ? [
      row.segments.map((segment) => FIRST_LINE[segment]).join(""),
      ...Array.from({ length: lines - 1 }, () => row.segments.map((segment) => NEXT_LINES[segment]).join("")),
    ].join("\n")
    : null;

  return (
    <div className={styles.row}>
      {prefix && <span className={styles.prefix} aria-hidden="true">{prefix}</span>}
      <span
        ref={textRef}
        className={cn(styles.text, onClick && styles.clickable)}
        role={onClick ? "link" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={onClick ? (event) => { if (event.key === "Enter") onClick(); } : undefined}
      >
        {row.heading.text}
      </span>
    </div>
  );
}

function TableOfContentsView({ editor }: NodeViewProps) {
  // 편집기에서는 갱신 요청이 올 때(version)만 다시 계산한다. 뷰어는 본문이 바뀔 때마다 다시 계산한다.
  const trigger = useEditorState({
    editor,
    selector: ({ editor: current }) => (current.isEditable ? tocKey.getState(current.state)?.version ?? 0 : current.state.doc),
    // 문서는 불변 객체라 참조만 비교하면 된다(기본 비교는 깊은 비교라 문서 전체를 훑는다).
    equalityFn: (previous, next) => previous === next,
  });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rows = useMemo(() => buildTocRows(editor.state.doc), [editor, trigger]);
  const editable = editor.isEditable;

  return (
    <NodeViewWrapper
      className={cn(styles.toc, !editable && !rows.length && styles.hidden)}
      contentEditable={false}
      data-type="table-of-contents"
    >
      <div className={styles.title}>목차</div>
      {rows.length ? rows.map((row) => (
        <TocRowView
          key={row.heading.pos}
          row={row}
          // 편집기에서는 이동하지 않는다.
          onClick={editable ? undefined : () => goToHeading(editor, row.heading.pos)}
        />
      )) : <span className={styles.empty}>목차에 표시할 제목이 없습니다</span>}
    </NodeViewWrapper>
  );
}

/*
 * 문서 안의 제목들을 트리로 보여주는 블록이다. 문서에 하나만 둘 수 있다.
 * 저장되는 HTML에는 자리 표시(<nav data-type="toc">)만 남고, 항목은 그릴 때마다 그 문서의 제목으로 만든다.
 */
export const TableOfContents = Node.create({
  name: NODE_NAME,
  group: "block",
  atom: true,

  parseHTML() {
    return [{ tag: 'nav[data-type="toc"]' }];
  },

  renderHTML() {
    return ["nav", { "data-type": "toc" }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TableOfContentsView);
  },

  addCommands() {
    return {
      toggleTableOfContents: () => ({ state, tr, dispatch }) => {
        const [existing] = findTocPositions(state.doc);
        if (existing !== undefined) {
          if (dispatch) {
            tr.delete(existing, existing + state.doc.nodeAt(existing)!.nodeSize).setMeta(tocKey, { removedAt: existing } satisfies TocMeta);
          }
          return true;
        }
        // 이 편집 중에 끈 자리가 있으면 거기에, 없으면 기록 맨 앞에 넣는다.
        const remembered = tocKey.getState(state)?.lastPos ?? null;
        const at = (remembered !== null ? insertPoint(state.doc, remembered, this.type) : null) ?? insertPoint(state.doc, 0, this.type);
        if (at === null) return false;
        if (dispatch) tr.insert(at, this.type.create()).setMeta(tocKey, { inserted: true } satisfies TocMeta);
        return true;
      },
      refreshTableOfContents: () => ({ tr, dispatch }) => {
        if (dispatch) tr.setMeta(tocKey, { refresh: true } satisfies TocMeta).setMeta("addToHistory", false);
        return true;
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin<TocState>({
        key: tocKey,
        state: {
          init: (_config, state) => ({ version: 0, dirty: false, count: findTocPositions(state.doc).length, lastPos: null }),
          apply(tr, previous) {
            let { version, dirty, count, lastPos } = previous;
            if (tr.docChanged) {
              if (lastPos !== null) lastPos = tr.mapping.map(lastPos);
              dirty ||= touchesHeadings(tr);
              count = findTocPositions(tr.doc).length;
            }
            const meta = tr.getMeta(tocKey) as TocMeta | undefined;
            if (meta && "removedAt" in meta) lastPos = meta.removedAt;
            if (meta && "inserted" in meta) lastPos = null;
            if (meta && "refresh" in meta && dirty) {
              version += 1;
              dirty = false;
            }
            if (version === previous.version && dirty === previous.dirty && count === previous.count && lastPos === previous.lastPos) return previous;
            return { version, dirty, count, lastPos };
          },
        },
        // 붙여넣기 등으로 목차가 둘 이상 되면 앞의 것만 남긴다 — 내용은 어차피 같은 문서의 제목들이라 같다.
        appendTransaction(_transactions, _oldState, newState) {
          if ((tocKey.getState(newState)?.count ?? 0) < 2) return null;
          const [, ...extras] = findTocPositions(newState.doc);
          const tr = newState.tr;
          for (const pos of extras.reverse()) tr.delete(pos, pos + newState.doc.nodeAt(pos)!.nodeSize);
          return tr;
        },
      }),
    ];
  },
});
