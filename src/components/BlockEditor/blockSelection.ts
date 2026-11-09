import { Extension } from "@tiptap/core";
import { Fragment, Slice } from "@tiptap/pm/model";
import type { Node as ProseMirrorNode, ResolvedPos } from "@tiptap/pm/model";
import { Plugin, Selection, SelectionRange, TextSelection } from "@tiptap/pm/state";
import type { EditorState, SelectionBookmark } from "@tiptap/pm/state";
import type { Mappable } from "@tiptap/pm/transform";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { EditorView } from "@tiptap/pm/view";
import { shouldShowHandle } from "./handlePolicy";
import { startPointerGesture } from "./pointerGesture";
import styles from "./style.module.css";

export type BlockRange = { from: number; to: number };
const isItem = (node: ProseMirrorNode) => node.type.name === "listItem" || node.type.name === "taskItem";
const FRAMED_BLOCKS = new Set(["codeBlock", "image", "audio", "youtube"]);

function includeFullySelectedQuotes(doc: ProseMirrorNode, hits: BlockRange[], quotes: BlockRange[]) {
  const blocks = hits.filter(({ from }) => doc.nodeAt(from)?.type.name !== "blockquote");
  const covered = (node: ProseMirrorNode, from: number): boolean => {
    if (blocks.some((range) => range.from <= from && range.to >= from + node.nodeSize)) return true;
    if (node.isLeaf || node.isTextblock || !node.childCount) return false;
    let all = true;
    node.forEach((child, offset) => { if (!covered(child, from + 1 + offset)) all = false; });
    return all;
  };
  // 중첩 인용부터 올려 선택한다. 목록은 모든 항목이 선택되어야 전체 내용으로 인정한다.
  for (const quote of [...quotes].reverse()) {
    const node = doc.nodeAt(quote.from)!;
    if (covered(node, quote.from)) blocks.push(quote);
  }
  return blocks;
}

function normalize(doc: ProseMirrorNode, ranges: BlockRange[]) {
  const result: BlockRange[] = [];
  for (const range of [...ranges].sort((a, b) => a.from - b.from || b.to - a.to)) {
    const node = doc.nodeAt(range.from);
    if (!node || range.to !== range.from + node.nodeSize) continue;
    if (!result.some((parent) => parent.from <= range.from && parent.to >= range.to)) result.push(range);
  }
  return result;
}

// 비연속 선택을 하나의 from~to로 합치지 않는다. 사이의 미선택 블록은 이동하지 않는다.
export class BlockNodeSelection extends Selection {
  readonly blocks: BlockRange[];
  constructor(doc: ProseMirrorNode, blocks: BlockRange[]) {
    const normalized = normalize(doc, blocks);
    if (!normalized.length) throw new RangeError("Block selection requires at least one block");
    const ranges = normalized.map(({ from, to }) => new SelectionRange(doc.resolve(from), doc.resolve(to)));
    super(ranges[0].$from, ranges[ranges.length - 1].$to, ranges);
    this.blocks = normalized;
  }
  get $to(): ResolvedPos { return this.ranges[this.ranges.length - 1].$to; }
  eq(other: Selection) {
    return other instanceof BlockNodeSelection && other.blocks.length === this.blocks.length
      && this.blocks.every((block, index) => block.from === other.blocks[index].from && block.to === other.blocks[index].to);
  }
  map(doc: ProseMirrorNode, mapping: Mappable): Selection {
    const blocks = normalize(doc, this.blocks.flatMap(({ from, to }) => {
      const start = mapping.mapResult(from, 1), end = mapping.mapResult(to, -1);
      return start.deleted && end.deleted ? [] : [{ from: start.pos, to: end.pos }];
    }));
    return blocks.length ? new BlockNodeSelection(doc, blocks) : Selection.near(doc.resolve(Math.min(mapping.map(this.from), doc.content.size)));
  }
  content() {
    const doc = this.$from.doc;
    const nodes: ProseMirrorNode[] = [];
    let listParent: ProseMirrorNode | null = null;
    let listItems: ProseMirrorNode[] = [];
    let listStart = 0;
    const flush = () => {
      if (listParent && listItems.length) {
        const attrs = listParent.type.name === "orderedList" ? { ...listParent.attrs, start: (listParent.attrs.start ?? 1) + listStart } : listParent.attrs;
        nodes.push(listParent.type.create(attrs, listItems, listParent.marks));
      }
      listParent = null;
      listItems = [];
    };
    for (const { from } of this.blocks) {
      const node = doc.nodeAt(from)!;
      const $pos = doc.resolve(from);
      if (isItem(node)) {
        if (listParent !== $pos.parent) { flush(); listParent = $pos.parent; listStart = $pos.index(); }
        listItems.push(node);
      } else { flush(); nodes.push(node); }
    }
    flush();
    return new Slice(Fragment.from(nodes), 0, 0);
  }
  toJSON() { return { type: "blockNodes", blocks: this.blocks }; }
  static fromJSON(doc: ProseMirrorNode, json: { blocks: BlockRange[] }) { return new BlockNodeSelection(doc, json.blocks); }
  getBookmark() {
    const bookmark = (blocks: BlockRange[]): SelectionBookmark => ({
      map: (mapping: Mappable) => bookmark(blocks.map(({ from, to }) => ({ from: mapping.map(from, 1), to: mapping.map(to, -1) }))),
      resolve: (doc: ProseMirrorNode) => {
        const valid = normalize(doc, blocks);
        return valid.length ? new BlockNodeSelection(doc, valid) : Selection.near(doc.resolve(Math.min(blocks[0]?.from ?? 0, doc.content.size)));
      },
    });
    return bookmark(this.blocks);
  }
}
BlockNodeSelection.prototype.visible = false;
try {
  Selection.jsonID("blockNodes", BlockNodeSelection);
} catch (error) {
  // 개발 중 모듈 갱신 시 같은 선택 종류가 다시 등록될 수 있다.
  if (!(error instanceof RangeError) || !error.message.includes("Duplicate use of selection JSON ID")) throw error;
}

