import type { Editor } from "@tiptap/core";

// pos를 품은 접는 블록 중 접힌 것을 바깥쪽부터 펼친다(목차 이동, 찾기 결과 이동에서 쓴다).
// 열림 상태는 노드뷰의 DOM에만 있어서, 접는 블록의 토글 버튼을 눌러 펼친다.
export function openCollapsedAncestors(editor: Editor, pos: number) {
  const $pos = editor.state.doc.resolve(pos);
  for (let depth = 1; depth <= $pos.depth; depth += 1) {
    if ($pos.node(depth).type.name !== "details") continue;
    const dom = editor.view.nodeDOM($pos.before(depth));
    if (!(dom instanceof HTMLElement)) continue;
    // 편집기의 최상위 접는 블록은 드래그 핸들 래퍼로 한 번 감싸져 있어서, 래퍼 안의 details 요소를 먼저 찾는다.
    const details = dom.matches('[data-type="details"]') ? dom : dom.querySelector<HTMLElement>(':scope > [data-type="details"]');
    if (details && !details.classList.contains("is-open")) details.querySelector<HTMLButtonElement>(":scope > button")?.click();
  }
}
