import { Extension } from "@tiptap/core";
import { Fragment, Slice } from "@tiptap/pm/model";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { NodeSelection, Plugin, Selection } from "@tiptap/pm/state";
import { dropPoint } from "@tiptap/pm/transform";
import type { EditorView } from "@tiptap/pm/view";
import { isListName, ITEM_TYPE } from "./convertList";
import { BlockNodeSelection } from "./blockSelection";
import { shouldShowHandle } from "./handlePolicy";
import styles from "./style.module.css";

const ITEM_NAMES = new Set(["listItem", "taskItem"]);

// 안내선과 실제 드롭이 같은 좌표·항목 타입으로 삽입 위치를 계산한다.
function resolveDropTarget(view: EditorView, event: DragEvent, slice: Slice) {
  let left = event.clientX;
  const wrapper = event.target instanceof Element ? event.target.closest(`.${styles.blockHandleWrapper}`) : null;
  if (wrapper && view.dom.contains(wrapper)) {
    const rect = wrapper.getBoundingClientRect();
    // 핸들은 목록 바깥에 있으므로 해당 항목의 본문 안쪽에서 같은 높이의 위치를 찾는다.
    if (left < rect.left) left = rect.left + Math.min(1, rect.width / 2);
  }
  const coords = view.posAtCoords({ left, top: event.clientY });
  if (!coords) return null;
  const { doc, schema } = view.state;
  const blockSelection = view.dragging && view.state.selection instanceof BlockNodeSelection ? view.state.selection : null;
  if (blockSelection?.blocks.some(({ from, to }) => coords.pos > from && coords.pos < to)) return null;
  const $mouse = doc.resolve(coords.pos);
  let targetItemName: string | undefined;
  for (let depth = $mouse.depth; depth > 0; depth -= 1) {
    const name = $mouse.node(depth).type.name;
    if (isListName(name)) {
      targetItemName = ITEM_TYPE[name];
      break;
    }
  }
  let convertedSlice = slice;
  if (targetItemName) {
    const targetItemType = schema.nodes[targetItemName];
    let converted = false;
    const children: ProseMirrorNode[] = [];
    const append = (child: ProseMirrorNode) => {
      // 묶음 선택의 목록 래퍼는 대상 목록 안에서 개별 항목으로 풀어 넣는다.
      if (blockSelection && isListName(child.type.name)) {
        converted = true;
        child.forEach(append);
        return;
      }
      if (ITEM_NAMES.has(child.type.name) && child.type !== targetItemType) {
        children.push(targetItemType.create(targetItemName === "taskItem" ? { checked: false } : null, child.content, child.marks));
        converted = true;
      } else if (blockSelection && !ITEM_NAMES.has(child.type.name)) {
        const content = child.type.name === "paragraph" ? Fragment.from(child)
          : Fragment.from([schema.nodes.paragraph.create(), child]);
        children.push(targetItemType.create(targetItemName === "taskItem" ? { checked: false } : null, content));
        converted = true;
      } else children.push(child);
    };
    slice.content.forEach(append);
    if (converted) convertedSlice = new Slice(Fragment.from(children), slice.openStart, slice.openEnd);
  }
  const pos = dropPoint(doc, coords.pos, convertedSlice) ?? coords.pos;
  if (blockSelection?.blocks.some(({ from, to }) => pos > from && pos < to)) return null;
  return {
    pos,
    slice: convertedSlice,
    adjusted: left !== event.clientX || convertedSlice !== slice,
    coords,
  };
}

