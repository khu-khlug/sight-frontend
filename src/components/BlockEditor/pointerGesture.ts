import type { EditorView } from "@tiptap/pm/view";

type Callbacks = {
  className: string;
  axis?: "x" | "y";
  scrollElement?: HTMLElement;
  start: () => boolean;
  move: (event: PointerEvent) => void;
  finish: (event: PointerEvent, moved: boolean) => void;
  cancel: () => void;
};

// 블록 이동과 선택 박스가 휠·가장자리 스크롤·취소 처리를 공유한다.
export function startPointerGesture(view: EditorView, start: PointerEvent, callbacks: Callbacks) {
  const doc = view.dom.ownerDocument;
  const win = doc.defaultView!;
  const originalDoc = view.state.doc;
  let pointer = start;
  let active = false;
  let ended = false;
  let frame: number | undefined;
  let previousTime = 0;
  const horizontal = callbacks.axis === "x";
  const parents: HTMLElement[] = [];
  if (callbacks.scrollElement) parents.push(callbacks.scrollElement);
  for (let parent = view.dom.parentElement; parent; parent = parent.parentElement) {
    if (/(auto|scroll)/.test(horizontal ? win.getComputedStyle(parent).overflowX : win.getComputedStyle(parent).overflowY)
      && !parents.includes(parent)) parents.push(parent);
  }
  if (doc.scrollingElement instanceof HTMLElement && !parents.includes(doc.scrollingElement)) parents.push(doc.scrollingElement);
  const canScroll = (element: HTMLElement, delta: number) => delta < 0
    ? (horizontal ? element.scrollLeft : element.scrollTop) > 0
    : horizontal ? element.scrollLeft < element.scrollWidth - element.clientWidth - 1
      : element.scrollTop < element.scrollHeight - element.clientHeight - 1;
  const tick = (time: number) => {
    if (ended || view.isDestroyed || view.state.doc !== originalDoc) return cancel();
    const elapsed = previousTime ? Math.min(time - previousTime, 50) / 1000 : 0;
    previousTime = time;
    for (const element of parents) {
      if (horizontal ? element.scrollWidth <= element.clientWidth : element.scrollHeight <= element.clientHeight) continue;
      const rect = element.getBoundingClientRect();
      let top = Math.max(0, horizontal ? rect.left : rect.top), bottom = Math.min(horizontal ? win.innerWidth : win.innerHeight, horizontal ? rect.right : rect.bottom);
      for (let parent = element.parentElement; parent; parent = parent.parentElement) {
        if (/(auto|scroll|hidden|clip)/.test(horizontal ? win.getComputedStyle(parent).overflowX : win.getComputedStyle(parent).overflowY)) {
          const bounds = parent.getBoundingClientRect();
          top = Math.max(top, horizontal ? bounds.left : bounds.top);
          bottom = Math.min(bottom, horizontal ? bounds.right : bounds.bottom);
        }
      }
      const along = horizontal ? pointer.clientX : pointer.clientY;
      const across = callbacks.axis ? horizontal ? start.clientY : start.clientX : pointer.clientX;
      if (horizontal ? across < rect.top || across > rect.bottom || along < top || along > bottom
        : across < rect.left || across > rect.right || along < top || along > bottom) continue;
      const edge = Math.min(48, (bottom - top) / 2);
      if (edge <= 0) continue;
      const direction = along < top + edge ? -(1 - (along - top) / edge)
        : along > bottom - edge ? 1 - (bottom - along) / edge : 0;
      if (!direction) break;
      if (canScroll(element, direction)) {
        if (horizontal) element.scrollLeft += direction * 720 * elapsed;
        else element.scrollTop += direction * 720 * elapsed;
        break;
      }
    }
    callbacks.move(pointer);
    if (!ended) frame = win.requestAnimationFrame(tick);
  };
  const wheel = (event: WheelEvent) => {
    const delta = horizontal ? event.deltaX || event.deltaY : event.deltaY;
    if (!active || event.ctrlKey || !delta) return;
    const element = parents.find((parent) => canScroll(parent, delta));
    if (!element) return;
    event.preventDefault();
    event.stopPropagation();
    const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16
      : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? horizontal ? element.clientWidth : element.clientHeight : 1;
    if (horizontal) element.scrollLeft += delta * unit;
    else element.scrollTop += delta * unit;
    callbacks.move(pointer);
  };
  const move = (event: PointerEvent) => {
    if (event.pointerId !== start.pointerId) return;
    if (!(event.buttons & 1) || view.isDestroyed || view.state.doc !== originalDoc) return cancel();
    pointer = event;
    if (!active) {
      const distance = callbacks.axis ? Math.abs(horizontal ? event.clientX - start.clientX : event.clientY - start.clientY)
        : Math.hypot(event.clientX - start.clientX, event.clientY - start.clientY);
      if (distance < 4) return;
      if (!callbacks.start()) return cancel();
      active = true;
      doc.documentElement.classList.add(callbacks.className);
      frame = win.requestAnimationFrame(tick);
    }
    event.preventDefault();
    callbacks.move(event);
  };
  const end = (event?: PointerEvent) => {
    if (ended || (event && event.pointerId !== start.pointerId)) return;
    ended = true;
    if (frame !== undefined) win.cancelAnimationFrame(frame);
    doc.removeEventListener("pointermove", move, true);
    doc.removeEventListener("pointerup", end, true);
    doc.removeEventListener("pointercancel", cancel, true);
    doc.removeEventListener("keydown", keydown, true);
    doc.removeEventListener("wheel", wheel, true);
    win.removeEventListener("blur", cancel);
    doc.documentElement.classList.remove(callbacks.className);
    if (active && event) {
      event.preventDefault();
      event.stopPropagation();
      const suppressClick = (click: MouseEvent) => { click.preventDefault(); click.stopPropagation(); };
      doc.addEventListener("click", suppressClick, { capture: true, once: true });
      win.setTimeout(() => doc.removeEventListener("click", suppressClick, true), 0);
    }
    if (event && !view.isDestroyed && view.state.doc === originalDoc) callbacks.finish(event, active);
    else callbacks.cancel();
  };
  const cancel = () => end();
  const keydown = (event: KeyboardEvent) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    cancel();
  };
  start.preventDefault();
  doc.addEventListener("pointermove", move, true);
  doc.addEventListener("pointerup", end, true);
  doc.addEventListener("pointercancel", cancel, true);
  doc.addEventListener("keydown", keydown, true);
  doc.addEventListener("wheel", wheel, { capture: true, passive: false });
  win.addEventListener("blur", cancel);
  return cancel;
}
