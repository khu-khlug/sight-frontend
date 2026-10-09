import type { Editor, Mark } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
import type { EditorState } from "@tiptap/pm/state";
import { consumeAutoformatSuppression, recordAutoformatConversion } from "./markdownAutoformatHistory";
import { plainTextRanges } from "./plainTextSyntax";

// 마크 하나가 쓰는 여는/닫는 기호(같은 문자열).
export type MarkdownWrapConfig = {
  delimiter: string;
  markName: string;
  preserveEscapes?: boolean;
};

// 바깥 문법을 확정할 때도 플레인 텍스트 영역을 포함해서 변환하지 않는다.
export function hasPlainText(state: EditorState, from: number, to: number): boolean {
  return plainTextRanges(state.doc).some((range) => from < range.to && to > range.from);
}

// \t, \n, \<글자> 이스케이프를 실제 문자로 바꾼다 — 마크다운 자체의 "백슬래시 하나는 바로 다음
// 글자를 리터럴로 만든다"는 관례와 같다. 모르는 조합(\x 등)도 백슬래시만 지우고 그 글자를
// 남긴다.
function resolveEscapes(text: string): string {
  return text.replace(/\\([\s\S])/g, (_, char: string) => {
    if (char === "t") return "\t";
    if (char === "n") return "\n";
    return char;
  });
}

// 커서 앞에서 아직 닫히지 않은 여는 기호와 커서 뒤의 첫 닫는 기호를 찾는다.
// 커서가 기호 자체의 중간에 있거나 이전 쌍이 이미 닫혔으면 확정하지 않는다.
function findWrapAroundCursor(text: string, cursorOffset: number, delimiter: string) {
  let openIndex = -1;
  let i = 0;
  while (i < text.length) {
    if (text[i] === "\\") { i += 2; continue; }
    if (!text.startsWith(delimiter, i)) { i += 1; continue; }
    if (i < cursorOffset && cursorOffset < i + delimiter.length) return null;
    if (i >= cursorOffset) {
      return openIndex === -1 ? null : { openIndex, closeIndex: i };
    }
    openIndex = openIndex === -1 ? i : -1;
    i += delimiter.length;
  }
  return null;
}

// text를 처음부터 끝까지 스캔하면서(이스케이프를 건너뛰며) "이스케이프 안 된" delimiter가 나온
// 마지막 위치를 기억한다 — 끝에서부터 거꾸로 세면 바로 앞 백슬래시가 그 글자를 이스케이프한
// 것인지(홀수 개의 연속된 백슬래시인지) 판정할 수 없어서, 항상 앞에서부터 세야 한다.
function findLastUnescaped(text: string, delimiter: string): number {
  let last = -1;
  let i = 0;
  while (i < text.length) {
    if (text[i] === "\\") { i += 2; continue; }
    if (text.startsWith(delimiter, i)) {
      last = i;
      i += delimiter.length;
    } else {
      i += 1;
    }
  }
  return last;
}

function applyWrapResult(editor: Editor, from: number, to: number, content: string, markName: string, delimiterLength: number, preserveEscapes = false) {
  const { state } = editor;
  const original = state.doc.textBetween(from, to);
  const originalSlice = state.doc.slice(from, to);
  const continuationMarks = (state.doc.nodeAt(from)?.marks ?? state.doc.resolve(from).marks())
    .filter((mark) => mark.type.name !== markName);
  const resolved = preserveEscapes ? content : resolveEscapes(content);
  const tr = state.tr
    .delete(to - delimiterLength, to)
    .delete(from, from + delimiterLength);

  // 기호만 지우고 기존 내용의 마크는 유지한다. 이스케이프는 뒤에서부터 풀어 앞쪽 위치가
  // 변하지 않게 하고, 대체 문자에는 원래 이스케이프된 글자의 마크를 물려준다.
  const escapes = preserveEscapes ? [] : [...content.matchAll(/\\([\s\S])/g)];
  for (let i = escapes.length - 1; i >= 0; i -= 1) {
    const escape = escapes[i];
    const escapeFrom = from + (escape.index ?? 0);
    const marks = tr.doc.nodeAt(escapeFrom + 1)?.marks ?? [];
    tr.replaceWith(escapeFrom, escapeFrom + escape[0].length, state.schema.text(resolveEscapes(escape[0]), marks));
  }

  const contentEnd = from + resolved.length;
  tr.addMark(from, contentEnd, state.schema.marks[markName].create());
  tr.setSelection(TextSelection.create(tr.doc, contentEnd));
  // 닫는 기호 뒤에서는 방금 확정한 마크를 끄고, 여는 기호가 속해 있던 바깥 서식만 이어간다.
  tr.setStoredMarks(continuationMarks);
  editor.view.dispatch(tr);
  recordAutoformatConversion(editor, { from, to: contentEnd, original, originalSlice });
}

