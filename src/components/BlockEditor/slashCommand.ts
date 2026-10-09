import { Extension } from "@tiptap/core";
import type { Editor, Range } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import Suggestion, { exitSuggestion } from "@tiptap/suggestion";
import { Code, ListChecks, ListCollapse, Quote, Sigma, Table as TableIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { matchKorean } from "../../util/koreanMatch";
import { applyListType, insertDetails } from "./blockCommands";
import { insertMathInput } from "./mathEditing";
import { insertMediaInput } from "./mediaInput/mediaInputState";
import { MEDIA_KINDS } from "./mediaInput/mediaKinds";

export type SlashItem = { label: string; icon: LucideIcon; run: (editor: Editor) => void };

// 툴바 버튼과 같은 동작으로 블록을 넣는다. 아이콘도 툴바·입력 박스와 같다.
const SLASH_ITEMS: SlashItem[] = [
  { label: "체크리스트", icon: ListChecks, run: (editor) => applyListType(editor, "taskList") },
  { label: "아코디언", icon: ListCollapse, run: insertDetails },
  { label: "인용", icon: Quote, run: (editor) => editor.chain().focus().setBlockquote().run() },
  { label: "수식", icon: Sigma, run: (editor) => insertMathInput(editor, "blockMath") },
  { label: "코드", icon: Code, run: (editor) => editor.chain().focus().setCodeBlock().run() },
  { label: "표", icon: TableIcon, run: (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
  { label: "이미지", icon: MEDIA_KINDS.image.icon, run: (editor) => insertMediaInput(editor, "image", { focus: true }) },
  { label: "오디오", icon: MEDIA_KINDS.audio.icon, run: (editor) => insertMediaInput(editor, "audio", { focus: true }) },
  { label: "비디오", icon: MEDIA_KINDS.video.icon, run: (editor) => insertMediaInput(editor, "video", { focus: true }) },
  { label: "파일", icon: MEDIA_KINDS.file.icon, run: (editor) => insertMediaInput(editor, "file", { focus: true }) },
];

// 열려 있는 목록 — SlashMenu가 구독해서 그린다. null이면 닫혀 있다.
export type SlashMenuState = {
  items: SlashItem[];
  selected: number;
  clientRect: (() => DOMRect | null) | null;
  command: (item: SlashItem) => void;
} | null;

type SlashStore = {
  get: () => SlashMenuState;
  set: (next: SlashMenuState) => void;
  subscribe: (listener: () => void) => () => void;
};

declare module "@tiptap/core" {
  interface Storage {
    slashCommand: { store: SlashStore };
  }
}

function createSlashStore(): SlashStore {
  let state: SlashMenuState = null;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set: (next) => {
      state = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

const slashKey = new PluginKey("slashCommand");

/*
 * 줄 맨 앞에서 "/"를 입력하면 넣을 블록 목록을 띄운다. "/" 뒤 글자와 맞는 항목만 남기고(util/koreanMatch.ts),
 * ↑/↓로 고른 뒤 Tab이나 Enter로 "/검색어"를 지우고 그 블록을 넣는다. Esc로 닫는다.
 * 목록이 열려 있는 동안에는 이 키들을 들여쓰기·마크다운 확정 등 다른 Tab/Enter 처리보다 먼저 받는다.
 */
export const SlashCommand = Extension.create({
  name: "slashCommand",
  priority: 1200,

  addStorage() {
    return { store: createSlashStore() };
  },

  addProseMirrorPlugins() {
    const { store } = this.storage;
    const editor = this.editor;
    const open = (props: { items: SlashItem[]; clientRect?: (() => DOMRect | null) | null; command: (item: SlashItem) => void }) => {
      store.set({ items: props.items, selected: 0, clientRect: props.clientRect ?? null, command: props.command });
    };

    return [
      Suggestion<SlashItem, SlashItem>({
        pluginKey: slashKey,
        editor,
        char: "/",
        startOfLine: true,
        allowSpaces: false,
        // startOfLine은 커서 앞 텍스트 조각의 시작만 보므로, "/"가 실제로 문단의 첫 글자인지 다시 확인한다.
        // 코드 블록 안에서는 띄우지 않는다.
        allow: ({ state, range }: { state: Editor["state"]; range: Range }) => {
          const $from = state.doc.resolve(range.from);
          return $from.parent.type.name !== "codeBlock" && range.from === $from.start();
        },
        // 초성·입력 중인 글자·띄엄띄엄 일치까지 받고, 앞부분 일치 → 중간 연속 일치 → 순서만 일치 순으로 보인다.
        items: ({ query }) => SLASH_ITEMS
          .map((item, index) => ({ item, index, score: matchKorean(item.label, query) }))
          .filter((entry): entry is { item: SlashItem; index: number; score: number } => entry.score !== null)
          .sort((left, right) => left.score - right.score || left.index - right.index)
          .map((entry) => entry.item),
        command: ({ editor: current, range, props }) => {
          current.chain().focus().deleteRange(range).run();
          props.run(current);
        },
        render: () => ({
          onStart: open,
          onUpdate: open,
          onExit: () => store.set(null),
          onKeyDown: ({ event }) => {
            const menu = store.get();
            if (!menu || !menu.items.length || event.isComposing) return false;
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              const step = event.key === "ArrowDown" ? 1 : -1;
              store.set({ ...menu, selected: (menu.selected + step + menu.items.length) % menu.items.length });
              return true;
            }
            if (event.key === "Enter" || (event.key === "Tab" && !event.shiftKey)) {
              menu.command(menu.items[menu.selected]);
              return true;
            }
            if (event.key === "Escape") {
              exitSuggestion(editor.view, slashKey);
              return true;
            }
            return false;
          },
        }),
      }),
    ];
  },
});
