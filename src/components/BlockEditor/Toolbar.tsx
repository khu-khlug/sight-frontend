import { Dialog, Portal } from "@chakra-ui/react";
import { useEditorState } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import ColorPaletteMenu from "./ColorPaletteMenu";
import HeadingMenu from "./HeadingMenu";
import { applyListType as applyListTypeTo, insertDetails } from "./blockCommands";
import type { ListTypeName } from "./convertList";
import { applyDefaultHeadingBold } from "./markdownHeadingPrefix";
import { MARKDOWN_NODE_CHARS } from "./markdownNodeConfirm";
import { WRAP_CHARS } from "../BlockContent/extensions";
import { insertMathInput, mathEditingKey } from "./mathEditing";
import { insertMediaInput, isMediaInputBusy } from "./mediaInput/mediaInputState";
import { hasTableOfContents } from "../BlockContent/TableOfContents";
import type { MediaKind } from "./mediaInput/mediaKinds";
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, ListCollapse, Eraser,
  Bold, Code, ChevronsLeftRightEllipsis, Info,
  Highlighter, Image as ImageIcon, Italic, Radical, Link, List, ListChecks, ListOrdered,
  ListTree, Minus, Music, Paperclip, Pilcrow, Quote, Redo2,
  Search, SendHorizonal, Sigma, SmilePlus, Strikethrough, Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon, Table as TableIcon, Underline as UnderlineIcon, Undo2, Youtube as YoutubeIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Fragment, lazy, memo, Suspense, useEffect, useState } from "react";
import type { ReactNode } from "react";

import { cn } from "../../util/cn";
import AppTooltip from "../AppTooltip";
import styles from "./style.module.css";

const LazyEmojiPicker = lazy(() => import("../EmojiPicker"));

type Props = {
  editor: Editor;
  disabled: boolean;
  // 보내기 버튼을 누르면 호출된다 — 본문 직렬화와 보낼 수 있는지 확인은 BlockEditor가 한다.
  onSubmit: () => void;
  // 색 팔레트가 열려 있는 동안 바깥 root가 선택 영역 표시를 투명하게 바꾼다.
  onPaletteOpenChange: (open: boolean) => void;
  // 툴바 아래 찾기/바꾸기 줄이 열려 있는지와 그 토글 — 열림 상태는 BlockEditor가 들고 있다(Ctrl+F도 같은 상태를 쓴다).
  findOpen: boolean;
  onToggleFind: () => void;
};

type ToolbarButtonProps = {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
};

// groups 배열 하나로 전부 표현하기 위한 타입 — 보통은 아이콘 버튼(button)이지만, HeadingMenu/
// EmojiPicker처럼 {icon,label,onClick} 모양이 아닌 컴포넌트를 끼워 넣어야 할 자리는 custom으로
// 표시하고 render()가 그 자리에 그릴 걸 직접 돌려준다 — 배열을 쪼개지 않고 순서를 한곳에서
// 그대로 다룰 수 있게 하기 위함이다.
type ToolbarItemSpec =
  | ({ type: "button" } & ToolbarButtonProps & { key: string })
  | { type: "custom"; key: string; render: () => ReactNode };

// 툴바로 링크를 새로 넣을 때 들어가는 글자 — 선택된 채로 들어가서 바로 입력하면 바뀐다.
const LINK_PLACEHOLDER = "링크";