type Hit = "text" | "blank" | "control";
const controls = '[data-drag-handle], [data-math-node], [data-link-icon], [data-type="file-attachment"], button, input, textarea, select, label, a, iframe, video, audio, img, [role="button"], [role="slider"], [data-part="scrollbar"], [data-part="thumb"]';
function hitAt(view: EditorView, viewport: HTMLElement, x: number, y: number): Hit {
  const doc = view.dom.ownerDocument;
  const target = doc.elementFromPoint(x, y);
  if (!target || !viewport.contains(target) || target.closest(controls)) return "control";
  // 표 내부의 빈 셀·경계는 셀 편집과 열 크기 조절이 처리한다.
  if (target.closest("table, [data-table-control], [data-table-viewport]")) return "control";
  const bounds = viewport.getBoundingClientRect();
  // 네이티브 스크롤바도 선택 시작 영역에서 제외한다.
  if (x >= bounds.left + viewport.clientLeft + viewport.clientWidth || y >= bounds.top + viewport.clientTop + viewport.clientHeight) return "control";
  if (!view.dom.contains(target)) return "blank";
  const block = target.closest("p, h1, h2, h3, h4, h5, h6, pre, summary, td, th");
  if (!block) return "blank";
  const walker = doc.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  for (let text = walker.nextNode(); text; text = walker.nextNode()) {
    const range = doc.createRange();
    range.selectNodeContents(text);
    for (const rect of Array.from(range.getClientRects())) {
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) return "text";
    }
  }
  return "blank";
}