// 아우터 확정 — 커서 바로 앞이 "이스케이프 안 된" delimiter로 막 끝났는지, 그 앞에 역시
// 이스케이프 안 된 delimiter(여는 기호)가 더 있는지를 본다. 닫는 기호가 미리 있어야 한다는 제약은
// 없다(이 함수 자체가 "커서 직전에 기호로 끝났다"는 것부터 확인하므로 자동으로 충족된다).
function tryOuterConfirm(editor: Editor, { delimiter, markName, preserveEscapes }: MarkdownWrapConfig): boolean {
  const { selection } = editor.state;
  if (!selection.empty) return false;
  const { $from } = selection;
  const blockStart = $from.start();
  const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);
  if (textBefore.length === 0) return false;

  const closeIndex = textBefore.length - delimiter.length;
  if (closeIndex < 0 || !textBefore.endsWith(delimiter)) return false;
  if (findLastUnescaped(textBefore, delimiter) !== closeIndex) return false;

  const openIndex = findLastUnescaped(textBefore.slice(0, closeIndex), delimiter);
  if (openIndex === -1) return false;
  const content = textBefore.slice(openIndex + delimiter.length, closeIndex);
  if (content.length === 0 || /^\s/.test(content)) return false;

  const openStart = blockStart + openIndex;
  if (hasPlainText(editor.state, openStart, blockStart + closeIndex + delimiter.length)) return false;
  if (consumeAutoformatSuppression(editor, openStart)) return false;
  applyWrapResult(editor, openStart, blockStart + closeIndex + delimiter.length, content, markName, delimiter.length, preserveEscapes);
  return true;
}

// 이너 확정 — 커서가 여는 기호와 닫는 기호 사이의 어느 위치에 있든 작동한다.
// 닫는 기호가 아직 없거나 커서 앞에서 이미 쌍이 닫혔으면 확정하지 않는다.
function tryInnerConfirm(editor: Editor, { delimiter, markName, preserveEscapes }: MarkdownWrapConfig): boolean {
  const { selection } = editor.state;
  if (!selection.empty) return false;
  const { $from } = selection;
  const blockStart = $from.start();
  const blockText = $from.parent.textContent;
  const cursorOffset = $from.parentOffset;
  const wrap = findWrapAroundCursor(blockText, cursorOffset, delimiter);
  if (!wrap) return false;
  const { openIndex, closeIndex } = wrap;
  const content = blockText.slice(openIndex + delimiter.length, closeIndex);
  if (content.length === 0 || /^\s/.test(content)) return false;

  const openStart = blockStart + openIndex;
  if (hasPlainText(editor.state, openStart, blockStart + closeIndex + delimiter.length)) return false;
  if (consumeAutoformatSuppression(editor, openStart)) return false;
  applyWrapResult(editor, openStart, blockStart + closeIndex + delimiter.length, content, markName, delimiter.length, preserveEscapes);
  return true;
}

// Tab 처리기는 한곳에서 모든 기호를 검사한다. 기호 사이의 이너 확정을 먼저 확인하고,
// 기호를 막 닫은 직후의 아우터 확정을 확인한다.
export function tryCommitMarkdownWrap(editor: Editor, configs: readonly MarkdownWrapConfig[]): boolean {
  for (const config of configs) {
    if (tryInnerConfirm(editor, config)) return true;
  }
  for (const config of configs) {
    if (tryOuterConfirm(editor, config)) return true;
  }
  return false;
}

// 기존 확장(Bold 등)의 입력/붙여넣기 규칙을 끈다. 원래 단축키(Mod-B 등)는 그대로 상속한다.
export function withMarkdownWrapConfirm<T extends Mark>(mark: T, config: MarkdownWrapConfig): T {
  if (!config.delimiter) throw new Error("Markdown wrap delimiter must not be empty");
  return mark.extend({
    addInputRules() {
      return [];
    },
    addPasteRules() {
      return [];
    },
  }) as T;
}