const USAGE_ROWS = [
  { style: "플레인 텍스트", format: `${WRAP_CHARS.plainText}텍스트${WRAP_CHARS.plainText}`, shortcut: "" },
  { style: "굵게", format: `${WRAP_CHARS.bold}텍스트${WRAP_CHARS.bold}`, shortcut: "Ctrl+B" },
  { style: "기울임", format: `${WRAP_CHARS.italic}텍스트${WRAP_CHARS.italic}`, shortcut: "Ctrl+I" },
  { style: "밑줄", format: `${WRAP_CHARS.underline}텍스트${WRAP_CHARS.underline}`, shortcut: "Ctrl+U" },
  { style: "취소선", format: `${WRAP_CHARS.strike}텍스트${WRAP_CHARS.strike}`, shortcut: "Ctrl+Shift+S" },
  { style: "하이라이트", format: `${WRAP_CHARS.highlight}텍스트${WRAP_CHARS.highlight}`, shortcut: "Ctrl+Shift+H" },
  { style: "위첨자", format: `${WRAP_CHARS.superscript}텍스트${WRAP_CHARS.superscript}`, shortcut: "Ctrl+." },
  { style: "아래첨자", format: `${WRAP_CHARS.subscript}텍스트${WRAP_CHARS.subscript}`, shortcut: "Ctrl+," },
  { style: "인라인 코드", format: `${WRAP_CHARS.code}코드${WRAP_CHARS.code}`, shortcut: "Ctrl+E" },
  { style: "코드 블록", format: `${MARKDOWN_NODE_CHARS.codeBlock}코드${MARKDOWN_NODE_CHARS.codeBlock}`, shortcut: "Ctrl+Alt+C" },
  { style: "인라인 수식", format: `${MARKDOWN_NODE_CHARS.inlineMath}LaTeX${MARKDOWN_NODE_CHARS.inlineMath}`, shortcut: "" },
  { style: "수식 블록", format: `${MARKDOWN_NODE_CHARS.blockMath}LaTeX${MARKDOWN_NODE_CHARS.blockMath}`, shortcut: "" },
  { style: "링크", format: "[텍스트](주소)", shortcut: "" },
  { style: "제목 1~6", format: "# 제목 … ###### 제목", shortcut: "Ctrl+Alt+1~6" },
];

