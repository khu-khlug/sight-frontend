import { Extension } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";

export type ListTypeName = "bulletList" | "orderedList" | "taskList";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    convertList: {
      // 커서가 있는 가장 안쪽 목록을 다른 종류의 목록으로 바꾼다. 안쪽에 중첩된 목록은 그대로 둔다.
      convertList: (target: ListTypeName) => ReturnType;
    };
  }
}

export const ITEM_TYPE: Record<ListTypeName, string> = {
  bulletList: "listItem",
  orderedList: "listItem",
  taskList: "taskItem",
};

export const isListName = (name: string): name is ListTypeName => name in ITEM_TYPE;

/*
 * toggleList는 같은 항목 타입을 쓰는 목록끼리(글머리↔순서)만 종류를 바꾼다. 체크 목록은 항목이 taskItem이라
 * 글머리·순서(listItem)와 서로 바꿀 수 없어서, 항목 타입까지 바꿔 목록 노드를 통째로 교체하는 명령을 둔다.
 * listItem과 taskItem은 내용 규칙(paragraph block*)이 같아 항목의 내용(문단·중첩 목록)이 그대로 옮겨진다.
 */
export const ConvertList = Extension.create({
  name: "convertList",

  addCommands() {
    return {
      convertList: (target) => ({ state, tr, dispatch }) => {
        const { $from, $to } = state.selection;

        let listDepth = -1;
        for (let depth = $from.depth; depth > 0; depth -= 1) {
          if (isListName($from.node(depth).type.name)) {
            listDepth = depth;
            break;
          }
        }
        if (listDepth < 0) return false;

        const list = $from.node(listDepth);
        // 이미 같은 종류면 바꿀 게 없다 — 툴바가 기존 토글(목록 해제)로 넘긴다.
        if (list.type.name === target) return false;

        const { schema } = state;
        const listType = schema.nodes[target];
        const itemType = schema.nodes[ITEM_TYPE[target]];
        if (!listType || !itemType) return false;

        const items = [];
        for (let index = 0; index < list.childCount; index += 1) {
          const item = list.child(index);
          // 체크 항목은 체크 안 된 상태로 시작하고, 체크 항목에서 일반 항목으로 가면 체크 상태를 버린다.
          items.push(itemType.create(target === "taskList" ? { checked: false } : null, item.content, item.marks));
        }
        const converted = listType.createChecked(null, items);

        if (dispatch) {
          const from = $from.before(listDepth);
          tr.replaceWith(from, from + list.nodeSize, converted);
          // 목록 노드와 항목 노드의 여닫는 토큰 수가 같아 문서 위치가 그대로라서 선택 영역을 그대로 복원한다.
          tr.setSelection(TextSelection.create(tr.doc, $from.pos, $to.pos));
          dispatch(tr);
        }
        return true;
      },
    };
  },
});
