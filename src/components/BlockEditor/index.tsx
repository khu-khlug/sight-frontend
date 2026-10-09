import { ScrollArea } from "@chakra-ui/react";
import { Selection } from "@tiptap/extensions";
import { EditorContent, useEditor } from "@tiptap/react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, MutableRefObject } from "react";

import { cn } from "../../util/cn";
import { createBlockExtensions } from "../BlockContent/extensions";
import contentStyles from "../BlockContent/style.module.css";
import HoverScrollbar from "../HoverScrollbar";
import { ConvertList } from "./convertList";
import { ConvertListDrop } from "./convertListDrop";
import { BlockSelection } from "./blockSelection";
import { TableInteraction } from "./tableInteraction";
import type { LinkCard, LinkServices } from "../BlockContent/linkIcons";
import LinkEditOverlay from "./LinkEditOverlay";
import { MarkdownLinkConfirm } from "./markdownLinkConfirm";
import { SlashCommand } from "./slashCommand";
import SlashMenu from "./SlashMenu";
import FindReplaceBar from "./FindReplaceBar";
import { MediaInput, MediaInputDrop } from "./mediaInput/MediaInput";
import { isMediaInputBusy, serializeContent } from "./mediaInput/mediaInputState";
import type { FileMetadata, MediaServices } from "./mediaInput/mediaInputState";
import StatusBar from "./StatusBar";
import Toolbar from "./Toolbar";
import styles from "./style.module.css";
import { withDragHandle } from "./withDragHandle";

// linkCards가 없을 때 매 렌더 새 배열을 만들지 않도록 하나를 공유한다.
const EMPTY_LINK_CARDS: LinkCard[] = [];

// 바깥(저장 로직 등)이 필요할 때만 본문을 직렬화해서 가져가기 위한 손잡이다.
// refreshTableOfContents: 입력이 잠잠해진 시점(임시저장 디바운스)에 불러, 그동안 제목이 바뀌었으면 목차를 다시 그린다.
export type BlockEditorHandle = { getHTML: () => string; refreshTableOfContents: () => void };

type Props = {
  // 에디터가 만들어질 때의 본문이다. 이후 값이 바뀌면(예: 임시저장 복구) 그 내용으로 교체하지만,
  // 입력할 때마다 바뀌는 값이 아니다 — 입력은 onInput으로만 알린다.
  initialValue: string;
  // 본문이 바뀔 때마다 호출된다. 본문 내용은 넘기지 않는다.
  onInput: () => void;
  // 보내기 버튼을 누른 결과만 받는다 — 아직 내용이 정해지지 않은 입력 박스를 뺀 본문 HTML이 온다.
  // 파일을 올리거나 확인하는 중에는 호출되지 않는다.
  onSubmit: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  // 코드 블록이 처음에 자동 줄바꿈으로 보일지 — 에디터가 만들어질 때 한 번만 반영된다.
  defaultCodeWrap?: boolean;
  handleRef?: MutableRefObject<BlockEditorHandle | null>;
  // 이미지·오디오·파일을 올리고 본문에 넣을 주소를 돌려준다. 없으면 입력 박스는 주소 입력만 받는다.
  uploadFile?: (file: File, signal: AbortSignal) => Promise<string>;
  // 앱 안 파일(저장소 등)을 끌어다 넣을 때 용량·형식을 확인한다. 없으면 용량 없이 넣는다.
  resolveFileMetadata?: (url: string) => Promise<FileMetadata>;
  // 링크 주소 입력 상자에서 "#"로 찾을 카드 목록이다. 없으면 카드 자동완성이 나오지 않는다.
  linkCards?: LinkCard[];
};

