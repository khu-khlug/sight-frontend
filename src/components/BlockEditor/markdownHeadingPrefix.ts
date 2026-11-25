import { Extension } from "@tiptap/core";
import type { Command, Editor, KeyboardShortcutCommand, Node } from "@tiptap/core";
import { consumeAutoformatSuppression, recordAutoformatConversion } from "./markdownAutoformatHistory";
import { hasPlainText } from "./markdownWrapMark";

// 헤딩은 마크가 아니라 블록(노드) 전체를 바꾸는 것이라 markdownWrapMark.ts의 "여는/닫는 기호로
// 감싸기" 모델과 구조가 다르다 — 닫는 기호 없이 "# " 개수로 레벨을 정하고, Enter·Tab으로 확정한다.
export type MarkdownHeadingPrefixConfig = {
  char: string;
  maxLevel: number;
  commitKeys?: string[];
};

const DEFAULT_COMMIT_KEYS = ["Enter"];

// CSS로 굵기를 고정하지 않고 헤딩 내용과 이어서 입력할 글자에 일반 bold 마크를 적용한다.
export const applyDefaultHeadingBold: Command = ({ tr }) => {
  const bold = tr.doc.type.schema.marks.bold.create();
  const { from, to, empty, $from } = tr.selection;
  if (empty) {
    if ($from.parent.type.name !== "heading") return true;
    tr.addMark($from.start(), $from.end(), bold);
    tr.addStoredMark(bold);
  } else {
    tr.doc.nodesBetween(from, to, (node, pos) => {
      if (node.type.name === "heading") tr.addMark(pos + 1, pos + node.nodeSize - 1, bold);
    });
  }
  return true;
};

function escapeForRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// 문단 맨 앞에서 "#" 등을 1~maxLevel개 치고 스페이스, 그 뒤 내용이 있는지 본다. 이미 헤딩인
// 블록(레벨을 바꾸는 경우)은 다루지 않는다 — 이 단축키는 "새로 헤딩이 되는" 경우만 처리한다.
function tryCommitHeadingPrefix(editor: Editor, { char, maxLevel }: MarkdownHeadingPrefixConfig): boolean {
  const { selection } = editor.state;
  if (!selection.empty) return false;
  const { $from } = selection;
  if ($from.parent.type.name === "heading") return false;

  const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);
  const pattern = new RegExp(`^(${escapeForRegExp(char)}{1,${maxLevel}}) (.*)$`);
  const match = textBefore.match(pattern);
  if (!match) return false;

  const level = match[1].length;
  const content = match[2];
  const blockStart = $from.start();
  if (hasPlainText(editor.state, blockStart, blockStart + textBefore.length)) return false;

  if (consumeAutoformatSuppression(editor, blockStart)) return false;
  const originalSlice = editor.state.doc.slice(blockStart, blockStart + textBefore.length);

  const applied = editor
    .chain()
    .focus()
    .deleteRange({ from: blockStart, to: blockStart + textBefore.length })
    .insertContentAt(blockStart, content)
    .setNode("heading", { level })
    .command(applyDefaultHeadingBold)
    .run();
  if (!applied) return false;
  // Ctrl+Z/Esc로 "방금 이 변환"을 되돌릴 수 있도록 기록한다 — 노드 타입 자체가 바뀌었으니
  // revertNodeType으로 되돌릴 타입(본문 문단)도 같이 적어둔다. 체인 안에 끼워 넣지 않는 이유는
  // markdownWrapMark.ts의 applyWrapResult와 같다.
  recordAutoformatConversion(editor, { from: blockStart, to: blockStart + content.length, original: textBefore, originalSlice, revertNodeType: "paragraph" });
  return true;
}

// 노드 우선순위를 바꾸면 기본 빈 블록이 heading이 될 수 있으므로, Tab 처리만 별도로 앞세운다.
export const MarkdownHeadingTabConfirm = Extension.create<MarkdownHeadingPrefixConfig>({
  name: "markdownHeadingTabConfirm",
  priority: 1100,
  addOptions() {
    return { char: "#", maxLevel: 6 };
  },
  addKeyboardShortcuts() {
    return { Tab: ({ editor }) => tryCommitHeadingPrefix(editor, this.options) };
  },
});

// Enter는 제목 확정 후 기본 줄바꿈을 이어간다.
export function withMarkdownHeadingPrefix<T extends Node>(heading: T, config: MarkdownHeadingPrefixConfig): T {
  const commitKeys = config.commitKeys ?? DEFAULT_COMMIT_KEYS;
  return heading.extend({
    // 기본 '# ' 입력 규칙은 키 확정과 기본 bold 적용을 우회하므로 끈다.
    addInputRules() {
      return [];
    },
    addKeyboardShortcuts() {
      const parentShortcuts = this.parent?.() ?? {};
      const shortcuts: Record<string, KeyboardShortcutCommand> = { ...parentShortcuts };
      for (let level = 1; level <= config.maxLevel; level += 1) {
        const headingLevel = level as 1 | 2 | 3 | 4 | 5 | 6;
        shortcuts[`Mod-Alt-${level}`] = ({ editor }) => editor.chain()
          .toggleHeading({ level: headingLevel })
          .command(applyDefaultHeadingBold)
          .run();
      }
      for (const key of commitKeys) {
        const fallback = parentShortcuts[key];
        shortcuts[key] = (props) => {
          const committed = tryCommitHeadingPrefix(props.editor, config);
          if (committed && key !== "Enter") return true;
          return fallback ? fallback(props) : false;
        };
      }
      return shortcuts;
    },
  }) as T;
}
