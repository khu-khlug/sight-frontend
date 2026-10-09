import type { Node as TiptapNode } from "@tiptap/core";
import Audio from "@tiptap/extension-audio";
import { Blockquote } from "@tiptap/extension-blockquote";
import BoldExtension from "@tiptap/extension-bold";
import CodeExtension from "@tiptap/extension-code";
import { Details, DetailsContent, DetailsSummary } from "@tiptap/extension-details";
import FindAndReplace from "@tiptap/extension-find-and-replace";
import HeadingExtension from "@tiptap/extension-heading";
import { HorizontalRule } from "@tiptap/extension-horizontal-rule";
import Highlight from "@tiptap/extension-highlight";
import TiptapImage from "@tiptap/extension-image";
import InvisibleCharacters, { HardBreakNode, InvisibleCharacter, ParagraphNode, SpaceCharacter } from "@tiptap/extension-invisible-characters";
import ItalicExtension from "@tiptap/extension-italic";
import { BulletList, ListItem, OrderedList, TaskItem, TaskList } from "@tiptap/extension-list";
import Paragraph from "@tiptap/extension-paragraph";
import { BlockMath, InlineMath } from "@tiptap/extension-mathematics";
import StrikeExtension from "@tiptap/extension-strike";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import { BackgroundColor, Color, TextStyle } from "@tiptap/extension-text-style";
import UnderlineExtension from "@tiptap/extension-underline";
import YoutubeExtension from "@tiptap/extension-youtube";
import { CharacterCount, Placeholder } from "@tiptap/extensions";
import StarterKit from "@tiptap/starter-kit";
import "highlight.js/styles/github.css";
import "katex/dist/katex.min.css";
import { common, createLowlight } from "lowlight";
import type { MutableRefObject } from "react";
import { CodeBlock } from "./CodeBlock";
import { FileAttachment } from "./FileAttachment";
import { InteractiveTable } from "./InteractiveTable";
import { LinkWithIcons } from "./linkIcons";
import { TableOfContents } from "./TableOfContents";
import { PlainText, PLAIN_TEXT_DELIMITER } from "./PlainText";
import type { LinkServices } from "./linkIcons";
import { Video } from "./Video";
import { withMediaBlock } from "./MediaBlock";
import { withEditableMath } from "./EditableMath";
import { MathEditing } from "../BlockEditor/mathEditing";
import { MarkdownAutoformatHistory } from "../BlockEditor/markdownAutoformatHistory";
import { withDetailsOpenMemory } from "../BlockEditor/withDetailsOpenMemory";
import { MarkdownHeadingTabConfirm, withMarkdownHeadingPrefix } from "../BlockEditor/markdownHeadingPrefix";
import { withMarkdownWrapConfirm } from "../BlockEditor/markdownWrapMark";
import type { MarkdownWrapConfig } from "../BlockEditor/markdownWrapMark";
import { MarkdownTabIndent } from "../BlockEditor/markdownTabIndent";
import { MarkdownNodeConfirm } from "../BlockEditor/markdownNodeConfirm";

// CodeBlockLowlight가 요구하는 lowlight 인스턴스 — 등록된 언어 집합을 안에 들고 있을 뿐 그 외엔
// 상태가 없는 순수 팩토리 결과라, 렌더마다 새로 만들 필요 없이 모듈 스코프에 하나만 둔다.
const lowlight = createLowlight(common);

// 위키스타일
// 각 마크의 직접 입력 기호 — 확정 규칙과 도움말이 이 값을 참조한다.
export const WRAP_CHARS = {
  plainText: PLAIN_TEXT_DELIMITER,
  bold: "**",
  italic: "//",
  underline: "__",
  strike: "--",
  highlight: "==",
  code: "`",
  superscript: "^^",
  subscript: ",,",
} as const;

