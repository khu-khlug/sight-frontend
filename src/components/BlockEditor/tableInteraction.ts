import { Extension } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import type { EditorState, Transaction } from "@tiptap/pm/state";
import {
  addColumnAfter, addColumnBefore, addRowAfter, addRowBefore, CellSelection,
  columnResizingPluginKey, deleteColumn, deleteRow, moveTableColumn, moveTableRow, selectedRect, TableMap,
} from "@tiptap/pm/tables";
import { closeHistory } from "@tiptap/pm/history";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { EditorView } from "@tiptap/pm/view";
import { startPointerGesture } from "./pointerGesture";
import contentStyles from "../BlockContent/style.module.css";
import styles from "./tableInteraction.module.css";

type Axis = "row" | "column";
type AxisSelection = { tablePos: number; axis: Axis; index: number };
type CellBox = { node: ProseMirrorNode; dom: HTMLElement; rect: DOMRect; row: number; column: number };
type Context = { pos: number; node: ProseMirrorNode; map: TableMap; table: HTMLTableElement; viewport: HTMLElement };
type Box = { left: number; top: number; right: number; bottom: number; width: number; height: number };
const tableAxisKey = new PluginKey<AxisSelection | null>("tableAxis");
const DURATION = 180;

function contextAt(view: EditorView, pos: number): Context | null {
  const node = view.state.doc.nodeAt(pos);
  if (node?.type.name !== "table") return null;
  const dom = view.nodeDOM(pos);
  if (!(dom instanceof HTMLElement)) return null;
  const table = dom instanceof HTMLTableElement ? dom : dom.querySelector("table");
  const viewport = table?.closest<HTMLElement>("[data-table-viewport]");
  return table && viewport ? { pos, node, map: TableMap.get(node), table, viewport } : null;
}

function cells(view: EditorView, context: Context): CellBox[] {
  const boxes: CellBox[] = [];
  const seen = new Set<number>();
  context.map.map.forEach((offset, index) => {
    if (seen.has(offset)) return;
    seen.add(offset);
    const node = context.node.nodeAt(offset);
    const dom = view.nodeDOM(context.pos + 1 + offset);
    if (node && dom instanceof HTMLElement) boxes.push({ node, dom, rect: dom.getBoundingClientRect(),
      row: Math.floor(index / context.map.width), column: index % context.map.width });
  });
  return boxes;
}

function union(boxes: CellBox[]): Box | null {
  if (!boxes.length) return null;
  const left = Math.min(...boxes.map((cell) => cell.rect.left)), right = Math.max(...boxes.map((cell) => cell.rect.right));
  const top = Math.min(...boxes.map((cell) => cell.rect.top)), bottom = Math.max(...boxes.map((cell) => cell.rect.bottom));
  return { left, top, right, bottom, width: right - left, height: bottom - top };
}

function inAxis(cell: CellBox, axis: Axis, index: number) { return axis === "row" ? cell.row === index : cell.column === index; }
function length(context: Context, axis: Axis) { return axis === "row" ? context.map.height : context.map.width; }

function columnWidths(context: Context, boxes: CellBox[]): number[] {
  const columns = context.table.querySelectorAll<HTMLTableColElement>(":scope > colgroup > col");
  // 너비 속성이 없는 초기 표도 화면에 표시된 열 너비를 기준으로 고정한다.
  return Array.from({ length: context.map.width }, (_, index) => {
    const cell = boxes.find((box) => box.column <= index && index < box.column + box.node.attrs.colspan);
    const width = columns[index]?.getBoundingClientRect().width
      || (cell ? cell.rect.width / cell.node.attrs.colspan : 64);
    return Math.max(64, Math.round(width));
  });
}

function setColumnWidths(tr: Transaction, tablePos: number, widths: number[]) {
  const table = tr.doc.nodeAt(tablePos);
  if (table?.type.name !== "table") return;
  const map = TableMap.get(table);
  const seen = new Set<number>();
  map.map.forEach((offset, index) => {
    if (seen.has(offset)) return;
    seen.add(offset);
    const cell = table.nodeAt(offset);
    if (!cell) return;
    const column = index % map.width;
    const colwidth = widths.slice(column, column + cell.attrs.colspan);
    if (cell.attrs.colwidth?.length === colwidth.length
      && colwidth.every((width, part) => cell.attrs.colwidth[part] === width)) return;
    tr.setNodeMarkup(tablePos + 1 + offset, null, { ...cell.attrs, colwidth });
  });
}

