import { Bold, Code, Eye, Heading, Italic, List, ListOrdered, Minus, Quote, SendHorizonal, Table, WrapText } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";

import { cn } from "../../util/cn";
import AppTooltip from "../AppTooltip";
import MarkdownViewer from "../MarkdownViewer";
import styles from "./style.module.css";

type Props = {
  value: string;
  onChange: (value: string) => void;
  // 보내기 버튼을 누른 결과만 받는다 — 앞뒤 빈 줄을 뗀 값이 여기로 온다(아래 trimBlankLines).
  onSubmit: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

// 문단 앞뒤의 빈 줄만 뗀다 — trim()과 달리 줄 중간 들여쓰기나 마지막 줄의 의미 있는 공백은
// 그대로 둔다.
function trimBlankLines(value: string): string {
  return value
    .replace(/^(?:[ \t]*\r?\n)+/, "")
    .replace(/(?:\r?\n[ \t]*)+$/, "");
}

// 선택 영역을 marker로 감싼다(굵게/기울임). 선택이 없으면 커서 위치에 빈 쌍을 넣고 그 사이로
// 커서를 둔다.
function wrapSelection(textarea: HTMLTextAreaElement, value: string, onChange: (value: string) => void, marker: string) {
  const { selectionStart, selectionEnd } = textarea;
  const selected = value.slice(selectionStart, selectionEnd);
  const next = value.slice(0, selectionStart) + marker + selected + marker + value.slice(selectionEnd);
  onChange(next);
  const cursorStart = selectionStart + marker.length;
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(cursorStart, cursorStart + selected.length);
  });
}

// 선택 영역이 걸친 줄 전체(각 줄) 맨 앞에 prefix를 붙인다(목록/순서목록/인용/제목). 선택이
// 없으면 커서가 있는 한 줄에만 적용된다. prefixFor는 줄 순서(0부터)를 받아 그 줄에 붙일
// 문자열을 돌려준다 — 순서목록처럼 줄마다 다른 접두사(1. 2. 3. ...)가 필요한 경우를 같이
// 다루기 위함이다.
function prefixLines(textarea: HTMLTextAreaElement, value: string, onChange: (value: string) => void, prefixFor: (lineIndex: number) => string) {
  const { selectionStart, selectionEnd } = textarea;
  const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
  const nextNewline = value.indexOf("\n", selectionEnd);
  const lineEnd = nextNewline === -1 ? value.length : nextNewline;
  const segment = value.slice(lineStart, lineEnd);
  const prefixed = segment.split("\n").map((line, index) => prefixFor(index) + line).join("\n");
  const next = value.slice(0, lineStart) + prefixed + value.slice(lineEnd);
  onChange(next);
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(lineStart, lineStart + prefixed.length);
  });
}

// 제목 — 누를 때마다 현재 줄의 "#" 레벨을 하나씩 올린다("" -> "# " -> "## " -> ...). 이미
// 최상위(######)면 더 올리지 않는다. 커서는 추가된 "#" 개수만큼만 밀려나고 선택 범위 길이는
// 그대로 유지된다.
function increaseHeadingLevel(textarea: HTMLTextAreaElement, value: string, onChange: (value: string) => void) {
  const { selectionStart, selectionEnd } = textarea;
  const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
  const nextNewline = value.indexOf("\n", selectionEnd);
  const lineEnd = nextNewline === -1 ? value.length : nextNewline;
  const line = value.slice(lineStart, lineEnd);
  const match = line.match(/^(#{1,6}) /);
  if (match && match[1].length >= 6) return;
  const addedLength = match ? 1 : 2;
  const newLine = match ? `#${line}` : `# ${line}`;
  const next = value.slice(0, lineStart) + newLine + value.slice(lineEnd);
  onChange(next);
  const selectionLength = selectionEnd - selectionStart;
  const cursorStart = selectionStart + addedLength;
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(cursorStart, cursorStart + selectionLength);
  });
}

// 선택을 무시하고 커서 위치에 그대로 삽입한다(가로줄/표처럼 줄 단위로 감쌀 대상이 없는 경우).
function insertAtCursor(textarea: HTMLTextAreaElement, value: string, onChange: (value: string) => void, text: string) {
  const { selectionStart, selectionEnd } = textarea;
  const next = value.slice(0, selectionStart) + text + value.slice(selectionEnd);
  onChange(next);
  const cursor = selectionStart + text.length;
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(cursor, cursor);
  });
}

// 코드 — 선택 영역에 줄바꿈이 있으면 코드 블록(펜스)으로, 없으면 인라인 백틱으로 감싼다.
function insertCode(textarea: HTMLTextAreaElement, value: string, onChange: (value: string) => void) {
  const { selectionStart, selectionEnd } = textarea;
  const selected = value.slice(selectionStart, selectionEnd);
  if (selected.includes("\n")) {
    const next = `${value.slice(0, selectionStart)}\`\`\`\n${selected}\n\`\`\`${value.slice(selectionEnd)}`;
    onChange(next);
    const cursorStart = selectionStart + 4;
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorStart, cursorStart + selected.length);
    });
    return;
  }
  wrapSelection(textarea, value, onChange, "`");
}