/*
 * 팁탭의 EditorContent가 그리는 .tiptap(ProseMirror) div는 팁탭이 완전히 소유하는 DOM이라
 * (EditorContent엔 children prop도 없다) 그 안에 스크롤 컴포넌트를 끼워 넣을 수 없다. 그래서
 * EditorContent를 ScrollArea.Viewport로 감싸 본문 영역만 세로로 스크롤하고, 툴바와 상태바는
 * 스크롤 밖에 고정한다. 이 스크롤은 부모가 높이를 줄 때(예: EditWindow)만 작동하고, 그렇지
 * 않으면 contenteditable div가 내용만큼 늘어난다(style.module.css의 .root 주석 참고).
 *
 * docs/decision/dependency-tiptap-extensions.md의 "쓸것" 목록을 거의 그대로 설치했다.
 * 목차는 공식 Table of contents 대신 문서에 하나만 두는 커스텀 블록(BlockContent/TableOfContents)이다.
 * 이미지·오디오·동영상·파일 삽입은 공식 File Handler 대신 mediaInput/의 입력 박스가 맡는다
 * (URL 입력, 파일 선택, 붙여넣기, 드롭을 한 곳에서 받는다).
 *
 * markdownWrapMark.ts로 감싼 마크는 툴바에서 서식 토글로 동작하고, 기호를 직접 입력하면
 * Tab으로 확정한다. 코드·수식 노드는 markdownNodeConfirm.ts가 같은 키로 확정한다.
 * 헤딩은 "#" 개수 + Enter 확정 구조라 markdownHeadingPrefix.ts를 쓴다.
 *
 * 글자를 칠 때 React가 다시 그리는 범위를 줄이려고 이 컴포넌트는 본문 상태를 들고 있지 않다.
 * 툴바·상태바는 각자 useEditorState로 필요한 값만 구독하는 별도 컴포넌트다.
 */