function selectAxis(tr: Transaction, selection: AxisSelection) {
  const node = tr.doc.nodeAt(selection.tablePos);
  if (node?.type.name !== "table") return tr.setMeta(tableAxisKey, null);
  const map = TableMap.get(node);
  const index = Math.max(0, Math.min(selection.index, (selection.axis === "row" ? map.height : map.width) - 1));
  const first = selection.axis === "row" ? index * map.width : index;
  const last = selection.axis === "row" ? first + map.width - 1 : (map.height - 1) * map.width + index;
  const anchor = tr.doc.resolve(selection.tablePos + 1 + map.map[first]);
  const head = tr.doc.resolve(selection.tablePos + 1 + map.map[last]);
  tr.setSelection(selection.axis === "row" ? CellSelection.rowSelection(anchor, head) : CellSelection.colSelection(anchor, head));
  return tr.setMeta(tableAxisKey, { ...selection, index });
}

function createTableControls(view: EditorView) {
  const doc = view.dom.ownerDocument, win = doc.defaultView!;
  const layer = doc.createElement("div");
  layer.className = styles.layer;
  layer.setAttribute("data-table-control", "");
  doc.body.append(layer);
  let hover: { pos: number; row: number; column: number } | null = null;
  let hoveredCell: HTMLElement | null = null;
  let drag: { selection: AxisSelection; snapshot: CellBox[]; box: Box; tableRect: DOMRect; slot: number; preview: HTMLElement } | null = null;
  let cancelGesture: (() => void) | undefined;
  let destroyed = false;
  let pressed = false;
  let observedTable: HTMLTableElement | null = null;
  let observedViewport: HTMLElement | null = null;
  let frame: number | undefined;
  let animationFrame: number | undefined;
  let animationEnd = 0;
  const animations = new Set<Animation>();
  const ghosts = new Set<HTMLElement>();
  const reducedMotion = win.matchMedia("(prefers-reduced-motion: reduce)");

  const clipBounds = (context: Context) => {
    const rect = context.viewport.getBoundingClientRect();
    let left = Math.max(0, rect.left), right = Math.min(win.innerWidth, rect.right);
    let top = Math.max(0, rect.top), bottom = Math.min(win.innerHeight, rect.bottom);
    for (let parent = context.viewport.parentElement; parent; parent = parent.parentElement) {
      const css = win.getComputedStyle(parent), bounds = parent.getBoundingClientRect();
      if (/(auto|scroll|hidden|clip)/.test(css.overflowX)) { left = Math.max(left, bounds.left); right = Math.min(right, bounds.right); }
      if (/(auto|scroll|hidden|clip)/.test(css.overflowY)) { top = Math.max(top, bounds.top); bottom = Math.min(bottom, bounds.bottom); }
    }
    return { left, right, top, bottom };
  };
  const place = (element: HTMLElement, x: number, y: number, bounds: ReturnType<typeof clipBounds>) => {
    Object.assign(element.style, { left: `${x - bounds.left}px`, top: `${y - bounds.top}px` });
  };
  const button = (label: string, text: string, x: number, y: number, bounds: ReturnType<typeof clipBounds>, action?: () => void) => {
    const element = doc.createElement("button");
    element.type = "button";
    element.className = styles.button;
    element.setAttribute("aria-label", label);
    element.title = label;
    if (text === "×") {
      // 글꼴의 기준선 대신 대칭인 도형을 사용해 삭제 표시를 버튼 중앙에 맞춘다.
      element.innerHTML = '<svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M2 2L10 10M10 2L2 10"/></svg>';
    } else element.textContent = text;
    place(element, x, y, bounds);
    element.addEventListener("pointerdown", (event) => { event.preventDefault(); event.stopPropagation(); });
    if (action) element.addEventListener("click", action);
    layer.append(element);
    return element;
  };
  const animate = (dom: HTMLElement, keyframes: Keyframe[]) => {
    if (reducedMotion.matches) return;
    const animation = dom.animate(keyframes, { duration: DURATION, easing: "ease-out" });
    animations.add(animation);
    animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
  };
  const followAnimation = () => {
    draw();
    if (!destroyed && win.performance.now() < animationEnd) animationFrame = win.requestAnimationFrame(followAnimation);
    else animationFrame = undefined;
  };
  const animateChange = (before: CellBox[], context: Context, axis: Axis, bounds = clipBounds(context)) => {
    if (reducedMotion.matches) return;
    // 삭제된 셀은 별도 미리보기로 잠시 남겨 두고 문서는 한 번만 변경한다.
    const afterContext = contextAt(view, context.pos);
    const after = afterContext ? cells(view, afterContext) : [];
    const retained = new Set<CellBox>();
    const previousCells = new Map<CellBox, CellBox>();
    for (const cell of after) {
      // 너비 속성을 저장하면 노드 객체가 바뀔 수 있으므로 유지된 셀 DOM을 먼저 대응시킨다.
      const old = before.find((previous) => !retained.has(previous) && previous.dom === cell.dom)
        ?? before.find((previous) => !retained.has(previous) && previous.node === cell.node);
      if (old) { retained.add(old); previousCells.set(cell, old); }
    }
    for (const cell of before) {
      if (retained.has(cell)) continue;
      const ghost = doc.createElement("div");
      ghost.className = `${styles.removed} ${contentStyles.document}`;
      const clone = cell.dom.cloneNode(true) as HTMLElement;
      clone.removeAttribute("id");
      clone.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));
      const table = doc.createElement("table"), row = table.insertRow();
      row.append(clone);
      ghost.append(table);
      Object.assign(ghost.style, { left: `${cell.rect.left}px`, top: `${cell.rect.top}px`, width: `${cell.rect.width}px`, height: `${cell.rect.height}px`,
        clipPath: `inset(${Math.max(0, bounds.top - cell.rect.top)}px ${Math.max(0, cell.rect.right - bounds.right)}px ${Math.max(0, cell.rect.bottom - bounds.bottom)}px ${Math.max(0, bounds.left - cell.rect.left)}px)` });
      doc.body.append(ghost);
      ghosts.add(ghost);
      animate(ghost, [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: axis === "row" ? "scaleY(0)" : "scaleX(0)" }]);
      win.setTimeout(() => { ghost.remove(); ghosts.delete(ghost); }, DURATION);
    }
    for (const cell of after) {
      const old = previousCells.get(cell);
      if (old) {
        const x = axis === "column" ? old.rect.left - cell.rect.left : 0;
        const y = axis === "row" ? old.rect.top - cell.rect.top : 0;
        if (x || y) animate(cell.dom, [{ transform: `translate(${x}px, ${y}px)` }, { transform: "translate(0, 0)" }]);
      } else animate(cell.dom, [{ opacity: 0, transform: axis === "row" ? "scaleY(0)" : "scaleX(0)" }, { opacity: 1, transform: "scale(1)" }]);
    }
    animationEnd = win.performance.now() + DURATION;
    if (animationFrame !== undefined) win.cancelAnimationFrame(animationFrame);
    animationFrame = win.requestAnimationFrame(followAnimation);
  };
  const change = (selection: AxisSelection, operation: "before" | "after" | "delete") => {
    if (!view.editable || drag) return;
    const context = contextAt(view, selection.tablePos);
    if (!context) return;
    const snapshot = cells(view, context);
    const widths = columnWidths(context, snapshot);
    if (selection.axis === "column") {
      const rect = selectedRect(view.state);
      if (operation === "delete") widths.splice(rect.left, rect.right - rect.left);
      else {
        const column = operation === "before" ? rect.left : rect.right;
        // 기존 열은 그대로 두고 선택한 열과 같은 너비의 새 열을 추가한다.
        widths.splice(column, 0, widths[selection.index] ?? 64);
      }
    }
    const bounds = clipBounds(context);
    const command = selection.axis === "row"
      ? operation === "delete" ? deleteRow : operation === "before" ? addRowBefore : addRowAfter
      : operation === "delete" ? deleteColumn : operation === "before" ? addColumnBefore : addColumnAfter;
    command(view.state, (tr) => {
      if (tr.doc.nodeAt(selection.tablePos)?.type.name === "table") {
        setColumnWidths(tr, selection.tablePos, widths);
        const index = operation === "before" ? selection.index + 1 : selection.index;
        selectAxis(tr, { ...selection, index });
      } else tr.setMeta(tableAxisKey, null);
      view.dispatch(closeHistory(tr).setMeta("uiEvent", "table"));
    });
    win.requestAnimationFrame(() => { if (!destroyed) animateChange(snapshot, context, selection.axis, bounds); });
  };
  const clearDragStyles = () => {
    drag?.snapshot.forEach(({ dom }) => { dom.style.removeProperty("transform"); dom.style.removeProperty("transition"); dom.style.removeProperty("opacity"); });
  };
  const visualPositions = () => {
    if (!drag) return [];
    const active = drag;
    const current = active.snapshot.map((cell) => ({ ...cell, rect: cell.dom.getBoundingClientRect() }));
    const source = union(current.filter((cell) => inAxis(cell, active.selection.axis, active.selection.index)));
    const preview = active.preview.getBoundingClientRect();
    return current.map((cell) => source && inAxis(cell, active.selection.axis, active.selection.index)
      ? { ...cell, rect: new DOMRect(cell.rect.left + preview.left - source.left, cell.rect.top + preview.top - source.top, cell.rect.width, cell.rect.height) }
      : cell);
  };
  const startDrag = (event: PointerEvent, selection: AxisSelection) => {
    if (event.button !== 0 || !event.isPrimary || !view.editable) return;
    event.preventDefault();
    event.stopPropagation();
    cancelGesture?.();
    const context = contextAt(view, selection.tablePos);
    if (!context) return;
    view.dispatch(selectAxis(view.state.tr, selection).setMeta("addToHistory", false));
    const initialDoc = view.state.doc;
    const cleanup = () => { pressed = false; clearDragStyles(); drag?.preview.remove(); drag = null; draw(); };
    cancelGesture = startPointerGesture(view, event, {
      className: selection.axis === "row" ? styles.rowDragging : styles.columnDragging,
      axis: selection.axis === "row" ? "y" : "x",
      scrollElement: selection.axis === "column" ? context.viewport : undefined,
      start() {
        const snapshot = cells(view, context);
        const source = snapshot.filter((cell) => inAxis(cell, selection.axis, selection.index));
        const box = union(source);
        // 병합 셀을 쪼개야 하는 이동은 시작하지 않는다.
        if (!box || source.some((cell) => cell.node.attrs.rowspan > 1 || cell.node.attrs.colspan > 1)) return false;
        const preview = doc.createElement("div");
        preview.className = `${styles.preview} ${contentStyles.document}`;
        Object.assign(preview.style, { width: `${box.width}px`, height: `${box.height}px` });
        const table = doc.createElement("table");
        table.style.width = `${box.width}px`;
        const body = table.createTBody();
        for (const cell of source) {
          let row = body.rows[selection.axis === "row" ? 0 : cell.row];
          if (!row) row = body.insertRow();
          const clone = cell.dom.cloneNode(true) as HTMLElement;
          clone.removeAttribute("id");
          clone.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));
          Object.assign(clone.style, { width: `${cell.rect.width}px`, height: `${cell.rect.height}px` });
          row.append(clone);
          cell.dom.style.opacity = "0.25";
        }
        preview.append(table);
        doc.body.append(preview);
        drag = { selection, snapshot, box, tableRect: context.table.getBoundingClientRect(), slot: selection.index, preview };
        draw();
        return true;
      },
      move(pointer) {
        if (!drag) return;
        const rect = context.table.getBoundingClientRect();
        const horizontal = selection.axis === "column";
        const delta = horizontal ? pointer.clientX - event.clientX : pointer.clientY - event.clientY;
        const scrollX = rect.left - drag.tableRect.left, scrollY = rect.top - drag.tableRect.top;
        // 포인터의 반대 축 좌표는 사용하지 않는다. 표의 스크롤 이동만 따라간다.
        Object.assign(drag.preview.style, { left: `${drag.box.left + (horizontal ? delta : scrollX)}px`, top: `${drag.box.top + (horizontal ? scrollY : delta)}px` });
        const coordinate = horizontal ? pointer.clientX : pointer.clientY;
        let slot = length(context, selection.axis);
        for (let index = 0; index < length(context, selection.axis); index += 1) {
          const box = union(drag.snapshot.filter((cell) => inAxis(cell, selection.axis, index)));
          if (!box) continue;
          const middle = horizontal ? (box.left + box.right) / 2 + scrollX : (box.top + box.bottom) / 2 + scrollY;
          if (coordinate < middle) { slot = index; break; }
        }
        drag.slot = slot;
        const to = slot > selection.index ? slot - 1 : slot;
        const size = horizontal ? drag.box.width : drag.box.height;
        for (const cell of drag.snapshot) {
          if (inAxis(cell, selection.axis, selection.index)) continue;
          const index = horizontal ? cell.column : cell.row;
          const shift = to > selection.index && index > selection.index && index <= to ? -size
            : to < selection.index && index >= to && index < selection.index ? size : 0;
          cell.dom.style.transition = reducedMotion.matches ? "none" : `transform ${DURATION}ms ease-out`;
          cell.dom.style.transform = horizontal ? `translateX(${shift}px)` : `translateY(${shift}px)`;
        }
        draw();
      },
      finish(pointer, moved) {
        if (!moved || !drag) { cleanup(); return; }
        const horizontal = selection.axis === "column";
        const bounds = context.table.getBoundingClientRect();
        const coordinate = horizontal ? pointer.clientX : pointer.clientY;
        const inside = coordinate >= (horizontal ? bounds.left : bounds.top) && coordinate <= (horizontal ? bounds.right : bounds.bottom);
        const to = drag.slot > selection.index ? drag.slot - 1 : drag.slot;
        // 정착 애니메이션은 현재 보이는 위치에서 시작한다.
        const visual = visualPositions();
        clearDragStyles();
        if (inside && to !== selection.index && view.state.doc === initialDoc) {
          const command = horizontal ? moveTableColumn : moveTableRow;
          command({ from: selection.index, to, pos: selection.tablePos + 1, select: true })(view.state, (tr) => {
            selectAxis(tr, { ...selection, index: to });
            view.dispatch(closeHistory(tr).setMeta("uiEvent", "table"));
          });
        }
        cleanup();
        win.requestAnimationFrame(() => { if (!destroyed) animateChange(visual, context, selection.axis); });
      },
      cancel() {
        if (drag && view.state.doc === initialDoc) {
          const visual = visualPositions();
          cleanup();
          animateChange(visual, context, selection.axis);
        } else cleanup();
      },
    });
  };

  function draw() {
    if (destroyed || view.isDestroyed) return;
    // 누른 버튼을 포인터를 놓기 전에 교체하면 click 이벤트를 받을 수 없다.
    if (pressed && !drag) return;
    layer.replaceChildren();
    const selected = tableAxisKey.getState(view.state);
    const pos = drag?.selection.tablePos ?? selected?.tablePos ?? hover?.pos;
    const context = pos !== undefined ? contextAt(view, pos) : null;
    if (!context || !view.editable) { layer.hidden = true; return; }
    if (observedTable !== context.table) {
      if (observedTable) resizeObserver.unobserve(observedTable);
      observedTable = context.table;
      resizeObserver.observe(observedTable);
    }
    if (observedViewport !== context.viewport) {
      if (observedViewport) resizeObserver.unobserve(observedViewport);
      observedViewport = context.viewport;
      resizeObserver.observe(observedViewport);
    }
    const bounds = clipBounds(context);
    layer.hidden = bounds.right <= bounds.left || bounds.bottom <= bounds.top;
    Object.assign(layer.style, { left: `${bounds.left}px`, top: `${bounds.top}px`, width: `${Math.max(0, bounds.right - bounds.left)}px`, height: `${Math.max(0, bounds.bottom - bounds.top)}px` });
    const boxes = cells(view, context), tableRect = context.table.getBoundingClientRect();
    const handle = (axis: Axis, index: number) => {
      const box = union(boxes.filter((cell) => inAxis(cell, axis, index)));
      if (!box) return;
      const selection = { tablePos: context.pos, axis, index };
      const element = button(axis === "row" ? `${index + 1}행 선택·이동` : `${index + 1}열 선택·이동`, axis === "row" ? "⋮" : "⋯",
        axis === "row" ? tableRect.left : (box.left + box.right) / 2,
        axis === "row" ? (box.top + box.bottom) / 2 : tableRect.top, bounds);
      element.classList.add(styles.handle, axis === "row" ? styles.verticalControl : styles.horizontalControl);
      element.addEventListener("pointerdown", (event) => startDrag(event, selection));
      element.addEventListener("click", (event) => { if (event.detail === 0) view.dispatch(selectAxis(view.state.tr, selection).setMeta("addToHistory", false)); });
    };
    if (drag) {
      const source = drag.snapshot;
      // 콜백 안에서는 drag의 null 검사가 이어지지 않아 축을 미리 꺼내 둔다.
      const slot = drag.slot, axis = drag.selection.axis, horizontal = axis === "column";
      const box = union(source.filter((cell) => inAxis(cell, axis, Math.min(slot, length(context, axis) - 1))));
      if (box) {
        const line = doc.createElement("div");
        line.className = styles.insertion;
        const coordinate = horizontal ? (slot === context.map.width ? box.right : box.left) + tableRect.left - drag.tableRect.left
          : (slot === context.map.height ? box.bottom : box.top) + tableRect.top - drag.tableRect.top;
        place(line, horizontal ? coordinate : tableRect.left, horizontal ? tableRect.top : coordinate, bounds);
        Object.assign(line.style, { width: `${horizontal ? 2 : tableRect.width}px`, height: `${horizontal ? tableRect.height : 2}px` });
        layer.append(line);
      }
      return;
    }
    if (selected) {
      const box = union(boxes.filter((cell) => inAxis(cell, selected.axis, selected.index)));
      if (!box) return;
      const rectangle = doc.createElement("div");
      rectangle.className = styles.selection;
      place(rectangle, box.left, box.top, bounds);
      Object.assign(rectangle.style, { width: `${box.width}px`, height: `${box.height}px` });
      layer.append(rectangle);
      handle(selected.axis, selected.index);
      const horizontal = selected.axis === "column", x = (box.left + box.right) / 2, y = (box.top + box.bottom) / 2;
      const before = button(horizontal ? "왼쪽에 열 추가" : "위에 행 추가", "+", horizontal ? box.left : x, horizontal ? y : box.top, bounds, () => change(selected, "before"));
      const after = button(horizontal ? "오른쪽에 열 추가" : "아래에 행 추가", "+", horizontal ? box.right : x, horizontal ? y : box.bottom, bounds, () => change(selected, "after"));
      for (const add of [before, after]) add.classList.add(styles.action, horizontal ? styles.verticalControl : styles.horizontalControl);
      const remove = button(horizontal ? "선택한 열 삭제" : "선택한 행 삭제", "×", horizontal ? x : box.right, horizontal ? box.bottom : y, bounds, () => change(selected, "delete"));
      remove.classList.add(styles.action, horizontal ? styles.horizontalControl : styles.verticalControl);
    } else if (hover?.pos === context.pos) {
      if (hover.row === 0) handle("column", hover.column);
      if (hover.column === 0) handle("row", hover.row);
    }
  }
  const schedule = () => {
    if (frame === undefined) frame = win.requestAnimationFrame(() => { frame = undefined; draw(); });
  };
  const move = (event: PointerEvent) => {
    if (drag || layer.contains(event.target as Node)) return;
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>("td, th") : null;
    if (target === hoveredCell) return;
    hoveredCell = target;
    hover = null;
    if (target && view.dom.contains(target)) {
      const pos = view.posAtDOM(target, 0), $pos = view.state.doc.resolve(pos);
      for (let depth = $pos.depth; depth > 0; depth -= 1) {
        if ($pos.node(depth).type.name !== "table") continue;
        const tablePos = $pos.before(depth), node = $pos.node(depth), map = TableMap.get(node);
        const cellPos = $pos.before(depth + 2) - (tablePos + 1);
        const rect = map.findCell(cellPos);
        hover = { pos: tablePos, row: rect.top, column: rect.left };
        break;
      }
    }
    draw();
  };
  const clearSelection = (pos?: number) => {
    if (tableAxisKey.getState(view.state) == null) return;
    const tr = view.state.tr.setMeta(tableAxisKey, null).setMeta("addToHistory", false);
    tr.setSelection(TextSelection.near(tr.doc.resolve(pos ?? view.state.selection.from)));
    view.dispatch(tr);
  };
  const down = (event: PointerEvent) => {
    if (layer.contains(event.target as Node)) { pressed = true; return; }
    if (drag || event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest('[data-part="scrollbar"], [data-part="thumb"]')) return;
    const target = event.target instanceof Element ? event.target.closest("td, th") : null;
    const coords = target && view.dom.contains(target) ? view.posAtCoords({ left: event.clientX, top: event.clientY }) : null;
    clearSelection(coords?.pos);
    if (target && coords) view.focus();
  };
  const key = (event: KeyboardEvent) => {
    if (event.key === "Escape" && !drag && tableAxisKey.getState(view.state) != null) {
      event.preventDefault(); event.stopPropagation(); clearSelection(); view.focus();
    }
  };
  const up = () => { pressed = false; schedule(); };
  const resizeObserver = new ResizeObserver(schedule);
  resizeObserver.observe(view.dom);
  doc.addEventListener("pointermove", move, true);
  doc.addEventListener("pointerdown", down, true);
  doc.addEventListener("pointerup", up, true);
  doc.addEventListener("pointercancel", up, true);
  doc.addEventListener("scroll", schedule, true);
  doc.addEventListener("keydown", key, true);
  win.addEventListener("resize", schedule);
  return {
    update(_view: EditorView, previous: EditorState) {
      if (!view.editable) cancelGesture?.();
      if (previous.doc !== view.state.doc && !drag) { hover = null; hoveredCell = null; }
      schedule();
    },
    destroy() {
      destroyed = true;
      cancelGesture?.();
      if (frame !== undefined) win.cancelAnimationFrame(frame);
      if (animationFrame !== undefined) win.cancelAnimationFrame(animationFrame);
      animations.forEach((animation) => animation.cancel());
      ghosts.forEach((ghost) => ghost.remove());
      layer.remove();
      resizeObserver.disconnect();
      doc.removeEventListener("pointermove", move, true);
      doc.removeEventListener("pointerdown", down, true);
      doc.removeEventListener("pointerup", up, true);
      doc.removeEventListener("pointercancel", up, true);
      doc.removeEventListener("scroll", schedule, true);
      doc.removeEventListener("keydown", key, true);
      win.removeEventListener("resize", schedule);
    },
  };
}

