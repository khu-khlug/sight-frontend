import { Extension } from "@tiptap/core";
import type { Editor } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { TextSelection } from "@tiptap/pm/state";
import { tryCommitMarkdownWrap } from "./markdownWrapMark";
import type { MarkdownWrapConfig } from "./markdownWrapMark";

type Options = { wraps: readonly MarkdownWrapConfig[] };
const INDENTABLE_TYPES = ["paragraph", "heading", "codeBlock"];
const INDENTABLE_TYPE_NAMES = new Set(INDENTABLE_TYPES);
const MAX_INDENT_LEVEL = 20;
const CODE_TAB_SIZE = 4;

function indentLevel(value: unknown): number {
  const level = Number(value);
  return Number.isInteger(level) && level > 0 ? Math.min(level, MAX_INDENT_LEVEL) : 0;
}

function selectedTextblocks(editor: Editor): { node: ProseMirrorNode; pos: number }[] {
  const { doc, selection } = editor.state;
  const blocks: { node: ProseMirrorNode; pos: number }[] = [];
  const end = selection.$to.parentOffset === 0 ? selection.to - 1 : selection.to;
  doc.nodesBetween(selection.from, end, (node: ProseMirrorNode, pos: number) => {
    if (INDENTABLE_TYPE_NAMES.has(node.type.name)) {
      blocks.push({ node, pos });
      return false;
    }
    return true;
  });
  return blocks;
}

function listItemAtStart(editor: Editor): string | null {
  const { empty, $from } = editor.state.selection;
  if (!empty || !$from.parent.isTextblock || $from.parentOffset !== 0) return null;
  for (let depth = $from.depth - 1; depth > 0; depth -= 1) {
    const name = $from.node(depth).type.name;
    if (name === "listItem" || name === "taskItem") {
      return $from.depth === depth + 1 && $from.index(depth) === 0 ? name : null;
    }
  }
  return null;
}

/*
 * 항목을 한 단계 바깥으로 옮기는 liftListItem은 바깥 항목이 같은 항목 타입일 때만 바깥 목록으로 올린다.
 * 다른 타입이면(예: 글머리 항목 안의 체크 목록에서 Shift+Tab) 목록 밖으로 풀려 체크박스만 사라진다.
 * 이 경우 항목을 바깥 항목의 타입으로 바꿔 바깥 목록의 다음 항목으로 옮긴다. 뒤따르던 형제 항목은
 * liftListItem과 같게 옮겨진 항목 안의 중첩 목록(원래 타입 그대로)으로 이어 붙인다.
 * 바깥 항목이 없거나 같은 타입이면 처리하지 않고 false를 돌려준다.
 */
function liftAcrossItemTypes(editor: Editor): boolean {
  const { state } = editor;
  const { $from } = state.selection;
  const itemDepth = $from.depth - 1;
  const outerDepth = itemDepth - 2;
  if (outerDepth < 1) return false;

  const item = $from.node(itemDepth);
  const outer = $from.node(outerDepth);
  const outerName = outer.type.name;
  if ((outerName !== "listItem" && outerName !== "taskItem") || outer.type === item.type) return false;

  const list = $from.node(itemDepth - 1);
  const itemIndex = $from.index(itemDepth - 1);
  const listIndex = $from.index(outerDepth);

  const before: ProseMirrorNode[] = [];
  const after: ProseMirrorNode[] = [];
  list.forEach((child, _offset, index) => {
    if (index < itemIndex) before.push(child);
    else if (index > itemIndex) after.push(child);
  });

  const movedContent = after.length ? item.content.addToEnd(list.type.create(list.attrs, after)) : item.content;
  const moved = outer.type.create(outerName === "taskItem" ? { checked: false } : null, movedContent);

  const outerChildren: ProseMirrorNode[] = [];
  outer.forEach((child, _offset, index) => {
    if (index !== listIndex) outerChildren.push(child);
    else if (before.length) outerChildren.push(list.type.create(list.attrs, before));
  });
  const remainingOuter = outer.type.create(outer.attrs, outerChildren);

  try {
    const tr = state.tr;
    const outerPos = $from.before(outerDepth);
    tr.replaceWith(outerPos, outerPos + outer.nodeSize, [remainingOuter, moved]);
    // 옮겨진 항목의 첫 문단 맨 앞(항목 여는 토큰 + 문단 여는 토큰 뒤)에 커서를 둔다.
    tr.setSelection(TextSelection.create(tr.doc, outerPos + remainingOuter.nodeSize + 2));
    editor.view.dispatch(tr.scrollIntoView());
    return true;
  } catch {
    return false;
  }
}

