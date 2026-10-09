import { RepoTreeEntry } from "../../../../../api/public/group/GroupRepositoryApi";

export type FileTreeNode = {
  name: string; // 폴더 하나에 폴더만 있으면 이어붙여진 이름("src/components" 등)일 수 있다
  path: string; // 실제(원본) 경로 — 마지막으로 합쳐진 폴더의 경로
  type: "blob" | "tree";
  // blob일 때만 있다 — 파일 창(FileWindow)이 내용을 가져오는 데 쓴다.
  rawUrl?: string;
  children: FileTreeNode[];
};

export type VisibleFileTreeRow = {
  node: FileTreeNode;
  depth: number;
  ancestorHasNext: boolean[];
  hasNextSibling: boolean;
};

type RawNode = {
  name: string;
  path: string;
  type: "blob" | "tree";
  rawUrl?: string;
  children: Map<string, RawNode>;
};

function sortNodes<T extends { type: "blob" | "tree"; name: string }>(nodes: T[]): T[] {
  return [...nodes].sort((a, b) => {
    if (a.type !== b.type) return a.type === "tree" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

// 폴더 안에 다른 건 없고 폴더 하나만 있으면, 그 폴더 이름을 이어붙여 한 줄로 모아 보여준다.
function toFileTreeNode(raw: RawNode): FileTreeNode {
  let children = sortNodes(Array.from(raw.children.values()).map(toFileTreeNode));
  let name = raw.name;
  let path = raw.path;

  while (children.length === 1 && children[0].type === "tree") {
    name = `${name}/${children[0].name}`;
    path = children[0].path;
    children = children[0].children;
  }

  return { name, path, type: raw.type, rawUrl: raw.rawUrl, children };
}

export function buildFileTree(entries: RepoTreeEntry[]): FileTreeNode[] {
  const root: RawNode = { name: "", path: "", type: "tree", children: new Map() };

  for (const entry of entries) {
    const parts = entry.path.split("/");
    let current = root;
    let currentPath = "";

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLast = index === parts.length - 1;
      if (!current.children.has(part)) {
        current.children.set(part, {
          name: part,
          path: currentPath,
          type: isLast ? entry.type : "tree",
          rawUrl: isLast ? entry.rawUrl : undefined,
          children: new Map(),
        });
      }
      current = current.children.get(part) as RawNode;
    });
  }

  return sortNodes(Array.from(root.children.values()).map(toFileTreeNode));
}

// 트리와 별도 하이라이트 레이어가 정확히 같은 행 순서를 사용한다.
export function visibleFileTreeRows(
  nodes: FileTreeNode[],
  expandedPaths: Set<string>,
): VisibleFileTreeRow[] {
  const rows: VisibleFileTreeRow[] = [];

  function visit(siblings: FileTreeNode[], depth: number, ancestorHasNext: boolean[]) {
    siblings.forEach((node, index) => {
      const hasNextSibling = index < siblings.length - 1;
      rows.push({ node, depth, ancestorHasNext, hasNextSibling });
      if (node.type === "tree" && expandedPaths.has(node.path)) {
        visit(node.children, depth + 1, [...ancestorHasNext, hasNextSibling]);
      }
    });
  }

  visit(nodes, 0, []);
  return rows;
}
