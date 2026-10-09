import { getChangedRanges } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { Transaction } from "@tiptap/pm/state";

export type TocHeading = { pos: number; level: number; text: string };
type TocNode = TocHeading & { children: TocNode[] };

// 한 행 앞에 붙는 칸들 — 조상 칸(through: 아래에 형제가 남아 세로선이 이어짐, blank: 비어 있음)과 자기 가지 칸.
export type TocSegment = "through" | "blank" | "branch" | "last";
export type TocRow = { heading: TocHeading; segments: TocSegment[] };

// 문서 순서대로 제목을 모은다. 접는 블록·인용·목록 안의 제목도 포함하고, 글자가 없는 제목은 뺀다.
export function collectHeadings(doc: ProseMirrorNode): TocHeading[] {
  const headings: TocHeading[] = [];
  doc.descendants((node, pos) => {
    if (node.type.name !== "heading") return true;
    if (node.textContent.trim()) headings.push({ pos, level: node.attrs.level, text: node.textContent });
    return false;
  });
  return headings;
}

/*
 * 각 제목의 부모는 앞쪽에서 가장 가까운, 자신보다 큰(레벨 숫자가 작은) 제목이다. 그런 제목이 없으면 최상위다.
 * 그래서 제목 1은 항상 최상위이고, 깊이는 레벨 숫자가 아니라 앞에 놓인 더 큰 제목들로 정해진다.
 */
function buildTree(headings: TocHeading[]): TocNode[] {
  const roots: TocNode[] = [];
  const stack: TocNode[] = [];
  for (const heading of headings) {
    const node: TocNode = { ...heading, children: [] };
    while (stack.length && stack[stack.length - 1].level >= heading.level) stack.pop();
    (stack.length ? stack[stack.length - 1].children : roots).push(node);
    stack.push(node);
  }
  return roots;
}

// 최상위 행은 칸이 없고(선을 잇지 않는다), 그 아래 행부터 조상 칸 + 자기 가지 칸을 붙인다.
function flatten(nodes: TocNode[], trail: TocSegment[] | null, rows: TocRow[]) {
  nodes.forEach((node, index) => {
    const last = index === nodes.length - 1;
    rows.push({ heading: node, segments: trail ? [...trail, last ? "last" : "branch"] : [] });
    flatten(node.children, trail ? [...trail, last ? "blank" : "through"] : [], rows);
  });
}

export function buildTocRows(doc: ProseMirrorNode): TocRow[] {
  const rows: TocRow[] = [];
  flatten(buildTree(collectHeadings(doc)), null, rows);
  return rows;
}

// 이 트랜잭션이 제목을 건드렸는지 — 바뀐 범위의 변경 전·후 문서에 제목이 걸려 있으면 제목 글자 수정, 추가·삭제,
// 제목↔본문 전환, 레벨 변경 중 하나다.
export function touchesHeadings(tr: Transaction): boolean {
  const hasHeading = (doc: ProseMirrorNode, from: number, to: number) => {
    let found = false;
    doc.nodesBetween(from, Math.max(from, to), (node) => {
      if (found) return false;
      if (node.type.name === "heading") found = true;
      return !found;
    });
    return found;
  };
  return getChangedRanges(tr).some(({ oldRange, newRange }) =>
    hasHeading(tr.before, oldRange.from, oldRange.to) || hasHeading(tr.doc, newRange.from, newRange.to));
}