export const TableInteraction = Extension.create({
  name: "tableInteraction",
  addProseMirrorPlugins() {
    return [new Plugin<AxisSelection | null>({
      key: tableAxisKey,
      state: {
        init: () => null,
        apply(tr, previous) {
          const requested: AxisSelection | null | undefined = tr.getMeta(tableAxisKey);
          if (requested !== undefined) return requested;
          if (!previous || (tr.selectionSet && !(tr.selection instanceof CellSelection))) return null;
          const tablePos = tr.mapping.map(previous.tablePos, 1);
          return tr.doc.nodeAt(tablePos)?.type.name === "table" ? { ...previous, tablePos } : null;
        },
      },
      view: createTableControls,
      appendTransaction(transactions, previous, current) {
        const wasResizing = Boolean(columnResizingPluginKey.getState(previous)?.dragging);
        const resizing = Boolean(columnResizingPluginKey.getState(current)?.dragging);
        if (transactions.length && wasResizing !== resizing) return closeHistory(current.tr).setMeta("addToHistory", false);
        return null;
      },
      props: {
        decorations(state) {
          const selected = tableAxisKey.getState(state);
          const node = selected ? state.doc.nodeAt(selected.tablePos) : null;
          return selected && node ? DecorationSet.create(state.doc, [Decoration.node(selected.tablePos, selected.tablePos + node.nodeSize, { class: styles.axisSelection })]) : null;
        },
      },
    })];
  },
});