function createAttachedSelectionView(view: EditorView, viewport: HTMLElement) {
  const doc = view.dom.ownerDocument;
  let cancelGesture: (() => void) | undefined;
  let destroyed = false;
  let selecting = false;
  let marquee: HTMLDivElement | null = null;
  const setCursor = (event: PointerEvent) => {
    if (!view.editable || selecting || view.dragging) return;
    const hit = hitAt(view, viewport, event.clientX, event.clientY);
    const cursor = hit === "text" ? "text" : "default";
    viewport.style.cursor = cursor;
    view.dom.style.cursor = cursor;
  };
  const resetCursor = () => { viewport.style.removeProperty("cursor"); view.dom.style.removeProperty("cursor"); };
  const setBlocks = (blocks: BlockRange[]) => {
    const selection = blocks.length ? new BlockNodeSelection(view.state.doc, blocks)
      : Selection.near(view.state.doc.resolve(view.state.selection.from));
    if (!view.state.selection.eq(selection)) view.dispatch(view.state.tr.setSelection(selection).setMeta("addToHistory", false));
  };
  const cleanup = () => { marquee?.remove(); marquee = null; selecting = false; resetCursor(); };
  const down = (event: PointerEvent) => {
    if (!view.editable || event.button !== 0 || !event.isPrimary || view.dragging) return;
    const hit = hitAt(view, viewport, event.clientX, event.clientY);
    if (hit === "control") return;
    if (hit === "text") {
      if (view.state.selection instanceof BlockNodeSelection) setBlocks([]);
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    cancelGesture?.();
    const originalDoc = view.state.doc;
    const originalSelection = view.state.selection;
    const initialRect = view.dom.getBoundingClientRect();
    // 시작점은 문서 좌표에 고정하고, 스크롤 이후 화면 좌표를 다시 계산한다.
    const origin = { x: event.clientX - initialRect.left, y: event.clientY - initialRect.top };
    cancelGesture = startPointerGesture(view, event, {
      className: styles.blockSelecting,
      start() {
        selecting = true;
        marquee = doc.createElement("div");
        marquee.className = styles.selectionMarquee;
        marquee.setAttribute("aria-hidden", "true");
        doc.body.append(marquee);
        return true;
      },
      move(pointer) {
        const rootRect = view.dom.getBoundingClientRect();
        const bounds = viewport.getBoundingClientRect();
        const box = {
          left: Math.min(rootRect.left + origin.x, pointer.clientX), right: Math.max(rootRect.left + origin.x, pointer.clientX),
          top: Math.min(rootRect.top + origin.y, pointer.clientY), bottom: Math.max(rootRect.top + origin.y, pointer.clientY),
        };
        const visible = { left: Math.max(box.left, bounds.left), right: Math.min(box.right, bounds.right),
          top: Math.max(box.top, bounds.top), bottom: Math.min(box.bottom, bounds.bottom) };
        if (marquee) Object.assign(marquee.style, { left: `${visible.left}px`, top: `${visible.top}px`,
          width: `${Math.max(0, visible.right - visible.left)}px`, height: `${Math.max(0, visible.bottom - visible.top)}px` });
        const hits: BlockRange[] = [];
        const quotes: BlockRange[] = [];
        view.state.doc.descendants((node, pos) => {
          if (!shouldShowHandle({ node, $pos: view.state.doc.resolve(pos) })) return;
          if (node.type.name === "blockquote") quotes.push({ from: pos, to: pos + node.nodeSize });
          const dom = view.nodeDOM(pos);
          if (!(dom instanceof HTMLElement)) return;
          const rect = dom.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          const inner = dom.lastElementChild;
          const own = isItem(node) ? inner?.querySelector("p") : node.type.name === "details" ? inner?.querySelector("summary") : null;
          const ownRect = own?.getBoundingClientRect();
          // 목록의 첫 행은 문단 높이를 쓰되, 텍스트 끝의 빈 공간도 항목 폭에 포함한다.
          const hitRect = isItem(node) && ownRect
            ? { left: rect.left, right: rect.right, top: ownRect.top, bottom: ownRect.bottom }
            : ownRect ?? rect;
          if (box.left < hitRect.right && box.right > hitRect.left && box.top < hitRect.bottom && box.bottom > hitRect.top) {
            hits.push({ from: pos, to: pos + node.nodeSize });
          }
        });
        setBlocks(includeFullySelectedQuotes(view.state.doc, hits, quotes));
      },
      finish(pointer, moved) {
        cleanup();
        if (moved) { view.focus(); return; }
        const coords = view.posAtCoords({ left: pointer.clientX, top: pointer.clientY });
        const selection = coords ? Selection.near(view.state.doc.resolve(coords.pos)) : Selection.atEnd(view.state.doc);
        view.dispatch(view.state.tr.setSelection(selection));
        view.focus();
      },
      cancel() {
        cleanup();
        if (!destroyed && !view.isDestroyed && view.state.doc === originalDoc) view.dispatch(view.state.tr.setSelection(originalSelection));
      },
    });
  };
  viewport.addEventListener("pointermove", setCursor, true);
  viewport.addEventListener("pointerleave", resetCursor);
  viewport.addEventListener("pointerdown", down, true);
  return {
    update() { if (!view.editable) { cancelGesture?.(); resetCursor(); } },
    destroy() {
      destroyed = true;
      cancelGesture?.();
      cleanup();
      viewport.removeEventListener("pointermove", setCursor, true);
      viewport.removeEventListener("pointerleave", resetCursor);
      viewport.removeEventListener("pointerdown", down, true);
    },
  };
}

function createSelectionView(view: EditorView) {
  let viewport: HTMLElement | null = null;
  let attached: ReturnType<typeof createAttachedSelectionView> | undefined;
  const update = () => {
    const current = view.dom.closest<HTMLElement>("[data-block-selection-viewport]");
    if (current !== viewport) {
      attached?.destroy();
      viewport = current;
      attached = current ? createAttachedSelectionView(view, current) : undefined;
    }
    attached?.update();
  };
  // EditorContent가 에디터 DOM을 실제 뷰포트에 붙인 이후에도 연결한다.
  update();
  return { update, destroy() { attached?.destroy(); } };
}

export const BlockSelection = Extension.create({
  name: "blockSelection",
  addProseMirrorPlugins() {
    return [new Plugin({
      view: createSelectionView,
      props: {
        attributes(state): { [name: string]: string } {
          return state.selection instanceof BlockNodeSelection ? { "data-block-selection": "" } : {};
        },
        decorations(state: EditorState) {
          return state.selection instanceof BlockNodeSelection
            ? DecorationSet.create(state.doc, state.selection.blocks.map(({ from, to }) => {
              const type = state.doc.nodeAt(from)!.type.name;
              return Decoration.node(from, to, {
                class: FRAMED_BLOCKS.has(type) ? `${styles.selectedBlock} ${styles.selectedFrame}` : styles.selectedBlock,
                "data-selected-block-type": type,
              }, { blockSelected: true });
            }))
            : null;
        },
        handleKeyDown(view, event) {
          if (!(view.state.selection instanceof BlockNodeSelection)) return false;
          if (event.key === "Escape") {
            view.dispatch(view.state.tr.setSelection(TextSelection.near(view.state.selection.$from)));
            return true;
          }
          return false;
        },
      },
    })];
  },
});
