import { useEditorState } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import { CaseSensitive, ChevronDown, ChevronUp, Regex, Replace, WholeWord } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

import { cn } from "../../util/cn";
import AppTooltip from "../AppTooltip";
import { openCollapsedAncestors } from "../BlockContent/revealPosition";
import toolbarStyles from "./style.module.css";
import styles from "./findReplaceBar.module.css";

type Props = {
  editor: Editor;
  // 툴바 찾기 버튼(토글)·Ctrl+F로 바뀐다. 닫혀도 이 컴포넌트는 남아 입력 내용·바꾸기 줄 열림 여부를 기억한다.
  open: boolean;
  // Ctrl+F를 누를 때마다 오른다 — 이미 열려 있어도 찾을 내용 칸으로 포커스를 다시 옮긴다.
  focusRequest: number;
  // Esc로 닫는다.
  onClose: () => void;
};

// 한 줄 안에서 선택한 글자만 찾을 내용으로 쓴다(여러 줄 선택은 쓰지 않는다).
function selectedText(editor: Editor): string {
  const { from, to, empty } = editor.state.selection;
  if (empty) return "";
  const text = editor.state.doc.textBetween(from, to, "\n");
  return text.includes("\n") ? "" : text;
}

// 위치가 편집기 스크롤 영역(BlockEditor의 ScrollArea.Viewport) 밖에 있으면 그 위치가 가운데 오도록 스크롤한다. 이미 보이면 그대로 둔다.
function scrollPositionIntoView(editor: Editor, pos: number) {
  const viewport = editor.view.dom.closest<HTMLElement>("[data-block-selection-viewport]");
  if (!viewport) return;
  const coords = editor.view.coordsAtPos(pos);
  const rect = viewport.getBoundingClientRect();
  if (coords.top >= rect.top && coords.bottom <= rect.bottom) return;
  viewport.scrollTop += coords.top - (rect.top + rect.height / 2);
}

function IconToggle({ icon: Icon, label, active, disabled, onClick }: { icon: LucideIcon; label: string; active?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <AppTooltip content={label} placement="top">
      <button
        type="button"
        className={cn(toolbarStyles.toolbarButton, active && toolbarStyles.toolbarButtonActive)}
        aria-label={label}
        aria-pressed={active}
        disabled={disabled}
        onClick={onClick}
      >
        <Icon size={16} />
      </button>
    </AppTooltip>
  );
}

/*
 * 툴바 아래에 열리는 찾기/바꾸기. 윗줄은 찾기, 아랫줄은 바꾸기다. 검색·하이라이트·바꾸기는 FindAndReplace 확장의
 * 명령을 그대로 쓰고, 이 줄은 입력과 결과 수 표시만 맡는다. 결과로 이동할 때 접힌 블록 안이면 펼친 뒤 그 결과로 스크롤한다.
 * 닫으면 검색만 지워(하이라이트 제거) 찾기를 멈추고, 다시 열면 기억해 둔 찾을 내용으로 다시 검색한다.
 * 옵션(대소문자 구분 등)과 바꿀 내용은 확장 상태에 남는다. 이 기억은 편집기가 닫힐 때 함께 사라진다.
 */