const ITEM_NAME_BY_LIST: Record<string, string> = {
  bulletList: "listItem",
  orderedList: "listItem",
  taskList: "taskItem",
};

/*
 * sinkListItem은 이전 형제 항목 끝에 이미 같은 종류의 목록이 있을 때만 그 목록에 합친다. 다른 종류의 목록이
 * 있으면 그 옆에 새 목록을 하나 더 만들어 한 항목 안에 목록이 두 개 생긴다. 이 경우 이전 형제 항목 끝의
 * 기존 목록 맨 뒤로 항목을 옮기고, 항목은 그 목록의 항목 타입으로 바꾼다. 이전 형제 끝에 목록이 없거나
 * 같은 종류면 처리하지 않고 false를 돌려준다.
 */
function sinkIntoExistingList(editor: Editor): boolean {
  const { state } = editor;
  const { $from } = state.selection;
  const itemDepth = $from.depth - 1;
  const listDepth = itemDepth - 1;
  if (listDepth < 1) return false;

  const index = $from.index(listDepth);
  if (index === 0) return false;
  const list = $from.node(listDepth);
  const previous = list.child(index - 1);
  const nested = previous.lastChild;
  const targetItemName = nested ? ITEM_NAME_BY_LIST[nested.type.name] : undefined;
  if (!nested || !targetItemName || nested.type === list.type) return false;

  const item = $from.node(itemDepth);
  const targetItemType = state.schema.nodes[targetItemName];
  const moved = targetItemType.create(targetItemName === "taskItem" ? { checked: false } : null, item.content);
  const mergedNested = nested.type.create(nested.attrs, nested.content.addToEnd(moved));
  const previousChildren: ProseMirrorNode[] = [];
  previous.forEach((child, _offset, childIndex) => {
    previousChildren.push(childIndex === previous.childCount - 1 ? mergedNested : child);
  });
  const mergedPrevious = previous.type.create(previous.attrs, previousChildren);

  try {
    const tr = state.tr;
    const itemPos = $from.before(itemDepth);
    const previousPos = itemPos - previous.nodeSize;
    tr.replaceWith(previousPos, itemPos + item.nodeSize, mergedPrevious);
    // 옮겨진 항목은 합쳐진 항목의 맨 끝(중첩 목록 닫는 토큰, 항목 닫는 토큰 앞)에 있다.
    const movedStart = previousPos + mergedPrevious.nodeSize - 2 - moved.nodeSize;
    tr.setSelection(TextSelection.create(tr.doc, movedStart + 2));
    editor.view.dispatch(tr.scrollIntoView());
    return true;
  } catch {
    return false;
  }
}

