import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

export const PLAIN_TEXT_DELIMITER = '"""';
type PlainTextRange = { from: number; to: number; closed: boolean };

// 같은 컨테이너의 연속된 문단에 걸친 기호도 찾는다. 인라인 노드는 한 글자 자리로 센다.
export function plainTextRanges(doc: ProseMirrorNode): PlainTextRange[] {
  const ranges: PlainTextRange[] = [];
  let open: number | null = null;
  let previousParent: ProseMirrorNode | null = null;
  let previousEnd = -1;
  let contentEnd = 0;
  const finish = () => {
    if (open !== null) ranges.push({ from: open, to: contentEnd, closed: false });
    open = null;
  };
  doc.descendants((node, pos) => {
    if (!node.isTextblock) return true;
    const parent = doc.resolve(pos).parent;
    if (parent !== previousParent || pos !== previousEnd) finish();
    previousParent = parent;
    previousEnd = pos + node.nodeSize;
    contentEnd = pos + 1 + node.content.size;
    if (node.type.spec.code) { finish(); return false; }
    const text = node.textBetween(0, node.content.size, "\n", "\uFFFC");
    for (let index = 0; index < text.length;) {
      if (text[index] === "\\") { index += 2; continue; }
      if (!text.startsWith(PLAIN_TEXT_DELIMITER, index)) { index += 1; continue; }
      const position = pos + 1 + index;
      if (open === null) open = position;
      else {
        ranges.push({ from: open, to: position + PLAIN_TEXT_DELIMITER.length, closed: true });
        open = null;
      }
      index += PLAIN_TEXT_DELIMITER.length;
    }
    return false;
  });
  finish();
  return ranges;
}

export function insidePlainText(doc: ProseMirrorNode, pos: number): boolean {
  return plainTextRanges(doc).some((range) => pos >= range.from + PLAIN_TEXT_DELIMITER.length
    && (range.closed ? pos < range.to : pos <= range.to));
}