export default function FindReplaceBar({ editor, open, focusRequest, onClose }: Props) {
  const findRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const [replaceOpen, setReplaceOpen] = useState(false);
  // 바꾸기 줄을 열면 바꿀 내용 칸으로 포커스를 옮긴다.
  useEffect(() => {
    if (replaceOpen) replaceRef.current?.focus();
  }, [replaceOpen]);
  const [term, setTerm] = useState(() => editor.storage.findAndReplace.searchTerm);
  const [replacement, setReplacement] = useState(() => editor.storage.findAndReplace.replaceTerm);
  const termRef = useRef(term);
  termRef.current = term;
  const openRef = useRef(open);
  openRef.current = open;
  const search = useEditorState({
    editor,
    selector: ({ editor: current }) => {
      const storage = current.storage.findAndReplace;
      return {
        count: storage.results.length,
        index: storage.currentIndex,
        caseSensitive: storage.caseSensitive,
        wholeWord: storage.wholeWord,
        useRegex: storage.useRegex,
      };
    },
  });

  // 열릴 때 기억해 둔 찾을 내용으로 다시 검색하고, 닫히거나 편집기가 닫힐 때 검색을 지운다.
  useEffect(() => {
    if (!open) return;
    editor.commands.setSearchTerm(termRef.current);
    findRef.current?.focus();
    findRef.current?.select();
    return () => {
      if (!editor.isDestroyed) editor.commands.clearSearch();
    };
  }, [editor, open]);

  // Ctrl+F를 누를 때 — 본문에서 선택한 글자가 있으면 그걸로 바꿔 찾고, 찾을 내용 칸을 선택한다.
  useEffect(() => {
    if (focusRequest === 0 || !openRef.current) return;
    const text = selectedText(editor);
    if (text) {
      setTerm(text);
      editor.commands.setSearchTerm(text);
    }
    findRef.current?.focus();
    findRef.current?.select();
  }, [editor, focusRequest]);

  // 지금 결과가 접힌 블록 안이면 펼치고, 펼쳐진 뒤의 자리로 스크롤한다.
  // 스크롤은 직접 한다 — 확장이 요청하는 ProseMirror 스크롤은 브라우저 선택이 편집기 안에 있을 때만 움직여서,
  // 찾기 칸에 포커스가 있는 동안에는 움직이지 않을 때가 있다.
  // 접는 블록의 토글 버튼은 펼친 뒤 다음 프레임에 편집기로 포커스를 옮기므로, 그 뒤 프레임에서 찾기 칸으로 포커스를 돌려놓는다
  // — 그대로 두면 이어서 누른 Enter가 본문 줄바꿈이 된다.
  const reveal = () => {
    const { results, currentIndex } = editor.storage.findAndReplace;
    const result = currentIndex === null ? undefined : results[currentIndex];
    if (!result) return;
    const focused = document.activeElement;
    openCollapsedAncestors(editor, result.from);
    requestAnimationFrame(() => {
      if (editor.isDestroyed) return;
      scrollPositionIntoView(editor, result.from);
      if (focused instanceof HTMLElement && focused.isConnected && document.activeElement !== focused) focused.focus({ preventScroll: true });
    });
  };

  const go = (direction: 1 | -1) => {
    if (direction > 0) editor.commands.goToNextResult();
    else editor.commands.goToPreviousResult();
    reveal();
  };
  const replaceCurrent = () => {
    editor.commands.replace();
    reveal();
  };
  const close = () => {
    onClose();
    editor.commands.focus();
  };

  const handleFindKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Enter") {
      event.preventDefault();
      go(event.shiftKey ? -1 : 1);
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  };
  const handleReplaceKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Enter") {
      event.preventDefault();
      replaceCurrent();
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  };

  const hasResults = search.count > 0;
  const counter = !term ? "" : !hasResults ? "결과 없음" : search.index === null ? `${search.count}개` : `${search.index + 1}/${search.count}`;

  if (!open) return null;

  // 윗줄은 찾기, 아랫줄은 바꾸기다. 아랫줄은 윗줄 맨 오른쪽의 바꾸기 버튼으로 열고 닫는다.
  // 두 줄이 같은 2열 격자(입력 칸 | 버튼들)를 써서 위아래 입력 칸 너비가 같다.
  return (
    <div className={styles.bar} role="search">
      <input
        ref={findRef}
        className={styles.input}
        value={term}
        placeholder="찾을 내용"
        aria-label="찾을 내용"
        onChange={(event) => {
          setTerm(event.target.value);
          editor.commands.setSearchTerm(event.target.value);
        }}
        onKeyDown={handleFindKeyDown}
      />
      <div className={styles.controls}>
        <div className={styles.group}>
          <IconToggle icon={ChevronUp} label="이전 (Shift+Enter)" disabled={!hasResults} onClick={() => go(-1)} />
          <IconToggle icon={ChevronDown} label="다음 (Enter)" disabled={!hasResults} onClick={() => go(1)} />
        </div>
        <span className={styles.counter} role="status">{counter}</span>
        <div className={styles.group}>
          <IconToggle icon={CaseSensitive} label="대소문자 구분" active={search.caseSensitive} onClick={() => editor.commands.setCaseSensitive(!search.caseSensitive)} />
          <IconToggle icon={WholeWord} label="단어 단위로 찾기" active={search.wholeWord} disabled={search.useRegex} onClick={() => editor.commands.setWholeWord(!search.wholeWord)} />
          <IconToggle icon={Regex} label="정규식" active={search.useRegex} onClick={() => editor.commands.setUseRegex(!search.useRegex)} />
          <IconToggle icon={Replace} label="바꾸기" active={replaceOpen} onClick={() => setReplaceOpen((current) => !current)} />
        </div>
      </div>
      {replaceOpen && (
        <>
          <input
            ref={replaceRef}
            className={styles.input}
            value={replacement}
            placeholder="바꿀 내용"
            aria-label="바꿀 내용"
            onChange={(event) => {
              setReplacement(event.target.value);
              editor.commands.setReplaceTerm(event.target.value);
            }}
            onKeyDown={handleReplaceKeyDown}
          />
          <div className={cn(styles.controls, styles.controlsEnd)}>
            <button type="button" className={styles.textButton} disabled={!hasResults} onClick={replaceCurrent}>바꾸기</button>
            <button type="button" className={styles.textButton} disabled={!hasResults} onClick={() => editor.commands.replaceAll()}>모두 바꾸기</button>
          </div>
        </>
      )}
    </div>
  );
}