function BlockEditor({ initialValue, onInput, onSubmit, placeholder, disabled = false, defaultCodeWrap, handleRef, uploadFile, resolveFileMetadata, linkCards }: Props) {
  // onUpdate는 에디터가 만들어질 때 한 번 등록되므로, 최신 콜백은 ref로 읽는다.
  const onInputRef = useRef(onInput);
  onInputRef.current = onInput;
  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;
  // 확장은 에디터가 만들어질 때 한 번 등록되므로, 입력 박스는 이 ref로 최신 기능을 읽는다.
  const mediaServices = useRef<MediaServices>({});
  mediaServices.current = { uploadFile, resolveFileMetadata };
  const linkServices = useRef<LinkServices>({});
  linkServices.current = { cards: linkCards };
  const [paletteOpen, setPaletteOpen] = useState(false);
  // 툴바 아래 찾기/바꾸기 줄 — 툴바 버튼과 Ctrl+F가 같은 상태를 쓴다. focusRequest는 Ctrl+F마다 올라 칸에 다시 포커스를 준다.
  const [findOpen, setFindOpen] = useState(false);
  const [findFocusRequest, setFindFocusRequest] = useState(0);
  const toggleFind = useCallback(() => setFindOpen((open) => !open), []);
  const closeFind = useCallback(() => setFindOpen(false), []);

  const editor = useEditor({
    // placeholder는 최초 마운트 시점 값으로 고정된다(useEditor는 deps 없이 한 번만 만들어지므로,
    // 이후 prop이 바뀌어도 재반영되지 않는다 — 실제로도 쓰는 쪽에서 placeholder를 동적으로
    // 바꿀 일은 없다).
    // Selection은 포커스를 잃은 뒤에도 선택 영역을 .selection 클래스로 보여준다(뷰어에는 필요 없다).
    // 입력 박스(MediaInput)는 편집 중에만 쓰는 노드라 뷰어와 공유하는 createBlockExtensions에 넣지 않는다.
    extensions: [
      ...createBlockExtensions(placeholder, defaultCodeWrap, withDragHandle, false, linkServices),
      Selection, ConvertList, ConvertListDrop, BlockSelection, TableInteraction, MarkdownLinkConfirm, SlashCommand,
      withDragHandle(MediaInput.configure({ services: mediaServices })), MediaInputDrop,
    ],
    editorProps: { attributes: { class: contentStyles.document } },
    content: initialValue,
    // 렌더 중에 만들면 useEditor가 1ms 안에 마운트되지 않은 에디터를 destroy하는데, lazy로 불러올 때는
    // 렌더와 effect 사이가 그보다 길어져 destroy된 에디터를 쓰게 된다. effect에서 만들어 이를 피한다.
    immediatelyRender: false,
    editable: !disabled,
    // setEditable 같은 호출도 update 이벤트를 내보내므로, 문서가 실제로 바뀐 트랜잭션만 입력으로 센다.
    onUpdate: ({ transaction }) => {
      if (transaction.docChanged) onInputRef.current();
    },
  });

  // initialValue는 처음 마운트될 때만 content로 들어간다 — 이후 바뀌면(예: 임시저장 복구) 직접
  // 반영한다. 입력할 때는 이 값이 바뀌지 않으므로 이 effect는 입력마다 실행되지 않는다.
  useEffect(() => {
    if (!editor) return;
    if (serializeContent(editor) === initialValue) return;
    editor.commands.setContent(initialValue, { emitUpdate: false });
  }, [editor, initialValue]);

  useEffect(() => {
    editor?.setEditable(!disabled, false);
  }, [editor, disabled]);

  useEffect(() => {
    if (!handleRef || !editor) return;
    handleRef.current = {
      getHTML: () => serializeContent(editor),
      refreshTableOfContents: () => { if (!editor.isDestroyed) editor.commands.refreshTableOfContents(); },
    };
    return () => { handleRef.current = null; };
  }, [editor, handleRef]);

  // 파일을 올리거나 확인하는 중에 보내면 그 박스가 본문에서 빠지므로 보내지 않는다(툴바 버튼도 막혀 있다).
  const handleSubmit = useCallback(() => {
    if (!editor || isMediaInputBusy(editor.state)) return;
    onSubmitRef.current(serializeContent(editor));
  }, [editor]);

  // 편집기·찾기 줄 어디에 포커스가 있든 Ctrl+F(Mac은 Cmd+F)는 브라우저 찾기 대신 찾기 줄을 연다.
  // 한글 입력 상태에서는 key가 "ㄹ"로 오므로 물리 키(code)로 판별한다.
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.code !== "KeyF" || !(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) return;
    event.preventDefault();
    setFindOpen(true);
    setFindFocusRequest((count) => count + 1);
  };

  if (!editor) return null;

  return (
    <div className={cn(styles.root, paletteOpen && styles.paletteOpen)} onKeyDown={handleKeyDown}>
      <Toolbar editor={editor} disabled={disabled} onSubmit={handleSubmit} onPaletteOpenChange={setPaletteOpen} findOpen={findOpen} onToggleFind={toggleFind} />
      {/* 닫혀도 내려가지 않고 숨기만 해서 입력 내용과 바꾸기 줄 열림 여부를 편집기가 닫힐 때까지 기억한다. */}
      <FindReplaceBar editor={editor} open={findOpen} focusRequest={findFocusRequest} onClose={closeFind} />
      <ScrollArea.Root className={styles.contentScrollRoot} size="sm" variant="hover">
        <ScrollArea.Viewport
          h="100%"
          w="100%"
          className={!disabled ? styles.editorViewport : undefined}
          data-block-selection-viewport=""
          style={{ overflowX: "hidden" }}
        >
          <ScrollArea.Content style={{ minWidth: 0 }}>
            <EditorContent editor={editor} className={styles.content} />
          </ScrollArea.Content>
        </ScrollArea.Viewport>
        <HoverScrollbar orientation="vertical" />
      </ScrollArea.Root>
      <StatusBar editor={editor} />
      <LinkEditOverlay editor={editor} cards={linkCards ?? EMPTY_LINK_CARDS} />
      <SlashMenu editor={editor} />
    </div>
  );
}

// 부모가 다시 그려져도 props가 그대로면 건너뛴다 — 쓰는 쪽은 onInput/onSubmit/uploadFile을 안정된 함수로 넘긴다.
export default memo(BlockEditor);