function createDropCursor(view: EditorView) {
  const ownerDocument = view.dom.ownerDocument;
  const ownerWindow = ownerDocument.defaultView!;
  let cursor: HTMLDivElement | null = null;
  let lastEvent: DragEvent | null = null;
  let timer: number | undefined;
  const clear = () => {
    ownerWindow.clearTimeout(timer);
    cursor?.remove();
    cursor = null;
    lastEvent = null;
  };
  const draw = () => {
    if (!lastEvent || !view.editable) return clear();
    const target = resolveDropTarget(view, lastEvent, view.dragging?.slice ?? Slice.empty);
    if (!target) return clear();
    const node = target.coords.inside >= 0 ? view.state.doc.nodeAt(target.coords.inside) : null;
    const disabled = node?.type.spec.disableDropCursor;
    if (typeof disabled === "function" ? disabled(view, target.coords, lastEvent) : disabled) return clear();
    const $pos = view.state.doc.resolve(target.pos);
    let left: number, right: number, top: number, height: number;
    if (!$pos.parent.inlineContent && ($pos.nodeBefore || $pos.nodeAfter)) {
      const before = $pos.nodeBefore ? view.nodeDOM(target.pos - $pos.nodeBefore.nodeSize) : null;
      const after = $pos.nodeAfter ? view.nodeDOM(target.pos) : null;
      const beforeRect = before instanceof Element ? before.getBoundingClientRect() : null;
      const afterRect = after instanceof Element ? after.getBoundingClientRect() : null;
      const rect = beforeRect ?? afterRect;
      if (!rect) return clear();
      top = beforeRect && afterRect ? (beforeRect.bottom + afterRect.top) / 2 : beforeRect ? beforeRect.bottom : rect.top;
      left = rect.left;
      right = rect.right;
      top -= 1;
      height = 2;
    } else {
      const rect = view.coordsAtPos(target.pos);
      left = rect.left - 1;
      right = rect.left + 1;
      top = rect.top;
      height = rect.bottom - rect.top;
    }
    if (!cursor) {
      cursor = ownerDocument.createElement("div");
      cursor.className = styles.dropCursor;
      cursor.setAttribute("aria-hidden", "true");
      ownerDocument.body.append(cursor);
    }
    Object.assign(cursor.style, { left: `${left}px`, top: `${top}px`, width: `${right - left}px`, height: `${height}px` });
  };
  const dragover = (event: DragEvent) => {
    lastEvent = event;
    draw();
    ownerWindow.clearTimeout(timer);
    timer = ownerWindow.setTimeout(clear, 5000);
  };
  const dragleave = (event: DragEvent) => {
    if (!(event.relatedTarget instanceof Node) || !view.dom.contains(event.relatedTarget)) clear();
  };
  view.dom.addEventListener("dragover", dragover);
  view.dom.addEventListener("dragleave", dragleave);
  ownerDocument.addEventListener("drop", clear, true);
  ownerDocument.addEventListener("dragend", clear, true);
  ownerDocument.addEventListener("scroll", draw, true);
  ownerWindow.addEventListener("resize", draw);
  return {
    update: draw,
    destroy() {
      clear();
      view.dom.removeEventListener("dragover", dragover);
      view.dom.removeEventListener("dragleave", dragleave);
      ownerDocument.removeEventListener("drop", clear, true);
      ownerDocument.removeEventListener("dragend", clear, true);
      ownerDocument.removeEventListener("scroll", draw, true);
      ownerWindow.removeEventListener("resize", draw);
    },
  };
}

/*
 * 목록 항목을 끌어다 놓을 때 항상 놓인 자리의 목록 종류에 맞는 항목으로 바꿔 넣는다. 항목 타입이 다르면
 * (체크 항목 → 글머리 목록 등) 그 목록의 내용 규칙에 맞지 않아 ProseMirror가 놓을 자리를 못 찾거나 이상한
 * 구조로 넣기 때문이다. 항목 변환이나 핸들 좌표 보정이 없으면 기본 드롭 처리에 맡긴다.
 */
export const ConvertListDrop = Extension.create({
  name: "convertListDrop",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        view: createDropCursor,
        props: {
          handleDrop(view, event, slice, moved) {
            const target = resolveDropTarget(view, event, slice);
            // 포인터 기반 드롭에는 dataTransfer가 없어 기본 처리에 맡길 수 없다.
            if (!target || (!target.adjusted && event.dataTransfer)) return false;
            const convertedSlice = target.slice;
            const wasBlockSelection = view.state.selection instanceof BlockNodeSelection;

            // ProseMirror 기본 드롭 처리(prosemirror-view의 handlers.drop)와 같은 순서다 — 이동이면 먼저 원본을 지우고,
            // 지운 뒤의 위치로 옮겨 넣는다. 원본을 지울 때 항목이 비는 목록은 replaceRange가 함께 지운다.
            const insertPos = target.pos;
            const tr = view.state.tr;
            if (moved) tr.deleteSelection();
            const pos = tr.mapping.map(insertPos);
            const isNode = convertedSlice.openStart === 0 && convertedSlice.openEnd === 0 && convertedSlice.content.childCount === 1;
            const beforeInsert = tr.doc;
            if (isNode) tr.replaceRangeWith(pos, pos, convertedSlice.content.firstChild as ProseMirrorNode);
            else tr.replaceRange(pos, pos, convertedSlice);
            if (tr.doc.eq(beforeInsert)) return true;

            const $pos = tr.doc.resolve(pos);
            if (wasBlockSelection) {
              const blocks: { from: number; to: number }[] = [];
              tr.mapping.maps[tr.mapping.maps.length - 1].forEach((_oldFrom, _oldTo, newFrom, newTo) => {
                tr.doc.nodesBetween(newFrom, newTo, (node, from) => {
                  if (from < newFrom || from + node.nodeSize > newTo || !shouldShowHandle({ node, $pos: tr.doc.resolve(from) })) return;
                  blocks.push({ from, to: from + node.nodeSize });
                  return false;
                });
              });
              tr.setSelection(blocks.length ? new BlockNodeSelection(tr.doc, blocks) : Selection.near($pos));
            } else if (isNode && $pos.nodeAfter && NodeSelection.isSelectable($pos.nodeAfter)) {
              tr.setSelection(new NodeSelection($pos));
            } else {
              tr.setSelection(Selection.near($pos));
            }
            view.focus();
            view.dispatch(tr.setMeta("uiEvent", "drop"));
            return true;
          },
        },
      }),
    ];
  },
});