function indent(editor: Editor): boolean {
  const { state } = editor;
  const { selection } = state;
  if (selection.empty && selection.$from.parent.type.name === "codeBlock") {
    const beforeCursor = selection.$from.parent.textContent.slice(0, selection.$from.parentOffset);
    const linePrefix = beforeCursor.slice(beforeCursor.lastIndexOf("\n") + 1);
    let column = 0;
    for (const character of linePrefix) {
      column += character === "\t" ? CODE_TAB_SIZE - column % CODE_TAB_SIZE : 1;
    }
    // 0열→4칸, 1열→3칸, 4열→4칸처럼 다음 탭 정렬 위치까지만 공백을 넣는다.
    editor.view.dispatch(state.tr.insertText(" ".repeat(CODE_TAB_SIZE - column % CODE_TAB_SIZE)));
    return true;
  }
  const listItem = listItemAtStart(editor);
  if (listItem) {
    if (!sinkIntoExistingList(editor)) editor.commands.sinkListItem(listItem);
    return true;
  }
  if (state.selection.empty) {
    if (!state.selection.$from.parent.isTextblock) return false;
    return editor.commands.insertContent({ type: "text", text: "\t" });
  }

  const blocks = selectedTextblocks(editor);
  if (blocks.length === 0) return false;
  const tr = state.tr;
  for (const { node, pos } of blocks) {
    const nextLevel = Math.min(indentLevel(node.attrs.indentLevel) + 1, MAX_INDENT_LEVEL);
    if (nextLevel !== node.attrs.indentLevel) tr.setNodeMarkup(pos, undefined, { ...node.attrs, indentLevel: nextLevel });
  }
  if (tr.docChanged) editor.view.dispatch(tr);
  return true;
}

function outdent(editor: Editor): boolean {
  const { state } = editor;
  const listItem = listItemAtStart(editor);
  if (listItem) {
    if (!liftAcrossItemTypes(editor)) editor.commands.liftListItem(listItem);
    return true;
  }
  if (state.selection.empty) {
    const { $from } = state.selection;
    if (!$from.parent.isTextblock) return false;
    const level = indentLevel($from.parent.attrs.indentLevel);
    if (level > 0) {
      editor.view.dispatch(state.tr.setNodeMarkup($from.before(), undefined, {
        ...$from.parent.attrs,
        indentLevel: level - 1,
      }));
      return true;
    }
    const start = $from.start();
    const cursor = state.selection.from;
    const beforeCursor = cursor > start && state.doc.textBetween(cursor - 1, cursor) === "\t";
    const removeAt = beforeCursor ? cursor - 1 : state.doc.textBetween(start, start + 1) === "\t" ? start : -1;
    if (removeAt >= 0) editor.view.dispatch(state.tr.delete(removeAt, removeAt + 1));
    return true;
  }

  const blocks = selectedTextblocks(editor);
  const tr = state.tr;
  for (let i = blocks.length - 1; i >= 0; i -= 1) {
    const { node, pos } = blocks[i];
    const level = indentLevel(node.attrs.indentLevel);
    if (level > 0) tr.setNodeMarkup(pos, undefined, { ...node.attrs, indentLevel: level - 1 });
    else if (tr.doc.textBetween(pos + 1, pos + 2) === "\t") tr.delete(pos + 1, pos + 2);
  }
  if (tr.docChanged) editor.view.dispatch(tr);
  return blocks.length > 0;
}

export const MarkdownTabIndent = Extension.create<Options>({
  name: "markdownTabIndent",
  // 목록/표의 기본 Tab 동작보다 먼저 확정 여부를 판단한다.
  priority: 1000,
  addGlobalAttributes() {
    return [{
      types: INDENTABLE_TYPES,
      attributes: {
        indentLevel: {
          default: 0,
          parseHTML: (element: HTMLElement) => indentLevel(element.getAttribute("data-indent-level")),
          renderHTML: (attributes: Record<string, unknown>) => {
            const level = indentLevel(attributes.indentLevel);
            return level > 0 ? { "data-indent-level": level, style: `margin-left: ${level * 2}em` } : {};
          },
        },
      },
    }];
  },
  addOptions() {
    return { wraps: [] };
  },
  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => editor.isActive("table") ? false : editor.state.selection.$from.parent.type.name === "codeBlock"
        ? indent(editor)
        : tryCommitMarkdownWrap(editor, this.options.wraps) || indent(editor),
      "Shift-Tab": ({ editor }) => editor.isActive("table") ? false : outdent(editor),
    };
  },
});
