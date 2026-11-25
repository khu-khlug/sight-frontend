import { Popover, Portal } from "@chakra-ui/react";
import type { Editor } from "@tiptap/react";
import { CreditCard } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

import { cn } from "../../util/cn";
import AppTooltip, { TOOLTIP_OPEN_DELAY_MS } from "../AppTooltip";
import { linkRangeAt } from "../BlockContent/linkIcons";
import type { LinkCard } from "../BlockContent/linkIcons";
import styles from "./linkEditOverlay.module.css";

const MAX_SUGGESTIONS = 8;

type Props = {
  editor: Editor;
  // "#"로 찾을 카드 목록이다.
  cards: LinkCard[];
};

// 주소를 고치는 중인 링크 — from은 링크 시작 위치(아이콘 위젯 자리)다.
type Editing = { icon: HTMLElement; from: number; href: string };

function iconOf(target: EventTarget | null) {
  return target instanceof Element ? target.closest<HTMLElement>("[data-link-icon]") : null;
}

/*
 * 링크 앞 아이콘(LinkWithIcons가 다는 위젯)에 마우스를 올리면 "링크 수정" 툴팁을, 누르면 같은 자리(위쪽)에
 * 주소 입력 상자를 띄운다. 아이콘은 ProseMirror 위젯이라 React 이벤트가 닿지 않으므로 편집기 DOM에 직접
 * 이벤트를 걸고, 툴팁·상자는 아이콘 위치에 맞춘 보이지 않는 기준 요소에 띄운다.
 */
export default function LinkEditOverlay({ editor, cards }: Props) {
  const [hovered, setHovered] = useState<HTMLElement | null>(null);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [value, setValue] = useState("");
  const [active, setActive] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const anchorIcon = editing?.icon ?? hovered;

  useEffect(() => {
    const dom = editor.view.dom;
    const handleOver = (event: PointerEvent) => {
      const icon = iconOf(event.target);
      if (icon) setHovered(icon);
    };
    const handleOut = (event: PointerEvent) => {
      const icon = iconOf(event.target);
      if (icon && !icon.contains(event.relatedTarget as Node | null)) setHovered(null);
    };
    const handleDown = (event: PointerEvent) => {
      const icon = iconOf(event.target);
      if (!icon || event.button !== 0 || !editor.isEditable) return;
      event.preventDefault();
      const href = icon.dataset.href ?? "";
      setEditing({ icon, from: editor.view.posAtDOM(icon, 0), href });
      setValue(href);
      setActive(0);
    };
    dom.addEventListener("pointerover", handleOver);
    dom.addEventListener("pointerout", handleOut);
    dom.addEventListener("pointerdown", handleDown);
    return () => {
      dom.removeEventListener("pointerover", handleOver);
      dom.removeEventListener("pointerout", handleOut);
      dom.removeEventListener("pointerdown", handleDown);
    };
  }, [editor]);

  // 툴팁을 직접 열기 때문에 일반 툴팁과 같은 지연을 둔다. 입력 상자가 열려 있으면 툴팁은 띄우지 않는다.
  useEffect(() => {
    setTooltipOpen(false);
    if (!hovered || editing) return;
    const timer = setTimeout(() => setTooltipOpen(true), TOOLTIP_OPEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, [hovered, editing]);

  // 기준 요소를 아이콘 자리에 맞춘다 — 편집기를 스크롤하거나 창 크기가 바뀌면 따라간다.
  useEffect(() => {
    if (!anchorIcon) {
      setRect(null);
      return;
    }
    const update = () => setRect(anchorIcon.getBoundingClientRect());
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [anchorIcon]);

  // "#"로 시작하면 그 뒤 글자로 카드명을 찾는다.
  const suggestions = useMemo(() => {
    if (!editing || !value.startsWith("#")) return [];
    const query = value.slice(1).trim().toLowerCase();
    return cards.filter((card) => card.title.toLowerCase().includes(query) || card.id === query).slice(0, MAX_SUGGESTIONS);
  }, [editing, value, cards]);

  // 링크가 걸린 글자 범위 전체의 주소를 바꾼다. 주소를 비우면 링크를 푼다(글자는 남는다).
  const apply = (next: string) => {
    if (!editing) return;
    const range = linkRangeAt(editor.state.doc, editor.schema.marks.link, editing.from);
    setEditing(null);
    if (!range) {
      editor.commands.focus();
      return;
    }
    const href = next.trim();
    const chain = editor.chain().focus().setTextSelection(range);
    (href ? chain.setLink({ href }) : chain.unsetLink()).setTextSelection(range.to).run();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (!suggestions.length) return;
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((current) => (current + step + suggestions.length) % suggestions.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const picked = suggestions[active];
      apply(picked ? `#${picked.id}` : value);
    }
  };

  if (!anchorIcon || !rect) return null;
  const label = anchorIcon.dataset.href ? "링크 수정" : "링크 주소 입력";

  return (
    <Popover.Root
      open={editing !== null}
      onOpenChange={(details) => { if (!details.open) setEditing(null); }}
      onPointerDownOutside={(event) => {
        // 링크 아이콘은 실제 trigger 대신 DOM 이벤트로 연다. 아이콘 클릭을 닫기 동작으로 처리하지 않는다.
        const icon = iconOf(event.detail.originalEvent.target);
        if (icon && editor.view.dom.contains(icon)) event.preventDefault();
      }}
      onEscapeKeyDown={() => editor.commands.focus()}
      initialFocusEl={() => inputRef.current}
      lazyMount
      unmountOnExit
      positioning={{
        placement: "top",
        gutter: 8,
        getAnchorElement: () => anchorIcon,
      }}
    >
      <Portal>
        <Popover.Anchor asChild>
          <span className={styles.anchor} style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}>
            {/* 두 컴포넌트가 서로의 위치 기준 id를 덮어쓰지 않도록 요소를 분리한다. */}
            <AppTooltip content={label} placement="top" open={tooltipOpen}>
              <span style={{ display: "block", width: "100%", height: "100%" }} />
            </AppTooltip>
          </span>
        </Popover.Anchor>
      </Portal>
      <Portal>
        <Popover.Positioner>
          <Popover.Content className={styles.editor} aria-label={label}>
            <input
              ref={inputRef}
              type="text"
              className={styles.input}
              value={value}
              placeholder="주소 입력 · #으로 카드 찾기"
              onChange={(event) => {
                setValue(event.target.value);
                setActive(0);
              }}
              onKeyDown={handleKeyDown}
              aria-label="링크 주소"
            />
            {suggestions.length > 0 && (
              <div className={styles.suggestions} role="listbox" aria-label="카드">
                {suggestions.map((card, index) => (
                  <button
                    key={card.id}
                    type="button"
                    role="option"
                    aria-selected={index === active}
                    className={cn(styles.suggestion, index === active && styles.suggestionActive)}
                    onPointerEnter={() => setActive(index)}
                    onClick={() => apply(`#${card.id}`)}
                  >
                    <CreditCard size={14} aria-hidden="true" />
                    <span className={styles.suggestionTitle}>{card.title}</span>
                  </button>
                ))}
              </div>
            )}
            <div className={styles.actions}>
              <button type="button" className={styles.actionButton} onClick={() => apply("")}>링크 해제</button>
              <button type="button" className={cn(styles.actionButton, styles.primaryButton)} onClick={() => apply(value)}>적용</button>
            </div>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
