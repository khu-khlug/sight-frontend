import type { NodeViewRendererProps } from "@tiptap/core";
import type { Details } from "@tiptap/extension-details";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { NodeView } from "@tiptap/pm/view";

// 접는 블록의 열림 상태는 문서에 저장되지 않고(persist: false) NodeView의 DOM(is-open 클래스, 본문의 hidden)에만
// 있다. ProseMirror는 블록이 앞뒤로 옮겨질 때 접는 블록의 뷰를 새로 만들기도 하는데, 그러면 닫힌 상태로
// 돌아간다. 열림 상태를 접는 블록의 첫 자식(detailsSummary) 노드 객체에 묶어 뷰 밖에 기억해 두고, 뷰가
// 새로 만들어질 때 복원한다. 블록이 안팎으로 옮겨져도 요약 노드 객체는 그대로 재사용되므로 키가 유지된다.
const openStates = new WeakMap<ProseMirrorNode, boolean>();

const keyOf = (node: ProseMirrorNode) => node.firstChild;

/*
 * Details의 NodeView를 감싸 열림 상태를 기억·복원한다. 열림은 토글 버튼 클릭(자동 펼침을 위한
 * 프로그램 클릭 포함)과 노드 갱신 때 기록한다.
 */
export function withDetailsOpenMemory(extension: typeof Details) {
  return extension.extend({
    addNodeView() {
      const parentNodeView = this.parent?.();
      if (!parentNodeView) return null;
      const { renderToggleButton } = this.options;
      const openClassName = this.options.openClassName;

      return (props: NodeViewRendererProps): NodeView => {
        const view = parentNodeView(props);
        const dom = view.dom as HTMLElement;
        const toggle = dom.querySelector<HTMLButtonElement>(":scope > button");
        let current = props.node;

        const remember = (node: ProseMirrorNode) => {
          const key = keyOf(node);
          if (key) openStates.set(key, dom.classList.contains(openClassName));
        };

        // 토글 버튼의 클릭 처리는 Details가 먼저 등록해서, 이 리스너가 실행될 때는 이미 상태가 바뀌어 있다.
        toggle?.addEventListener("click", () => remember(current));

        const key = keyOf(props.node);
        if (key && openStates.get(key) && !dom.classList.contains(openClassName)) {
          dom.classList.add(openClassName);
          if (toggle) renderToggleButton({ element: toggle, isOpen: true, node: props.node });
          // 본문(detailsContent)은 이 뷰가 반환된 직후 만들어지고 hidden 상태로 시작하므로, 만들어진 뒤에 펼친다.
          queueMicrotask(() => {
            dom.querySelector(':scope > div > div[data-type="detailsContent"]')
              ?.dispatchEvent(new Event("toggleDetailsContent"));
          });
        }

        return {
          ...view,
          update(newNode, decorations, innerDecorations) {
            const kept = view.update ? view.update(newNode, decorations, innerDecorations) : false;
            if (kept) {
              current = newNode;
              // 요약이 수정되어 키 노드가 바뀌었어도 현재 열림 상태를 새 키에 이어 붙인다.
              remember(newNode);
            }
            return kept;
          },
        };
      };
    },
  });
}
