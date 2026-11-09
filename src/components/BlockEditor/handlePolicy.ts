import type { Node as ProseMirrorNode, ResolvedPos } from "@tiptap/pm/model";

export type HandlePolicyContext = {
  node: ProseMirrorNode;
  // 노드 바로 앞 위치(getPos())를 resolve한 값 — depth·parent·조상 노드를 여기서 읽는다.
  $pos: ResolvedPos;
};

// 자식 블록이 "그 컨테이너가 속한 곳과 같은 정책"을 따르는 컨테이너와, 바깥으로 올라갈 때 건너뛸 깊이다.
// 접는 블록 본문(detailsContent)은 details 안에 있으므로 [details, detailsContent] 두 단계를,
// 인용·목록·목록 항목은 자기 한 단계를 건너뛴다. 목록 항목은 중첩 목록의 부모이기도 해서, 중첩된 항목은
// [항목, 목록]을 차례로 올라가 최상위까지 도달한다.
const TRANSPARENT_CONTAINERS: Record<string, number> = {
  detailsContent: 2,
  blockquote: 1,
  bulletList: 1,
  orderedList: 1,
  taskList: 1,
  listItem: 1,
  taskItem: 1,
};

const LIST_NAMES = new Set(["bulletList", "orderedList", "taskList"]);
const ITEM_NAMES = new Set(["listItem", "taskItem"]);

// 이 블록 노드 종류에 핸들을 달지. 바깥 정책을 바꾸고 싶으면 여기서 종류를 거른다 —
// 접는 블록·인용·목록 안에도 같은 판단이 그대로 적용된다.
function isHandleBlock(node: ProseMirrorNode, parent: ProseMirrorNode): boolean {
  // 목록 자체에는 핸들을 달지 않고 항목마다 단다.
  if (LIST_NAMES.has(node.type.name)) return false;
  // 항목 안의 내용(문단 등)은 항목의 일부라서 따로 달지 않는다.
  if (ITEM_NAMES.has(parent.type.name)) return false;
  return true;
}

// 드래그 핸들 정책의 유일한 정의다. 핸들은 문서 최상위 블록에 달리고, 접는 블록 본문·인용·목록 안의
// 블록은 그 컨테이너가 최상위에 있는 것처럼 같은 판단을 받는다(중첩되어도 같은 방식으로 올라간다).
export function shouldShowHandle({ node, $pos }: HandlePolicyContext): boolean {
  let depth = $pos.depth;
  for (;;) {
    const skip = TRANSPARENT_CONTAINERS[$pos.node(depth).type.name];
    if (!skip || depth < skip) break;
    depth -= skip;
  }
  if ($pos.node(depth).type.name !== "doc") return false;
  return isHandleBlock(node, $pos.parent);
}
