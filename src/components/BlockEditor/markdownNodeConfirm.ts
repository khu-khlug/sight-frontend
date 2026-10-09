import { Extension } from "@tiptap/core";
import type { Editor } from "@tiptap/core";
import { Selection, TextSelection } from "@tiptap/pm/state";
import { consumeAutoformatSuppression, recordAutoformatConversion } from "./markdownAutoformatHistory";
import { hasPlainText } from "./markdownWrapMark";

export const MARKDOWN_NODE_CHARS = {
  codeBlock: "```",
  inlineMath: "$",
  blockMath: "$$",
} as const;

function delimiterPositions(text: string, delimiter: string): number[] {
  const positions: number[] = [];
  for (let i = 0; i < text.length;) {
    if (text[i] === "\\") { i += 2; continue; }
    if (text.startsWith(delimiter, i)) {
      // 한 개의 $는 수식블록의 $$ 일부로 취급하지 않는다.
      if (delimiter !== "$" || (text[i - 1] !== "$" && text[i + 1] !== "$")) positions.push(i);
      i += delimiter.length;
    } else {
      i += 1;
    }
  }
  return positions;
}

function pairAtCursor(text: string, cursor: number, delimiter: string, wholeBlock = false) {
  const positions = delimiterPositions(text, delimiter);
  for (let i = 0; i + 1 < positions.length; i += 2) {
    const open = positions[i];
    const close = positions[i + 1];
    if (wholeBlock && (open !== 0 || close + delimiter.length !== text.length)) continue;
    const inside = cursor >= open + delimiter.length && cursor <= close;
    const outside = cursor === close + delimiter.length;
    if ((inside || outside) && text.slice(open + delimiter.length, close).trim()) return { open, close };
  }
  return null;
}

function commitBlock(editor: Editor, delimiter: string, nodeName: "codeBlock" | "blockMath"): boolean {
  const { state } = editor;
  const { selection } = state;
  if (!selection.empty || !selection.$from.parent.isTextblock || selection.$from.parent.type.name !== "paragraph") return false;
  const text = selection.$from.parent.textContent;
  const pair = pairAtCursor(text, selection.$from.parentOffset, delimiter, true);
  if (!pair) return false;
  const pos = selection.$from.before();
  if (consumeAutoformatSuppression(editor, pos)) return false;
  const content = text.slice(pair.open + delimiter.length, pair.close);
  const oldNode = selection.$from.parent;
  if (hasPlainText(state, pos, pos + oldNode.nodeSize)) return false;
  const node = nodeName === "codeBlock"
    ? state.schema.nodes.codeBlock.create(null, state.schema.text(content))
    : state.schema.nodes.blockMath.create({ latex: content });
  const originalSlice = state.doc.slice(pos, pos + oldNode.nodeSize);
  const tr = state.tr.replaceWith(pos, pos + oldNode.nodeSize, node);
  const after = pos + node.nodeSize;
  if (nodeName === "codeBlock") {
    tr.setSelection(TextSelection.create(tr.doc, after - 1));
  } else {
    if (after === tr.doc.content.size) tr.insert(after, state.schema.nodes.paragraph.create());
    tr.setSelection(Selection.near(tr.doc.resolve(after)));
  }
  editor.view.dispatch(tr);
  recordAutoformatConversion(editor, { from: pos, to: after, original: text, originalSlice });
  return true;
}

function commitInlineMath(editor: Editor): boolean {
  const { state } = editor;
  const { selection } = state;
  if (!selection.empty || !selection.$from.parent.isTextblock) return false;
  const text = selection.$from.parent.textContent;
  const pair = pairAtCursor(text, selection.$from.parentOffset, MARKDOWN_NODE_CHARS.inlineMath);
  if (!pair) return false;
  const from = selection.$from.start() + pair.open;
  const to = selection.$from.start() + pair.close + 1;
  if (hasPlainText(state, from, to)) return false;
  if (consumeAutoformatSuppression(editor, from)) return false;
  const originalSlice = state.doc.slice(from, to);
  const tr = state.tr.replaceWith(from, to, state.schema.nodes.inlineMath.create({
    latex: text.slice(pair.open + 1, pair.close),
  }));
  tr.setSelection(TextSelection.create(tr.doc, from + 1));
  editor.view.dispatch(tr);
  recordAutoformatConversion(editor, { from, to: from + 1, original: text.slice(pair.open, pair.close + 1), originalSlice });
  return true;
}

export const MarkdownNodeConfirm = Extension.create({
  name: "markdownNodeConfirm",
  priority: 1100,
  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) =>
        commitBlock(editor, MARKDOWN_NODE_CHARS.codeBlock, "codeBlock") ||
        commitBlock(editor, MARKDOWN_NODE_CHARS.blockMath, "blockMath") ||
        commitInlineMath(editor),
    };
  },
});
