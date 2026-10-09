import type { Editor } from "@tiptap/core";

export function readElementStyle(element: Element) {
  const style = window.getComputedStyle(element);
  return {
    tag: element.tagName,
    className: element.getAttribute("class"),
    inlineStyle: element.getAttribute("style"),
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    lineHeight: style.lineHeight,
    color: style.color,
    backgroundColor: style.backgroundColor,
    fontSize4xlToken: style.getPropertyValue("--chakra-font-sizes-4xl"),
    fontSize5xlToken: style.getPropertyValue("--chakra-font-sizes-5xl"),
  };
}

function snapshot(editor: Editor) {
  const { selection, storedMarks } = editor.state;
  const { $from } = selection;
  const blockNode = editor.view.nodeDOM($from.depth > 0 ? $from.before() : 0);
  const block = blockNode instanceof Element ? blockNode : blockNode?.parentElement;
  return {
    selection: { from: selection.from, to: selection.to, empty: selection.empty },
    selectedBlock: $from.parent.toJSON(),
    storedMarks: storedMarks?.map((mark) => mark.toJSON()) ?? null,
    cursorMarks: $from.marks().map((mark) => mark.toJSON()),
    heading: editor.getAttributes("heading"),
    boldActive: editor.isActive("bold"),
    textStyle: editor.getAttributes("textStyle"),
    html: editor.getHTML(),
    renderedBlock: block ? {
      html: block.outerHTML,
      style: readElementStyle(block),
      inlineElements: Array.from(block.querySelectorAll("strong, span")).map(readElementStyle),
    } : null,
  };
}

let sequence = 0;

// 사용자가 버튼을 눌렀을 때만 스냅샷을 출력한다. 다음 프레임도 기록해 포커스 복귀 후 변화를 구분한다.
export function runStyleCommand(editor: Editor, action: string, command: () => boolean) {
  const id = ++sequence;
  console.log(`[BlockEditor style] ${id} ${action} BEFORE`, JSON.stringify(snapshot(editor), null, 2));
  const result = command();
  console.log(`[BlockEditor style] ${id} ${action} AFTER`, JSON.stringify({ result, ...snapshot(editor) }, null, 2));
  requestAnimationFrame(() => {
    if (!editor.isDestroyed) {
      console.log(`[BlockEditor style] ${id} ${action} NEXT FRAME`, JSON.stringify(snapshot(editor), null, 2));
    }
  });
  return result;
}