const WRAP_CONFIGS = {
  bold: { delimiter: WRAP_CHARS.bold, markName: "bold" },
  italic: { delimiter: WRAP_CHARS.italic, markName: "italic" },
  underline: { delimiter: WRAP_CHARS.underline, markName: "underline" },
  strike: { delimiter: WRAP_CHARS.strike, markName: "strike" },
  highlight: { delimiter: WRAP_CHARS.highlight, markName: "highlight" },
  code: { delimiter: WRAP_CHARS.code, markName: "code", preserveEscapes: true },
  superscript: { delimiter: WRAP_CHARS.superscript, markName: "superscript" },
  subscript: { delimiter: WRAP_CHARS.subscript, markName: "subscript" },
} satisfies Record<Exclude<keyof typeof WRAP_CHARS, "plainText">, MarkdownWrapConfig>;


// 블록 노드 확장을 변환하는 함수 — 에디터만 드래그 핸들 래퍼(withDragHandle)를 넘기고, 뷰어는 그대로 쓴다.
export type BlockDecorator = <Options, Storage>(extension: TiptapNode<Options, Storage>) => TiptapNode<Options, Storage>;

// linkServices: 링크가 쓰는 카드 자동완성 목록·카드 창 열기 — 편집기·뷰어가 ref로 넘겨 최신 값을 읽게 한다.
export function createBlockExtensions(
  placeholder?: string,
  defaultCodeWrap = false,
  block: BlockDecorator = (extension) => extension,
  defaultDropCursor = true,
  linkServices: MutableRefObject<LinkServices> | null = null,
) {
  return [
      StarterKit.configure({
        // 편집기는 목록 변환·핸들 좌표 보정과 위치 계산을 공유하는 안내선을 쓴다.
        dropcursor: defaultDropCursor ? {} : false,
        // 최상위 블록 노드는 block()으로 감싸서 따로 넣으므로 StarterKit 기본 것은 꺼야
        // 같은 노드 이름이 중복 등록되지 않는다.
        paragraph: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        horizontalRule: false,
        // 링크는 종류 아이콘을 다는 LinkWithIcons로 따로 넣는다(같은 이름이 중복 등록되지 않게 끈다).
        link: false,
        // 헤딩은 자체적으로 입력·Enter 이동이 가능하다. 뒤에 문단을 추가하는 트랜잭션이
        // 빈 헤딩의 storedMarks를 지워 기본 bold 입력을 해제하지 않도록 자동 추가에서 제외한다.
        trailingNode: { notAfter: ["heading"] },
        // docs/decision/dependency-tiptap-extensions.md에서 쓰지 않기로 한 기능이라 끈다
        // (블록 사이 가상 커서, 목록 전용 Backspace·Delete 키 처리).
        gapcursor: false,
        listKeymap: false,
        // CodeBlockLowlight가 같은 역할(codeBlock 노드)을 대신하므로 StarterKit 기본 CodeBlock은
        // 꺼야 한다 — 둘 다 켜두면 같은 노드 이름이 중복 등록된다.
        codeBlock: false,
        // 아래 withMarkdownWrapConfirm/withMarkdownHeadingPrefix로 대체하는 것들은 StarterKit
        // 기본값을 전부 꺼야 한다 — 안 그러면 같은 마크/노드 이름이 중복 등록된다.
        bold: false,
        code: false,
        italic: false,
        underline: false,
        strike: false,
        heading: false,
      }),
      block(Paragraph),
      block(Blockquote),
      // 목록 자체에는 핸들을 달지 않고 항목(ListItem/TaskItem)마다 단다.
      BulletList,
      OrderedList,
      block(ListItem),
      block(HorizontalRule),
      block(CodeBlock.configure({ lowlight, exitOnTripleEnter: false, defaultWrap: defaultCodeWrap })),
      // 클릭 동작은 LinkWithIcons가 직접 처리한다(편집기에서는 열지 않고, 뷰어에서는 카드 창·새 탭으로 연다).
      LinkWithIcons.configure({ openOnClick: false, autolink: true, services: linkServices }),
      PlainText,
      withMarkdownWrapConfirm(BoldExtension, WRAP_CONFIGS.bold),
      withMarkdownWrapConfirm(ItalicExtension, WRAP_CONFIGS.italic),
      withMarkdownWrapConfirm(UnderlineExtension, WRAP_CONFIGS.underline),
      withMarkdownWrapConfirm(StrikeExtension, WRAP_CONFIGS.strike),
      withMarkdownWrapConfirm(Highlight, WRAP_CONFIGS.highlight),
      withMarkdownWrapConfirm(CodeExtension, WRAP_CONFIGS.code),
      withMarkdownWrapConfirm(Superscript, WRAP_CONFIGS.superscript),
      withMarkdownWrapConfirm(Subscript, WRAP_CONFIGS.subscript),
      // 헤딩은 래핑이 아니라 줄 앞 "#" 개수로 레벨을 정하고 Enter·Tab으로 확정하는 구조라 별도
      // 함수(markdownHeadingPrefix.ts)를 쓴다.
      block(withMarkdownHeadingPrefix(HeadingExtension.configure({ levels: [1, 2, 3, 4, 5, 6] }), { char: "#", maxLevel: 6 })),
      MarkdownHeadingTabConfirm,
      TextStyle,
      Color,
      BackgroundColor,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      block(TaskItem.configure({ nested: true })),
      // detailsContent가 block+를 받고 details가 block 그룹이라 접는 블록 안에 접는 블록을 둘 수 있다.
      // 블록이 옮겨져 뷰가 새로 만들어져도 열림 상태가 유지되도록 withDetailsOpenMemory로 감싼다.
      block(withDetailsOpenMemory(Details.configure({
        renderToggleButton: ({ element, isOpen }) => {
          element.setAttribute("aria-label", isOpen ? "접는 블록 닫기" : "접는 블록 열기");
        },
      }))),
      DetailsSummary,
      DetailsContent,
      // TableKit이 만드는 table 노드는 끄고 block()으로 감싼 Table을 따로 넣는다.
      TableKit.configure({ table: false }),
      block(InteractiveTable),
      block(withMediaBlock(TiptapImage)),
      block(withMediaBlock(Audio)),
      block(withMediaBlock(Video)),
      block(FileAttachment),
      block(TableOfContents),
      block(withEditableMath(BlockMath).configure({ katexOptions: { displayMode: true } })),
      withEditableMath(InlineMath),
      MathEditing,
      block(withMediaBlock(YoutubeExtension)),
      // 기본값(visible: true)은 항상 보이지 않는 문자를 표시한 채로 시작해서, 토글 버튼이
      // 있는데도 처음엔 꺼진 상태로 보여야 한다는 기대와 안 맞는다.
      InvisibleCharacters.configure({
        visible: false,
        builders: [
          new SpaceCharacter(),
          new ParagraphNode(),
          new HardBreakNode(),
          new InvisibleCharacter({ type: "tab", predicate: (char) => char === "\t" }),
          new InvisibleCharacter({ type: "newline", predicate: (char) => char === "\n" }),
        ],
      }),
      FindAndReplace,
      CharacterCount,
      Placeholder.configure({
        // includeChildren 기본값(false)이면 최상위 블록만 검사해서 접는 블록 안의 제목·본문 줄에는
        // 표시되지 않는다. showOnlyCurrent를 끄면 커서가 없는 빈 줄에도 보인다.
        includeChildren: true,
        showOnlyCurrent: false,
        // 이 함수는 트랜잭션 적용 중에 호출돼서 editor.state는 아직 이전 문서다 — 위치(pos)로
        // 부모를 조회하면 범위를 벗어나 트랜잭션이 실패하므로 node만 본다. 본문 문구는 CSS가 맡는다.
        placeholder: ({ node }) => (node.type.name === "detailsSummary" ? "제목" : placeholder ?? ""),
      }),
      MarkdownTabIndent.configure({ wraps: Object.values(WRAP_CONFIGS) }),
      MarkdownNodeConfirm,
      // Ctrl+Z/Esc로 "방금 한 마크다운 자동변환"을 되돌리는 기능 — StarterKit의 내장 undo보다
      // 먼저 Mod-z를 가로채야 한다. Tiptap은 extensions 배열을 "뒤집은 뒤" 순서대로 키맵
      // 플러그인을 등록하므로(ExtensionManager.plugins), 배열에서 가장 나중에 둔 확장이 실제로는
      // 가장 먼저 검사된다 — 그래서 일부러 맨 끝에 둔다. 되돌릴 게 없으면 false를 반환해 내장
      // undo로 자연스럽게 넘어간다.
      MarkdownAutoformatHistory,
    ];
}