function UsageTable({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <span className={styles.usageTooltipGrid}>
        <span>스타일</span><span>형식</span><span>단축키</span>
        {USAGE_ROWS.map((row) => (
          <Fragment key={row.style}>
            <span>{row.style}</span>
            <span className={styles.usageTooltipFormat}>{row.format}</span>
            <span>{row.shortcut}</span>
          </Fragment>
        ))}
      </span>
    );
  }

  return (
    <div className={styles.usageTableScroll}>
      <table className={styles.usageTable}>
        <thead>
          <tr>
            <th scope="col">스타일</th>
            <th scope="col">형식</th>
            <th scope="col">단축키</th>
          </tr>
        </thead>
        <tbody>
          {USAGE_ROWS.map((row) => (
            <tr key={row.style}>
              <th scope="row">{row.style}</th>
              <td><code>{row.format}</code></td>
              <td>{row.shortcut}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ToolbarButton({ icon: Icon, label, onClick, isActive, disabled }: ToolbarButtonProps) {
  return (
    <AppTooltip content={label} placement="top">
      <button
        type="button"
        className={cn(styles.toolbarButton, isActive ? styles.toolbarButtonActive : undefined)}
        aria-pressed={isActive}
        disabled={disabled}
        onClick={onClick}
      >
        <Icon size={16} />
      </button>
    </AppTooltip>
  );
}

/*
 * 툴바는 본문 입력(글자마다 일어나는 문서 변경)과 분리된 컴포넌트다. 자기 상태는 useEditorState의
 * selector 결과(눌림 상태 등)가 바뀔 때만 다시 그려지고, 부모가 다시 그려져도 memo로 건너뛴다.
 */
function Toolbar({ editor, disabled, onSubmit, onPaletteOpenChange, findOpen, onToggleFind }: Props) {
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const rememberColor = (color: string) => {
    setRecentColors((previous) => [color, ...previous.filter((item) => item !== color)].slice(0, 9));
  };

  // GroupChat 탭 채팅 입력창과 같은 이모지 선택기를 그대로 재사용한다 — 누르면 이모지 버튼
  // 자리가 EmojiPicker(자체 트리거+팝오버)로 바뀌는 구조도 거기와 동일하다.
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [usageOpen, setUsageOpen] = useState(false);
  const [openPalettes, setOpenPalettes] = useState({ text: false, background: false });
  const paletteOpen = openPalettes.text || openPalettes.background;
  useEffect(() => { onPaletteOpenChange(paletteOpen); }, [paletteOpen, onPaletteOpenChange]);

  // editor.isActive(...)는 그 자체로 반응형이 아니다 — 렌더 시점의 스냅샷일 뿐이라, 커서만
  // 옮기거나 마크를 토글해도(본문 내용 자체는 안 바뀌는 트랜잭션) onUpdate가 안 불려
  // 리렌더되지 않는다. useEditorState가 매 트랜잭션마다 selector 결과를 비교해서 바뀐 경우만
  // 리렌더시켜준다 — 툴바 버튼의 눌림 상태가 커서 위치를 정확히 따라가게 하는 데 필요하다.
  const toolbarState = useEditorState({
    editor,
    selector: ({ editor: current }) => {
      const { empty, $from } = current.state.selection;
      const attrs = $from.parent.attrs;
      // 정렬을 지정하지 않은 문단·헤딩도 기본 왼쪽 정렬로 표시한다.
      // 정렬 속성이 없는 코드 블록 등에서는 정렬 버튼을 활성화하지 않는다.
      const cursorAlignment = "textAlign" in attrs ? attrs.textAlign ?? "left" : null;
      const isAlignmentActive = (alignment: string) => empty
        ? cursorAlignment === alignment
        : current.isActive({ textAlign: alignment });
      return {
        canUndo: current.can().undo(),
        canRedo: current.can().redo(),
        headingLevel: current.getAttributes("heading").level as number | undefined,
        bold: current.isActive("bold"),
        italic: current.isActive("italic"),
        underline: current.isActive("underline"),
        strike: current.isActive("strike"),
        subscript: current.isActive("subscript"),
        superscript: current.isActive("superscript"),
        code: current.isActive("code"),
        link: current.isActive("link"),
        highlight: current.isActive("highlight"),
        textColor: current.getAttributes("textStyle").color as string | undefined,
        backgroundColor: current.getAttributes("textStyle").backgroundColor as string | undefined,
        alignLeft: isAlignmentActive("left"),
        alignCenter: isAlignmentActive("center"),
        alignRight: isAlignmentActive("right"),
        alignJustify: isAlignmentActive("justify"),
        detailsSummary: current.isActive("detailsSummary"),
        blockquote: current.isActive("blockquote"),
        codeBlock: current.isActive("codeBlock"),
        mathEditing: mathEditingKey.getState(current.state) != null,
        mediaBusy: isMediaInputBusy(current.state),
        tableOfContents: hasTableOfContents(current.state),
        invisibleCharactersVisible: current.storage.invisibleCharacters?.visibility() ?? false,
      };
    },
  });

  const handleInsertDetails = () => insertDetails(editor);
  const applyListType = (target: ListTypeName) => applyListTypeTo(editor, target);

  const openMediaInput = (kind: MediaKind) => insertMediaInput(editor, kind, { focus: true });

  const handleSelectHeading = (level: number | null) => {
    if (level === null) {
      const { from, to, empty, $from } = editor.state.selection;
      const headingRanges: { from: number; to: number }[] = [];
      if (empty) {
        if ($from.parent.type.name !== "heading") return;
        headingRanges.push({ from: $from.start(), to: $from.end() });
      } else {
        editor.state.doc.nodesBetween(from, to, (node, pos) => {
          if (node.type.name === "heading") {
            headingRanges.push({ from: pos + 1, to: pos + node.nodeSize - 1 });
          }
        });
        if (!headingRanges.length) return;
      }
      editor.chain().focus()
        .setParagraph()
        .command(({ tr }) => {
          const bold = tr.doc.type.schema.marks.bold;
          // 본문으로 되돌린 헤딩 전체와 이어서 입력할 글자의 볼드를 해제한다.
          for (const range of headingRanges) tr.removeMark(range.from, range.to, bold);
          tr.removeStoredMark(bold);
          return true;
        })
        .run();
      return;
    }
    editor.chain().focus()
      .setNode("heading", { level }).command(applyDefaultHeadingBold).run();
  };
  // 링크 안이면 링크를 풀고, 아니면 선택한 글자(없으면 안내 글자를 넣어 선택해 둔다 — 바로 입력하면 바뀐다)에
  // 주소 없는 링크를 건다. 주소는 링크 앞 아이콘을 눌러 입력한다.
  const toggleLink = () => {
    if (editor.isActive("link")) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    const { from, empty } = editor.state.selection;
    if (!empty) {
      editor.chain().focus().setMark("link", { href: "" }).run();
      return;
    }
    editor.chain().focus()
      .insertContent({ type: "text", text: LINK_PLACEHOLDER, marks: [{ type: "link", attrs: { href: "" } }] })
      .setTextSelection({ from, to: from + LINK_PLACEHOLDER.length })
      .run();
  };

  // 툴바 전체를 하나의 배열로만 관리한다 — HeadingMenu/EmojiPicker처럼 {icon,label,onClick}
  // 모양이 아닌 컴포넌트가 끼어드는 자리는 { type: "custom", render } 항목으로 표시한다. 순서를
  // 바꾸고 싶으면 이 배열 안에서만 옮기면 되고, 배열을 쪼갤 필요가 없다.
  const groups: ToolbarItemSpec[][] = [
    [
      { type: "button", key: "undo", icon: Undo2, label: "실행 취소", onClick: () => editor.chain().focus().undo().run(), disabled: !toolbarState.canUndo },
      { type: "button", key: "redo", icon: Redo2, label: "다시 실행", onClick: () => editor.chain().focus().redo().run(), disabled: !toolbarState.canRedo },
      { type: "button", key: "findAndReplace", icon: Search, label: "찾기/바꾸기 (Ctrl+F)", onClick: onToggleFind, isActive: findOpen },
      { type: "button", key: "clearFormat", icon: Eraser, label: "서식 지우기", onClick: () => editor.chain().focus().unsetAllMarks().clearNodes().run() },
      { type: "button", key: "invisibleCharacters", icon: Pilcrow, label: "보이지 않는 문자", onClick: () => editor.chain().focus().toggleInvisibleCharacters().run(), isActive: toolbarState.invisibleCharactersVisible },
    ],
    [
      { type: "custom", key: "heading", render: () => <HeadingMenu level={toolbarState.headingLevel} onSelect={handleSelectHeading} /> },
      { type: "button", key: "bold", icon: Bold, label: "굵게", onClick: () => editor.chain().focus().toggleBold().run(), isActive: toolbarState.bold },
      { type: "button", key: "italic", icon: Italic, label: "기울임", onClick: () => editor.chain().focus().toggleItalic().run(), isActive: toolbarState.italic },
      { type: "button", key: "underline", icon: UnderlineIcon, label: "밑줄", onClick: () => editor.chain().focus().toggleUnderline().run(), isActive: toolbarState.underline },
      { type: "button", key: "strike", icon: Strikethrough, label: "취소선", onClick: () => editor.chain().focus().toggleStrike().run(), isActive: toolbarState.strike },
      { type: "button", key: "highlight", icon: Highlighter, label: "하이라이트", onClick: () => editor.chain().focus().toggleHighlight().run(), isActive: toolbarState.highlight },
    ],
    [
      { type: "custom", key: "color", render: () => <ColorPaletteMenu kind="text" currentColor={toolbarState.textColor} recentColors={recentColors} onOpenChange={(open) => setOpenPalettes((current) => ({ ...current, text: open }))} onSelect={(color) => { editor.chain().focus().setColor(color).run(); rememberColor(color); }} onClear={() => editor.chain().focus().unsetColor().run()} /> },
      { type: "custom", key: "backgroundColor", render: () => <ColorPaletteMenu kind="background" currentColor={toolbarState.backgroundColor} recentColors={recentColors} onOpenChange={(open) => setOpenPalettes((current) => ({ ...current, background: open }))} onSelect={(color) => { editor.chain().focus().setBackgroundColor(color).run(); rememberColor(color); }} onClear={() => editor.chain().focus().unsetBackgroundColor().run()} /> },
      {
        type: "custom", key: "emoji", render: () => (
          showEmojiPicker ? (
            <Suspense fallback={<ToolbarButton icon={SmilePlus} label="이모지 불러오는 중" onClick={() => {}} disabled />}>
              <LazyEmojiPicker
                transparentWhenIdle
                showGuildEmojis={false}
                onSelect={(text) => editor.chain().focus().insertContent({ type: "text", text }).run()}
                onClose={() => setShowEmojiPicker(false)}
              />
            </Suspense>
          ) : (
            <ToolbarButton icon={SmilePlus} label="이모지" onClick={() => setShowEmojiPicker(true)} />
          )
        ),
      },
      { type: "button", key: "link", icon: Link, label: "링크", onClick: toggleLink, isActive: toolbarState.link },
    ],
    [
      { type: "button", key: "inlineMath", icon: Radical, label: "인라인 수식", onClick: () => insertMathInput(editor, "inlineMath"), disabled: toolbarState.mathEditing },
      { type: "button", key: "code", icon: ChevronsLeftRightEllipsis, label: "인라인 코드", onClick: () => editor.chain().focus().toggleCode().run(), isActive: toolbarState.code },
      { type: "button", key: "subscript", icon: SubscriptIcon, label: "아래첨자", onClick: () => editor.chain().focus().toggleSubscript().run(), isActive: toolbarState.subscript },
      { type: "button", key: "superscript", icon: SuperscriptIcon, label: "위첨자", onClick: () => editor.chain().focus().toggleSuperscript().run(), isActive: toolbarState.superscript },
    ],
    [
      { type: "button", key: "alignLeft", icon: AlignLeft, label: "왼쪽 정렬", onClick: () => editor.chain().focus().setTextAlign("left").run(), isActive: toolbarState.alignLeft },
      { type: "button", key: "alignCenter", icon: AlignCenter, label: "가운데 정렬", onClick: () => editor.chain().focus().setTextAlign("center").run(), isActive: toolbarState.alignCenter },
      { type: "button", key: "alignRight", icon: AlignRight, label: "오른쪽 정렬", onClick: () => editor.chain().focus().setTextAlign("right").run(), isActive: toolbarState.alignRight },
      { type: "button", key: "alignJustify", icon: AlignJustify, label: "양쪽 정렬", onClick: () => editor.chain().focus().setTextAlign("justify").run(), isActive: toolbarState.alignJustify },
    ],
    [
      { type: "button", key: "toc", icon: ListTree, label: "목차", onClick: () => editor.chain().focus().toggleTableOfContents().run(), isActive: toolbarState.tableOfContents },
      { type: "button", key: "bulletList", icon: List, label: "글머리 목록", onClick: () => applyListType("bulletList") },
      { type: "button", key: "orderedList", icon: ListOrdered, label: "순서 목록", onClick: () => applyListType("orderedList") },
      { type: "button", key: "taskList", icon: ListChecks, label: "체크박스 목록", onClick: () => applyListType("taskList") },
    ],
    [
      { type: "button", key: "details", icon: ListCollapse, label: "아코디언 블록", onClick: handleInsertDetails, disabled: toolbarState.detailsSummary },
      { type: "button", key: "blockquote", icon: Quote, label: "인용", onClick: () => (toolbarState.blockquote ? editor.chain().focus().setBlockquote() : editor.chain().focus().toggleBlockquote()).run() },
      { type: "button", key: "math", icon: Sigma, label: "수식 블록", onClick: () => insertMathInput(editor, "blockMath"), disabled: toolbarState.mathEditing },
      { type: "button", key: "codeBlock", icon: Code, label: "코드블록", onClick: () => editor.chain().focus().setCodeBlock().run(), disabled: toolbarState.codeBlock },
      { type: "button", key: "table", icon: TableIcon, label: "표 삽입", onClick: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
      { type: "button", key: "horizontalRule", icon: Minus, label: "가로줄", onClick: () => editor.chain().focus().setHorizontalRule().run() },
    ],
    [
      { type: "button", key: "image", icon: ImageIcon, label: "이미지", onClick: () => openMediaInput("image") },
      { type: "button", key: "audio", icon: Music, label: "오디오", onClick: () => openMediaInput("audio") },
      { type: "button", key: "youtube", icon: YoutubeIcon, label: "동영상", onClick: () => openMediaInput("video") },
      { type: "button", key: "file", icon: Paperclip, label: "파일 첨부", onClick: () => openMediaInput("file") },
    ],
  ];

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          <AppTooltip content={<UsageTable compact />} placement="bottom" openDelay={0} open={usageOpen ? false : undefined}>
            <button type="button" className={styles.toolbarButton} aria-label="사용법" onClick={() => setUsageOpen(true)}>
              <Info size={16} />
            </button>
          </AppTooltip>
        </div>
        {groups.map((group, index) => (
          <div className={styles.toolbarGroup} key={index}>
            {group.map((item) => item.type === "custom"
              ? <Fragment key={item.key}>{item.render()}</Fragment>
              : <ToolbarButton key={item.key} icon={item.icon} label={item.label} onClick={item.onClick} isActive={item.isActive} disabled={item.disabled} />)}
          </div>
        ))}
        <div className={styles.toolbarGroupSend}>
          <AppTooltip content={toolbarState.mediaBusy ? "파일을 올리는 중에는 보낼 수 없습니다" : "보내기"} placement="top">
            <button
              type="button"
              className={styles.toolbarButton}
              disabled={disabled || toolbarState.mediaBusy}
              onClick={onSubmit}
            >
              <SendHorizonal size={16} color="var(--main-color, #00a0e9)" />
            </button>
          </AppTooltip>
        </div>
      </div>
      <Dialog.Root open={usageOpen} onOpenChange={(details) => setUsageOpen(details.open)}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner className={styles.usageDialogPositioner}>
            <Dialog.Content className={styles.usageDialogContent}>
              <Dialog.Header className={styles.usageDialogHeader}>
                <Dialog.Title>에디터 사용법</Dialog.Title>
                <Dialog.CloseTrigger className={styles.usageDialogClose} aria-label="닫기">×</Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body className={styles.usageDialogBody}>
                <div className={styles.usageGlossary}>
                  <strong>기본 사용법</strong>
                  <p><Info size={14} className={styles.inlineIcon}/> 아이콘에 호버하면 나오는 표의 <strong>형식</strong>대로 입력한 뒤 <strong>Tab</strong>을 누르면 포맷이 적용됩니다. 커서는 기호 사이 또는 닫는 기호 바로 뒤에 두세요. 제목은 # 뒤에 공백과 내용을 입력합니다.</p>
                  <p><strong>툴바 버튼</strong>은 선택한 글자의 서식을 적용·해제하고, 커서만 있을 때는 이후 입력할 서식을 켜고 끕니다. Esc로 입력 서식을 끌 수도 있습니다.</p>
                  <p>확정할 형식이 없을 때 Tab은 들여쓰기, Shift+Tab은 내어쓰기입니다. 기호를 그대로 입력하려면 앞에 백슬래시(\)를 붙이거나 플레인 텍스트 문법을 사용하세요.</p>
                  <p></p>
                  <strong>서식 없는 입력</strong>
                  <p>플레인 텍스트는 닫는 큰따옴표 세 개 바로 뒤에서만 Tab으로 확정합니다. 기호 안에서는 서식이 자동완성되지 않습니다. 확정하면 기호와 백슬래시를 그대로 보존한 일반 문단이 되고, 여러 줄은 여러 문단으로 나뉩니다.</p>
                  <p></p>
                  <strong>링크 사용법</strong>
                  <p>링크 주소를 <strong>#카드id</strong>로 쓰면 같은 그룹의 카드 창을 엽니다. 링크 텍스트 앞 아이콘을 눌러 주소를 바꿀 수 있고, 입력 칸에 #을 입력하면 카드명으로 찾을 수 있습니다. 도메인이 생략된 형태인 <strong>상대 주소</strong>는 쿠러그 사이트 내에서 상대주소를 적용합니다.</p>
                  <p></p>
                  <strong>목차 사용법</strong>
                  <p><ListTree size={14} className={styles.inlineIcon} /> <strong>목차</strong>는 제목 스타일이 적용된 텍스트들을 트리 모양으로 시각화합니다. 기록에서 목차의 제목을 누르면 그 위치로 이동합니다. 기록에 하나만 넣을 수 있으며, 접는 블록·인용·목록 안의 제목도 포함되고, 글자가 없는 제목은 빠집니다.</p>
                  <p></p>
                  <strong>슬래시 명령어 사용법</strong>
                  <p>줄 맨 앞에서 <strong>/</strong>를 입력하면 블록 목록이 나옵니다. 원하는 항목을 ↑/↓로 골라 <strong>Tab</strong>이나 <strong>Enter</strong>를 누르면 그 자리에 블록이 들어갑니다. Esc로 목록을 닫습니다.</p>
                </div>
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}

export default memo(Toolbar);
