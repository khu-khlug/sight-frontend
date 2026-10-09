import { Extension } from "@tiptap/core";
import type { Editor } from "@tiptap/core";
import type { Node as ProseMirrorNode, Slice } from "@tiptap/pm/model";
import { TextSelection } from "@tiptap/pm/state";

// 마크다운 커밋키 자동변환(markdownWrapMark.ts, markdownHeadingPrefix.ts) 전용 "방금 한 변환"
// 기록. 여러 마크 확장이 전부 같은 editor.storage를 공유해서 쓴다 — Bold가 방금 변환했어도
// Ctrl+Z는 "어떤 마크였는지"와 무관하게 "가장 최근 자동변환"을 되돌리면 되기 때문이다.
export type PendingAutoformat = {
  from: number;
  to: number;
  original: string;
  // 마크 확정 전의 텍스트와 중첩 서식을 그대로 복구한다.
  originalSlice?: Slice;
  // 문단 여러 개를 교체하는 변환은 원래 커서 위치도 함께 복구한다.
  originalCursor?: number;
  // 헤딩처럼 노드 타입 자체를 바꾼 경우에만 채운다 — 되돌릴 때 이 타입으로 되돌린다.
  revertNodeType?: string;
  // 변환 직후의 문서 스냅샷 — ProseMirror 문서는 불변이라, 그 뒤로 어떤 트랜잭션이든(선택만
  // 바뀌는 건 제외, 그건 새 doc을 안 만든다) 한 번이라도 더 있었으면 이 참조가 달라진다.
  // 그걸로 "바로 다음 키에서만 되돌릴 수 있다"는 창구가 아직 열려 있는지 판정한다 — 트랜잭션
  // 메타/이벤트를 따로 안 둬도 돼서 단순하다.
  docAfterConversion: ProseMirrorNode;
};

declare module "@tiptap/core" {
  interface Storage {
    markdownAutoformat: {
      pending: PendingAutoformat | null;
      suppressFrom: number | null;
    };
  }
}

// 변환을 실제로 반영한 직후(.run()이 끝나 editor.state가 이미 갱신된 뒤) 호출한다 — 체인 중간에
// 커맨드를 끼워 넣지 않는다(체인의 한 단계라도 실패로 간주되면 전체가 디스패치되지 않을 위험이
// 있어서, 기록은 항상 별도 호출로 분리한다).
export function recordAutoformatConversion(editor: Editor, pending: Omit<PendingAutoformat, "docAfterConversion">) {
  editor.storage.markdownAutoformat.pending = { ...pending, docAfterConversion: editor.state.doc };
}

// 바로 이 자리(from)가 직전에 되돌리기(Ctrl+Z/Esc)로 복구된 곳인지 확인하고, 맞으면 "한 번만"
// 억제를 소비한다(그다음부터는 다시 정상적으로 변환된다) — 되돌린 자동변환을 커밋키를 또
// 누른다고 바로 다시 변환하지 않는, 다른 에디터들의 공통 관례다.
export function consumeAutoformatSuppression(editor: Editor, from: number): boolean {
  const storage = editor.storage.markdownAutoformat as { suppressFrom: number | null } | undefined;
  if (!storage || storage.suppressFrom !== from) return false;
  storage.suppressFrom = null;
  return true;
}

function revertPendingAutoformat(editor: Editor): boolean {
  const storage = editor.storage.markdownAutoformat as { pending: PendingAutoformat | null; suppressFrom: number | null } | undefined;
  const pending = storage?.pending;
  if (!storage || !pending) return false;
  // 변환 이후 문서가 한 번이라도 더 바뀌었으면(사용자가 다른 걸 입력/편집했으면) 창구가 이미
  // 닫힌 것으로 본다 — 선택 영역만 바뀐 경우는 doc 참조가 그대로라 여기 안 걸린다.
  if (editor.state.doc !== pending.docAfterConversion) {
    storage.pending = null;
    return false;
  }
  storage.pending = null;
  storage.suppressFrom = pending.from;

  if (pending.originalSlice) {
    const tr = editor.state.tr;
    if (pending.revertNodeType) {
      tr.setBlockType(pending.from, pending.to, editor.schema.nodes[pending.revertNodeType]);
    }
    tr.replace(pending.from, pending.to, pending.originalSlice);
    tr.setSelection(TextSelection.create(tr.doc, pending.originalCursor ?? pending.from + pending.originalSlice.size));
    tr.setMeta("preventAutolink", true);
    if (pending.revertNodeType) tr.setStoredMarks(tr.selection.$from.marks());
    editor.view.dispatch(tr);
    return true;
  }

  let chain = editor.chain().focus();
  if (pending.revertNodeType) chain = chain.setNode(pending.revertNodeType);
  chain
    .deleteRange({ from: pending.from, to: pending.to })
    .insertContentAt(pending.from, pending.original)
    .setTextSelection(pending.from + pending.original.length)
    .run();
  return true;
}

function clearActiveMarks(editor: Editor): boolean {
  const { state } = editor;
  if (!state.selection.empty) return false;
  const marks = state.storedMarks ?? state.selection.$from.marks();
  if (marks.length === 0) return false;
  // 현재 위치의 입력 서식만 해제한다. 이미 작성된 텍스트의 서식은 유지한다.
  editor.view.dispatch(state.tr.setStoredMarks([]));
  return true;
}

// 에디터 하나에 한 번만 등록하면 된다(BlockEditor의 extensions 배열).
export const MarkdownAutoformatHistory = Extension.create({
  name: "markdownAutoformat",
  addStorage() {
    return { pending: null, suppressFrom: null };
  },
  addKeyboardShortcuts() {
    return {
      "Mod-z": ({ editor }) => revertPendingAutoformat(editor),
      Escape: ({ editor }) => clearActiveMarks(editor) || revertPendingAutoformat(editor),
    };
  },
});