/*
 * 스크롤 영역을 따로 안 두고 textarea 자체를 내용 길이에 맞춰 늘린다(세로 스크롤바 없음) —
 * ScrollBox 같은 공용 스크롤 컴포넌트를 쓸 만큼 길어질 상황을 상정하지 않는, 말 그대로
 * "심플한" 에디터다. 줄바꿈을 끄면 긴 줄은 textarea 자체의 가로 스크롤로만 빠진다(세로
 * 높이에는 영향 없음). 미리보기는 MarkdownViewer를 그대로 재사용하고, 미리보기 중엔 textarea
 * 자체를 안 그려서 편집할 수 없다.
 */
export default function SimpleMarkdownEditor({ value, onChange, onSubmit, placeholder, disabled = false }: Props) {
  const [isPreview, setIsPreview] = useState(false);
  const [wrap, setWrap] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value, isPreview, wrap]);

  const insertBold = () => {
    const textarea = textareaRef.current;
    if (textarea) wrapSelection(textarea, value, onChange, "**");
  };
  const insertItalic = () => {
    const textarea = textareaRef.current;
    if (textarea) wrapSelection(textarea, value, onChange, "*");
  };
  const insertList = () => {
    const textarea = textareaRef.current;
    if (textarea) prefixLines(textarea, value, onChange, () => "- ");
  };
  const insertOrderedList = () => {
    const textarea = textareaRef.current;
    if (textarea) prefixLines(textarea, value, onChange, (index) => `${index + 1}. `);
  };
  const insertQuote = () => {
    const textarea = textareaRef.current;
    if (textarea) prefixLines(textarea, value, onChange, () => "> ");
  };
  const insertHeading = () => {
    const textarea = textareaRef.current;
    if (textarea) increaseHeadingLevel(textarea, value, onChange);
  };
  const handleInsertCode = () => {
    const textarea = textareaRef.current;
    if (textarea) insertCode(textarea, value, onChange);
  };
  const insertHorizontalRule = () => {
    const textarea = textareaRef.current;
    if (textarea) insertAtCursor(textarea, value, onChange, "\n\n---\n\n");
  };
  const insertTable = () => {
    const textarea = textareaRef.current;
    if (textarea) insertAtCursor(textarea, value, onChange, "\n\n| 열1 | 열2 |\n| --- | --- |\n| 값1 | 값2 |\n\n");
  };

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          {!isPreview && (
            <>
              <AppTooltip content="제목" placement="top">
                <button type="button" className={styles.toolbarButton} onClick={insertHeading}>
                  <Heading size={16} />
                </button>
              </AppTooltip>
              <AppTooltip content="굵게" placement="top">
                <button type="button" className={styles.toolbarButton} onClick={insertBold}>
                  <Bold size={16} />
                </button>
              </AppTooltip>
              <AppTooltip content="기울임" placement="top">
                <button type="button" className={styles.toolbarButton} onClick={insertItalic}>
                  <Italic size={16} />
                </button>
              </AppTooltip>
              <AppTooltip content="목록" placement="top">
                <button type="button" className={styles.toolbarButton} onClick={insertList}>
                  <List size={16} />
                </button>
              </AppTooltip>
              <AppTooltip content="순서목록" placement="top">
                <button type="button" className={styles.toolbarButton} onClick={insertOrderedList}>
                  <ListOrdered size={16} />
                </button>
              </AppTooltip>
              <AppTooltip content="코드" placement="top">
                <button type="button" className={styles.toolbarButton} onClick={handleInsertCode}>
                  <Code size={16} />
                </button>
              </AppTooltip>
              <AppTooltip content="인용" placement="top">
                <button type="button" className={styles.toolbarButton} onClick={insertQuote}>
                  <Quote size={16} />
                </button>
              </AppTooltip>
              <AppTooltip content="가로줄" placement="top">
                <button type="button" className={styles.toolbarButton} onClick={insertHorizontalRule}>
                  <Minus size={16} />
                </button>
              </AppTooltip>
              <AppTooltip content="표" placement="top">
                <button type="button" className={styles.toolbarButton} onClick={insertTable}>
                  <Table size={16} />
                </button>
              </AppTooltip>
            </>
          )}
        </div>
        <div className={styles.toolbarGroup}>
          {!isPreview && (
            <AppTooltip content={wrap ? "좌우 스크롤" : "자동 줄바꿈"} placement="top">
              <button
                type="button"
                className={cn(styles.toolbarButton, wrap ? styles.toolbarButtonActive : undefined)}
                aria-pressed={wrap}
                onClick={() => setWrap((current) => !current)}
              >
                <WrapText size={16} />
              </button>
            </AppTooltip>
          )}
          <AppTooltip content={isPreview ? "마크다운" : "미리보기"} placement="top">
            <button
              type="button"
              className={cn(styles.toolbarButton, isPreview ? styles.toolbarButtonActive : undefined)}
              aria-pressed={isPreview}
              onClick={() => setIsPreview((current) => !current)}
            >
              <Eye size={16} />
            </button>
          </AppTooltip>
          <AppTooltip content="저장" placement="top">
            <button
              type="button"
              className={styles.toolbarButton}
              disabled={disabled}
              onClick={() => onSubmit(trimBlankLines(value))}
            >
              <SendHorizonal size={16} color="var(--main-color, #00a0e9)" />
            </button>
          </AppTooltip>
        </div>
      </div>
      {isPreview ? (
        <MarkdownViewer content={value} className={styles.preview} />
      ) : (
        <textarea
          ref={textareaRef}
          className={cn(styles.textarea, wrap ? undefined : styles.textareaNoWrap)}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
        />
      )}
    </div>
  );
}
