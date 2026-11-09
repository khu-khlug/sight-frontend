import type { Node as TiptapNode, NodeViewRendererProps } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { NodeView } from "@tiptap/pm/view";
import katex from "katex";
import type { KatexOptions } from "katex";
import { mathEditingKey } from "../BlockEditor/mathEditing";
import { selectBeside } from "../BlockEditor/selectBeside";
import styles from "./math.module.css";

// LaTeX만 문서에 저장하고, 입력 상자를 열어 둔 상태는 편집기 플러그인이 관리한다.
export function withEditableMath<Options extends { katexOptions?: KatexOptions }, Storage>(extension: TiptapNode<Options, Storage>) {
  return extension.extend({
    addInputRules() { return []; },
    addNodeView() {
      const options = this.options.katexOptions;
      return ({ node, view, getPos }: NodeViewRendererProps): NodeView => {
        let current: ProseMirrorNode = node;
        const block = node.type.name === "blockMath";
        const doc = view.dom.ownerDocument;
        const win = doc.defaultView!;
        // div·span 유니언이면 addEventListener의 이벤트 타입이 Event로 넓어지므로 HTMLElement로 둔다.
        const dom: HTMLElement = doc.createElement(block ? "div" : "span");
        dom.className = `tiptap-mathematics-render ${styles.math}`;
        dom.dataset.type = block ? "block-math" : "inline-math";
        dom.setAttribute("data-math-node", "");
        dom.contentEditable = "false";
        const rendered = doc.createElement("span");
        rendered.className = styles.rendered;
        const input = doc.createElement("input");
        input.type = "text";
        input.className = styles.input;
        input.placeholder = "LaTeX 수식을 입력하세요";
        input.setAttribute("aria-label", "LaTeX 수식");
        let editing = false;
        let destroyed = false;
        let focusFrame: number | undefined;
        const setEditing = (value: number | null) => {
          view.dispatch(view.state.tr.setMeta(mathEditingKey, value).setMeta("addToHistory", false));
        };
        const render = () => {
          const pos = getPos();
          const nextEditing = view.editable && typeof pos === "number" && mathEditingKey.getState(view.state) === pos;
          dom.setAttribute("data-latex", current.attrs.latex ?? "");
          if (nextEditing) {
            if (input.value !== current.attrs.latex) input.value = current.attrs.latex ?? "";
            if (!editing) {
              editing = true;
              dom.replaceChildren(input);
              focusFrame = win.requestAnimationFrame(() => {
                if (!destroyed && editing) input.focus();
              });
            }
          } else {
            editing = false;
            if (focusFrame !== undefined) win.cancelAnimationFrame(focusFrame);
            if (!current.attrs.latex) rendered.textContent = "LaTeX 수식을 입력하세요";
            else {
              try {
                katex.render(current.attrs.latex, rendered, { ...options, displayMode: block, throwOnError: false });
              } catch { rendered.textContent = current.attrs.latex; }
            }
            dom.replaceChildren(rendered);
          }
        };
        dom.addEventListener("pointerdown", (event) => {
          if (!view.editable || editing || event.button !== 0) return;
          event.preventDefault();
          event.stopPropagation();
        });
        dom.addEventListener("click", (event) => {
          if (!view.editable || editing) return;
          event.preventDefault();
          event.stopPropagation();
          const pos = getPos();
          if (typeof pos === "number") setEditing(pos);
        });
        input.addEventListener("input", () => {
          const pos = getPos();
          if (typeof pos !== "number") return;
          view.dispatch(view.state.tr.setNodeMarkup(pos, undefined, { ...current.attrs, latex: input.value }));
        });
        input.addEventListener("blur", () => {
          if (!destroyed && editing && mathEditingKey.getState(view.state) === getPos()) setEditing(null);
        });
        // 방향키로 수식 앞뒤로 빠져나가면 렌더 모드로 돌아간다 — ↑/↓는 항상, ←/→는 입력창 맨 앞·맨 끝에서만.
        const leave = (direction: -1 | 1) => {
          const pos = getPos();
          if (typeof pos !== "number") return;
          selectBeside(view, pos, current.nodeSize, direction, (tr) => tr.setMeta(mathEditingKey, null));
        };
        input.addEventListener("keydown", (event) => {
          if (event.isComposing) return;
          const atStart = input.selectionStart === 0 && input.selectionEnd === 0;
          const atEnd = input.selectionStart === input.value.length && input.selectionEnd === input.value.length;
          if (event.key === "Enter") {
            event.preventDefault();
            setEditing(null);
            view.focus();
          } else if (event.key === "ArrowUp" || (event.key === "ArrowLeft" && atStart)) {
            event.preventDefault();
            leave(-1);
          } else if (event.key === "ArrowDown" || (event.key === "ArrowRight" && atEnd)) {
            event.preventDefault();
            leave(1);
          }
        });
        render();
        return {
          dom,
          update(updated) {
            if (updated.type !== current.type) return false;
            current = updated;
            render();
            return true;
          },
          stopEvent(event) { return !(event.type.startsWith("drag") || event.type === "drop"); },
          ignoreMutation() { return true; },
          destroy() {
            destroyed = true;
            if (focusFrame !== undefined) win.cancelAnimationFrame(focusFrame);
          },
        };
      };
    },
  });
}
