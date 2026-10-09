import type { Node as TiptapNode, NodeViewRendererProps } from "@tiptap/core";
import { DOMSerializer } from "@tiptap/pm/model";
import type { Decoration, NodeView } from "@tiptap/pm/view";
import { shouldShowHandle, type HandlePolicyContext } from "./handlePolicy";
import { startBlockDrag } from "./pointerDrag";
import styles from "./style.module.css";

export type DragHandleOptions = {
  // 이 노드를 핸들 래퍼로 감쌀지 판단한다. false면 래퍼 없이 원래 DOM 그대로 그린다.
  // 기본값은 handlePolicy.ts의 shouldShowHandle이다.
  shouldWrap?: (context: HandlePolicyContext) => boolean;
};

// lucide의 grip-vertical을 복사한 것
// NodeView는 React가 아니라 DOM을 직접 만들어서 SVG 문자열로 둔다.
const GRIP_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="24" viewBox="0 0 12 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-grip-vertical preview-icon"><circle cx="3" cy="12" r="0.5"/><circle cx="3" cy="5" r="0.5"/><circle cx="3" cy="19" r="0.5"/><circle cx="9" cy="12" r="0.5"/><circle cx="9" cy="5" r="0.5"/><circle cx="9" cy="19" r="0.5"/></svg>`;

/*
 * 블록 노드 확장을 [원래 블록 + 왼쪽 드래그 핸들]을 담은 래퍼 div로 그리게 만든다.
 *
 * - 원래 블록의 DOM은 기존 NodeView(this.parent)가 있으면 그것을, 없으면 renderHTML(toDOM)
 *   결과를 그대로 쓴다. 그래서 textAlign 같은 속성이나 제목 레벨별 태그가 원래대로 나온다.
 * - 저장되는 HTML은 renderHTML로 나오므로 NodeView를 바꿔도 getHTML()과 뷰어는 달라지지 않는다.
 * - 핸들은 data-drag-handle 요소이고, 포인터 이동에서 블록을 NodeSelection으로 만들어
 *   통째로 옮긴다. 휠 입력을 받기 위해 HTML 드래그는 쓰지 않는다. spec.draggable은 켜지 않는다 — 켜면
 *   ProseMirror가 글 위 mousedown에서도 블록 전체를 드래그 대상으로 잡는다.
 * - 래퍼 여부는 뷰가 만들어질 때 shouldWrap으로 한 번만 판단한다. 블록이 다른 부모로 옮겨지면
 *   ProseMirror가 새 부모 아래에 뷰를 새로 만들므로 그때 다시 판단된다. update()에서는 판단하지 않는다 —
 *   갱신 도중의 getPos()는 이전 문서 기준이라, 거기서 판단하면 그대로 두어야 할 뷰(예: 펼친 접는 블록)가
 *   잘못 다시 만들어진다.
 */
export function withDragHandle<Options, Storage>(
  extension: TiptapNode<Options, Storage>,
  { shouldWrap = shouldShowHandle }: DragHandleOptions = {},
) {
  return extension.extend({
    addNodeView() {
      const parentNodeView = this.parent?.();

      return (props: NodeViewRendererProps): NodeView => {
        const { editor, node, getPos } = props;

        // 뷰가 만들어지는 시점의 getPos()는 새 문서 기준의 정확한 위치다.
        const pos = getPos();
        const wrapped = typeof pos === "number"
          && shouldWrap({ node, $pos: editor.state.doc.resolve(pos) });

        if (!wrapped) {
          // 빈 객체를 돌려주면 ProseMirror가 renderHTML 기반 기본 DOM으로 그린다.
          return parentNodeView?.(props) ?? ({} as unknown as NodeView);
        }

        const inner: NodeView = parentNodeView?.(props) ?? DOMSerializer.renderSpec(document, node.type.spec.toDOM!(node));

        // 체크 항목의 실제 내용 DOM에도 선택 상태를 전달한다. 외부 래퍼의 배경에 의존하지 않는다.
        const syncTaskSelection = (decorations: readonly Decoration[]) => {
          if (node.type.name !== "taskItem") return;
          const selected = decorations.some((decoration) => decoration.spec.blockSelected === true);
          if (inner.contentDOM instanceof HTMLElement) inner.contentDOM.classList.toggle(styles.selectedTaskContent, selected);
        };
        syncTaskSelection(props.decorations);

        const dom = document.createElement("div");
        dom.className = styles.blockHandleWrapper;

        const handle = document.createElement("div");
        handle.className = styles.blockHandle;
        handle.contentEditable = "false";
        handle.draggable = false;
        handle.setAttribute("data-drag-handle", "");
        handle.innerHTML = GRIP_ICON;

        dom.append(handle, inner.dom);

        let tableResizeObserver: ResizeObserver | undefined;
        let tableMutationObserver: MutationObserver | undefined;
        if (node.type.name === "table" && inner.dom instanceof HTMLElement) {
          const tableDom = inner.dom;
          let firstRow: HTMLTableRowElement | undefined;
          // 표의 위쪽 여백과 첫 행의 실제 높이를 반영해 전체 이동 핸들을 맞춘다.
          const alignTableHandle = () => {
            const row = tableDom.querySelector("table")?.rows[0];
            if (row !== firstRow) {
              if (firstRow) tableResizeObserver?.unobserve(firstRow);
              firstRow = row;
              if (firstRow) tableResizeObserver?.observe(firstRow);
            }
            if (!firstRow) return;
            const rowRect = firstRow.getBoundingClientRect();
            if (!rowRect.height) return;
            handle.style.top = `${rowRect.top - dom.getBoundingClientRect().top}px`;
            handle.style.height = `${rowRect.height}px`;
          };
          tableResizeObserver = new ResizeObserver(alignTableHandle);
          tableResizeObserver.observe(tableDom);
          // React가 표를 붙이거나 행 이동으로 첫 행이 교체된 뒤에도 관찰 대상을 갱신한다.
          tableMutationObserver = new MutationObserver(alignTableHandle);
          tableMutationObserver.observe(tableDom, { childList: true, subtree: true });
          alignTableHandle();
        }

        let cancelDrag: (() => void) | undefined;
        handle.addEventListener("pointerdown", (event) => {
          if (event.button !== 0 || !event.isPrimary) return;
          cancelDrag?.();
          cancelDrag = startBlockDrag(editor.view, event, getPos);
        });

        let current = node;

        return {
          dom,
          contentDOM: inner.contentDOM,
          update(newNode, decorations, innerDecorations) {
            if (newNode.type !== current.type) return false;
            // 원래 NodeView에 update가 없으면 ProseMirror 기본 규칙(같은 markup일 때만 유지)을 따른다.
            const kept = inner.update
              ? inner.update(newNode, decorations, innerDecorations)
              : newNode.sameMarkup(current);
            if (kept) {
              current = newNode;
              syncTaskSelection(decorations);
            }
            return kept;
          },
          selectNode() {
            if (inner.selectNode) inner.selectNode();
            else dom.classList.add("ProseMirror-selectednode");
          },
          deselectNode() {
            if (inner.deselectNode) inner.deselectNode();
            else dom.classList.remove("ProseMirror-selectednode");
          },
          setSelection: inner.setSelection ? (anchor, head, root) => inner.setSelection!(anchor, head, root) : undefined,
          stopEvent(event) {
            if (event.target instanceof Node && handle.contains(event.target)) {
              // 드래그와 드롭은 ProseMirror가 처리한다 — 핸들 클릭이 커서를 옮기지 않게 한다.
              return !(event.type.startsWith("drag") || event.type === "drop");
            }
            return inner.stopEvent?.(event) ?? false;
          },
          ignoreMutation(mutation) {
            if (handle.contains(mutation.target)) return true;
            // 행·열 드래그의 화면 이동은 문서 속성 변경으로 다시 읽지 않는다.
            if (node.type.name === "table" && mutation.type === "attributes" && mutation.attributeName === "style"
              && mutation.target instanceof HTMLElement && mutation.target.matches("td, th")) return true;
            if (node.type.name === "taskItem" && mutation.type === "attributes" && mutation.attributeName === "class"
              && (mutation.target === inner.dom || mutation.target === inner.contentDOM)) return true;
            if (inner.ignoreMutation) return inner.ignoreMutation(mutation);
            return !inner.contentDOM && mutation.type !== "selection";
          },
          destroy() {
            cancelDrag?.();
            tableResizeObserver?.disconnect();
            tableMutationObserver?.disconnect();
            inner.destroy?.();
          },
        };
      };
    },
  });
}
