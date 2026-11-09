import { Extension } from "@tiptap/core";
import type { Editor } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
import { consumeAutoformatSuppression, recordAutoformatConversion } from "./markdownAutoformatHistory";
import { hasPlainText } from "./markdownWrapMark";

// 마크다운 링크 문법 중 [텍스트](주소)만 지원한다. 텍스트는 비어 있을 수 없고 주소에는 공백·괄호를 쓰지 않는다.
const LINK_PATTERN = /\[([^[\]]+)\]\(([^()\s]*)\)/g;

// 커서가 문법 안(여는 [ 뒤 ~ 닫는 ) 앞)이나 닫는 ) 바로 뒤에 있는 링크 문법을 찾는다. \[로 시작하면 문법으로 보지 않는다.
function linkAtCursor(text: string, cursor: number) {
  for (const match of text.matchAll(LINK_PATTERN)) {
    const start = match.index;
    if (text[start - 1] === "\\") continue;
    const end = start + match[0].length;
    if (cursor > start && cursor <= end) return { start, end, label: match[1], href: match[2] };
  }
  return null;
}

function commitLink(editor: Editor): boolean {
  const { state } = editor;
  const { selection } = state;
  if (!selection.empty || !selection.$from.parent.isTextblock) return false;
  const link = linkAtCursor(selection.$from.parent.textContent, selection.$from.parentOffset);
  if (!link) return false;
  const from = selection.$from.start() + link.start;
  const to = selection.$from.start() + link.end;
  if (hasPlainText(state, from, to)) return false;
  if (consumeAutoformatSuppression(editor, from)) return false;

  const linkType = state.schema.marks.link;
  const originalSlice = state.doc.slice(from, to);
  const labelEnd = from + link.label.length;
  // "](주소)"와 "["만 지우고 가운데 글자는 그대로 둬서, 글자에 걸린 다른 서식(굵게 등)을 유지한다.
  const tr = state.tr
    .delete(from + 1 + link.label.length, to)
    .delete(from, from + 1)
    .addMark(from, labelEnd, linkType.create({ href: link.href }));
  tr.setSelection(TextSelection.create(tr.doc, labelEnd));
  // 링크는 끝에서 이어 쓰면 늘어나는 마크라, 확정 직후 입력은 링크 밖에서 시작하게 한다.
  tr.removeStoredMark(linkType);
  editor.view.dispatch(tr);
  recordAutoformatConversion(editor, { from, to: labelEnd, original: state.doc.textBetween(from, to), originalSlice });
  return true;
}

export const MarkdownLinkConfirm = Extension.create({
  name: "markdownLinkConfirm",
  // 목록·표의 Tab과 들여쓰기(MarkdownTabIndent)보다 먼저 확정 여부를 판단한다 — MarkdownNodeConfirm과 같은 우선순위다.
  priority: 1100,
  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => commitLink(editor),
    };
  },
});
