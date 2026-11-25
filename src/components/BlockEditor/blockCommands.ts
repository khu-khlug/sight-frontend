import type { Editor } from "@tiptap/core";

import { isListName } from "./convertList";
import type { ListTypeName } from "./convertList";

// 툴바 버튼과 슬래시 명령이 같은 방식으로 블록을 넣도록 함께 쓰는 동작이다.

// 열림 상태는 문서에 저장하지 않는(persist: false) 노드뷰의 DOM 클래스라서, 새로 삽입한
// 블록을 펼친 상태로 만들려면 커서가 놓인 요약줄의 블록에서 토글 버튼을 눌러야 한다.
// 이미 접는 블록 안이어도 풀지 않고 그 안에 새 블록을 한 겹 더 만든다(중첩).
export function insertDetails(editor: Editor) {
  if (!editor.chain().focus().setDetails().run()) return;
  const { $from } = editor.state.selection;
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    if ($from.node(depth).type.name !== "details") continue;
    const dom = editor.view.nodeDOM($from.before(depth));
    // 최상위 접는 블록은 드래그 핸들 래퍼(withDragHandle)로 한 번 감싸져 있어서, 래퍼 안의 details 요소를 먼저 찾는다.
    if (!(dom instanceof HTMLElement)) return;
    const detailsDom = dom.matches('[data-type="details"]') ? dom : dom.querySelector<HTMLElement>(':scope > [data-type="details"]');
    detailsDom?.querySelector<HTMLButtonElement>(":scope > button")?.click();
    return;
  }
}

// 목록 버튼은 눌린 상태를 보여 주는 토글이 아니라 "이 종류로 만들기" 동작이다.
// 커서가 목록 안이면 항상 가장 안쪽 목록을 이 종류로 바꾸고(같은 종류면 아무 일도 하지 않는다 — 목록 해제는
// 하지 않는다), 목록 밖이면 이 종류의 새 목록을 만든다.
export function applyListType(editor: Editor, target: ListTypeName) {
  const { $from } = editor.state.selection;
  let insideList = false;
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    if (isListName($from.node(depth).type.name)) {
      insideList = true;
      break;
    }
  }
  if (insideList) {
    editor.chain().focus().convertList(target).run();
    return;
  }
  const create = { bulletList: "toggleBulletList", orderedList: "toggleOrderedList", taskList: "toggleTaskList" } as const;
  editor.chain().focus()[create[target]]().run();
}
