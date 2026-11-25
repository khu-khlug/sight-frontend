import { NodeSelection } from "@tiptap/pm/state";
import type { Selection } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import contentStyles from "../BlockContent/style.module.css";
import { BlockNodeSelection } from "./blockSelection";
import { startPointerGesture } from "./pointerGesture";
import styles from "./style.module.css";

// HTML 드래그 대신 포인터 이벤트를 사용해 휠 입력도 계속 받는다.
export function startBlockDrag(view: EditorView, start: PointerEvent, getPos: () => number | undefined) {
  if (start.button !== 0 || !start.isPrimary || !view.editable) return () => {};
  const doc = view.dom.ownerDocument;
  const originalDoc = view.state.doc;
  const originalSelection = view.state.selection;
  let source: Selection | null = null;
  let preview: HTMLElement | null = null;
  const cleanup = () => {
    preview?.remove();
    preview = null;
    view.dragging = null;
    view.dom.dispatchEvent(new Event("dragend", { bubbles: true }));
  };
  const restore = () => {
    if (source && !view.isDestroyed && view.state.doc === originalDoc) {
      view.dispatch(view.state.tr.setSelection(originalSelection));
    }
  };
  return startPointerGesture(view, start, {
    className: styles.blockDragging,
    start() {
      const pos = getPos();
      if (typeof pos !== "number") return false;
      const selection = view.state.selection;
      source = selection instanceof BlockNodeSelection && selection.blocks.some((block) => block.from <= pos && pos < block.to)
        ? selection : NodeSelection.create(view.state.doc, pos);
      const blocks = source instanceof BlockNodeSelection ? source.blocks : [{ from: pos }];
      preview = doc.createElement("div");
      preview.className = `${styles.dragPreview} ${contentStyles.document}`;
      preview.setAttribute("aria-hidden", "true");
      let width = 0;
      for (const block of blocks) {
        const nodeDOM = view.nodeDOM(block.from);
        if (!(nodeDOM instanceof HTMLElement)) continue;
        width = Math.max(width, nodeDOM.getBoundingClientRect().width);
        const clone = nodeDOM.cloneNode(true) as HTMLElement;
        clone.removeAttribute("id");
        clone.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));
        preview.append(clone);
      }
      preview.style.width = `${Math.min(width, 480)}px`;
      if (blocks.length > 1) {
        const badge = doc.createElement("span");
        badge.className = styles.dragCount;
        badge.textContent = `${blocks.length}개 블록`;
        preview.prepend(badge);
      }
      doc.body.append(preview);
      view.dispatch(view.state.tr.setSelection(source));
      view.dragging = { slice: source.content(), move: true };
      return true;
    },
    move(pointer) {
      if (preview) Object.assign(preview.style, { left: `${pointer.clientX + 12}px`, top: `${pointer.clientY + 12}px` });
      const target = doc.elementFromPoint(pointer.clientX, pointer.clientY);
      if (target && view.dom.contains(target)) {
        target.dispatchEvent(new DragEvent("dragover", {
          bubbles: true, cancelable: true, clientX: pointer.clientX, clientY: pointer.clientY,
          ctrlKey: pointer.ctrlKey, altKey: pointer.altKey,
        }));
      } else view.dom.dispatchEvent(new DragEvent("dragleave"));
    },
    finish(pointer, moved) {
      try {
        if (!moved || !source) return;
        const target = doc.elementFromPoint(pointer.clientX, pointer.clientY);
        if (target && view.dom.contains(target)) {
          const drop = new DragEvent("drop", {
            bubbles: true, cancelable: true, clientX: pointer.clientX, clientY: pointer.clientY,
            ctrlKey: pointer.ctrlKey, altKey: pointer.altKey,
          });
          target.dispatchEvent(drop);
          // 기본 DOM drop 처리기는 dataTransfer가 없어도 view.dragging을 비운다.
          // 직접 호출하는 처리기에도 묶음 목록 변환에 필요한 원본 정보를 전달한다.
          if (view.isDestroyed || view.state.doc !== originalDoc) return;
          view.dragging = { slice: source.content(), move: !pointer.ctrlKey };
          if (view.someProp("handleDrop", (handler) => handler(view, drop, source!.content(), !pointer.ctrlKey))) return;
        }
        restore();
      } finally { cleanup(); }
    },
    cancel() { restore(); cleanup(); },
  });
}
