import { Portal } from "@chakra-ui/react";
import type { Editor } from "@tiptap/react";
import { useEffect, useReducer, useSyncExternalStore } from "react";

import { cn } from "../../util/cn";
import styles from "./slashMenu.module.css";

// 슬래시 명령(slashCommand.ts)의 블록 목록 — "/검색어" 글자 바로 아래에 띄운다.
export default function SlashMenu({ editor }: { editor: Editor }) {
  const { store } = editor.storage.slashCommand;
  const menu = useSyncExternalStore(store.subscribe, store.get);
  const [, reposition] = useReducer((count: number) => count + 1, 0);

  // 열려 있는 동안 편집기를 스크롤하거나 창 크기가 바뀌면 글자 위치를 다시 읽는다.
  useEffect(() => {
    if (!menu) return;
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [menu]);

  const rect = menu?.clientRect?.();
  if (!menu || !menu.items.length || !rect) return null;

  return (
    <Portal>
      <div className={styles.menu} style={{ left: rect.left, top: rect.bottom }} role="listbox" aria-label="블록 넣기">
        {menu.items.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              role="option"
              aria-selected={index === menu.selected}
              className={cn(styles.item, index === menu.selected && styles.itemActive)}
              // 편집기 포커스를 잃지 않도록 누르는 순간 기본 동작을 막고 바로 넣는다.
              onMouseDown={(event) => {
                event.preventDefault();
                menu.command(item);
              }}
              onPointerEnter={() => store.set({ ...menu, selected: index })}
            >
              <Icon size={16} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </Portal>
  );
}
