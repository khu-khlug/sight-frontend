import { Extension } from "@tiptap/core";
import type { Editor } from "@tiptap/core";
import { Fragment } from "@tiptap/pm/model";
import { Plugin, TextSelection } from "@tiptap/pm/state";
import { consumeAutoformatSuppression, recordAutoformatConversion } from "../BlockEditor/markdownAutoformatHistory";
import { insidePlainText, plainTextRanges, PLAIN_TEXT_DELIMITER } from "../BlockEditor/plainTextSyntax";

export { PLAIN_TEXT_DELIMITER } from "../BlockEditor/plainTextSyntax";

function commitPlainText(editor: Editor): boolean {
  const { state } = editor;
  if (!state.selection.empty) return false;
  const range = plainTextRanges(state.doc).find((item) => item.closed && item.to === state.selection.from);
  if (!range || consumeAutoformatSuppression(editor, range.from)) return false;
  const from = range.from + PLAIN_TEXT_DELIMITER.length;
  const to = range.to - PLAIN_TEXT_DELIMITER.length;
  const text = state.doc.textBetween(from, to, "\n", "\n");
  const $start = state.doc.resolve(range.from);
  const $end = state.doc.resolve(range.to);
  const replaceFrom = $start.before();
  const replaceTo = $end.after();
  const prefix = $start.parent.content.cut(0, $start.parentOffset);
  const suffix = $end.parent.content.cut($end.parentOffset);
  const lines = text.split(/\r?\n/);
  const paragraphs = lines.map((line, index) => {
    let content = line ? Fragment.from(state.schema.text(line)) : Fragment.empty;
    if (index === 0) content = prefix.append(content);
    if (index === lines.length - 1) content = content.append(suffix);
    return state.schema.nodes.paragraph.create(null, content);
  });
  const size = paragraphs.reduce((total, node) => total + node.nodeSize, 0);
  const cursor = replaceFrom + size - 1 - suffix.size;
  const tr = state.tr.replaceWith(replaceFrom, replaceTo, paragraphs);
  tr.setSelection(TextSelection.create(tr.doc, cursor));
  tr.setStoredMarks([]);
  tr.setMeta("preventAutolink", true);
  editor.view.dispatch(tr);
  recordAutoformatConversion(editor, {
    from: replaceFrom,
    to: replaceFrom + size,
    original: state.doc.textBetween(replaceFrom, replaceTo, "\n", "\n"),
    originalSlice: state.doc.slice(replaceFrom, replaceTo),
    originalCursor: state.selection.from,
  });
  return true;
}

// 확정 전의 기호 안에서만 자동 서식을 막는다. 확정 결과는 마크 없는 일반 문단이다.
export const PlainText = Extension.create({
  name: "plainText",
  priority: 1200,
  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => commitPlainText(editor),
      Enter: ({ editor }) => insidePlainText(editor.state.doc, editor.state.selection.from)
        ? editor.chain().splitBlock().command(({ tr }) => { tr.setMeta("preventAutolink", true); return true; }).run()
        : false,
    };
  },
  addProseMirrorPlugins() {
    return [new Plugin({
      props: {
        handleTextInput(view, from, to, text) {
          if (!insidePlainText(view.state.doc, from)) return false;
          view.dispatch(view.state.tr.insertText(text, from, to).setMeta("preventAutolink", true));
          return true;
        },
        handlePaste(view, event) {
          if (!insidePlainText(view.state.doc, view.state.selection.from) || !event.clipboardData) return false;
          event.preventDefault();
          view.dispatch(view.state.tr.insertText(event.clipboardData.getData("text/plain")).setMeta("preventAutolink", true));
          return true;
        },
      },
    })];
  },
});
