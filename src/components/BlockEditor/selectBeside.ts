import { Selection, TextSelection } from "@tiptap/pm/state";
import type { Transaction } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";

/*
 * 노드(pos부터 nodeSize만큼) 앞(-1)이나 뒤(1)의 가장 가까운 자리로 커서를 옮기고 편집기에 포커스를 준다.
 * 인라인 노드면 같은 줄의 바로 앞뒤 글자 자리, 블록이면 앞뒤 블록이다. 블록 앞뒤에 갈 곳이 없으면 빈 문단을 만들어 옮긴다.
 * 입력창을 가진 노드(미디어 입력 박스, 수식)에서 방향키로 빠져나갈 때 쓴다. configure로 같은 트랜잭션에 메타 등을 더한다.
 */
export function selectBeside(view: EditorView, pos: number, nodeSize: number, direction: -1 | 1, configure?: (tr: Transaction) => void) {
  const boundary = direction < 0 ? pos : pos + nodeSize;
  const tr = view.state.tr;
  let selection = Selection.findFrom(tr.doc.resolve(boundary), direction);
  if (!selection) {
    tr.insert(boundary, view.state.schema.nodes.paragraph.create());
    selection = TextSelection.create(tr.doc, boundary + 1);
  }
  configure?.(tr);
  view.dispatch(tr.setSelection(selection).scrollIntoView());
  view.focus();
}
