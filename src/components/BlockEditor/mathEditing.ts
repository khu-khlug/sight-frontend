import { Extension } from "@tiptap/core";
import type { Editor } from "@tiptap/core";
import { NodeSelection, Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export const mathEditingKey = new PluginKey<number | null>("mathEditing");
const isMath = (name?: string) => name === "inlineMath" || name === "blockMath";

export function insertMathInput(editor: Editor, type: "blockMath" | "inlineMath" = "blockMath") {
  if (!editor.isEditable || mathEditingKey.getState(editor.state) != null) return;
  const tr = editor.state.tr.replaceSelectionWith(editor.schema.nodes[type].create({ latex: "" }));
  let pos: number | undefined;
  tr.mapping.maps[tr.mapping.maps.length - 1]?.forEach((_from, _to, from, to) => {
    tr.doc.nodesBetween(from, to, (node, at) => {
      if (node.type.name === type) pos = at;
    });
  });
  if (pos === undefined) return;
  editor.view.dispatch(tr.setMeta(mathEditingKey, pos));
}

const ARROW_KEYS = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

export const MathEditing = Extension.create({
  name: "mathEditing",
  addProseMirrorPlugins() {
    // 방향키로 옮긴 선택인지 — 마우스(드래그 핸들 등)로 수식이 통째로 선택될 때는 편집 모드로 바꾸지 않는다.
    let movedByArrow = false;
    return [new Plugin<number | null>({
      key: mathEditingKey,
      state: {
        init: () => null,
        apply(tr, previous) {
          const requested: number | null | undefined = tr.getMeta(mathEditingKey);
          const pos = requested !== undefined ? requested : previous === null ? null : tr.mapping.map(previous, -1);
          return pos !== null && isMath(tr.doc.nodeAt(pos)?.type.name) ? pos : null;
        },
      },
      props: {
        // 기록만 하고 처리는 ProseMirror 기본 동작에 맡긴다(false). 보조키와 함께 누르면 선택 범위를 넓히는 중이다.
        handleKeyDown(_view, event) {
          movedByArrow = ARROW_KEYS.has(event.key) && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey;
          return false;
        },
        handleDOMEvents: {
          mousedown() {
            movedByArrow = false;
            return false;
          },
        },
        decorations(state) {
          const pos = mathEditingKey.getState(state);
          if (pos == null) return null;
          const node = state.doc.nodeAt(pos);
          return node ? DecorationSet.create(state.doc, [Decoration.node(pos, pos + node.nodeSize, { "data-math-editing": "" })]) : null;
        },
      },
      view(view) {
        return {
          update(_view, previousState) {
            if (!view.editable && mathEditingKey.getState(view.state) != null) {
              view.dispatch(view.state.tr.setMeta(mathEditingKey, null).setMeta("addToHistory", false));
              return;
            }
            // 방향키로 앞뒤에서 수식으로 오면 ProseMirror는 수식을 통째로 선택한다 — 그 대신 편집 모드로 바꿔 입력창에 커서를 둔다.
            const arrived = movedByArrow && !view.state.selection.eq(previousState.selection);
            movedByArrow = false;
            const { selection } = view.state;
            if (!arrived || !view.editable || !(selection instanceof NodeSelection) || !isMath(selection.node.type.name)) return;
            if (mathEditingKey.getState(view.state) === selection.from) return;
            view.dispatch(view.state.tr.setMeta(mathEditingKey, selection.from).setMeta("addToHistory", false));
          },
        };
      },
    })];
  },
});
