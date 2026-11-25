import { ScrollArea } from "@chakra-ui/react";
import { Table } from "@tiptap/extension-table";
import { updateColumnsOnResize } from "@tiptap/pm/tables";
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useLayoutEffect, useRef } from "react";
import HoverScrollbar from "../HoverScrollbar";
import styles from "./table.module.css";

function TableNodeView({ node }: NodeViewProps) {
  const stage = useRef<HTMLDivElement>(null);
  let minimumWidth = 0;
  node.firstChild?.forEach((cell) => {
    for (let column = 0; column < cell.attrs.colspan; column++) {
      minimumWidth += cell.attrs.colwidth?.[column] || 64;
    }
  });
  useLayoutEffect(() => {
    const table = stage.current?.querySelector("table");
    if (!table) return;
    let colgroup = table.querySelector<HTMLTableColElement>(":scope > colgroup");
    if (!colgroup) {
      colgroup = table.ownerDocument.createElement("colgroup");
      table.prepend(colgroup);
    }
    updateColumnsOnResize(node, colgroup, table, 64);
  }, [node]);
  return (
    <NodeViewWrapper className={styles.wrapper}>
      <ScrollArea.Root className={styles.scrollRoot} size="sm" variant="hover">
        <ScrollArea.Viewport className={styles.viewport} data-table-viewport="" style={{ overflowY: "hidden" }}>
          <ScrollArea.Content style={{ width: "100%", minWidth: minimumWidth + 28 }}>
            <div ref={stage} className={styles.stage}>
              <NodeViewContent<"table"> as="table" style={{ whiteSpace: "normal" }} />
            </div>
          </ScrollArea.Content>
        </ScrollArea.Viewport>
        <HoverScrollbar orientation="horizontal" />
      </ScrollArea.Root>
    </NodeViewWrapper>
  );
}

// 크기 조절 플러그인의 기본 TableView 대신 기존 스크롤바를 포함한 NodeView를 사용한다.
export const InteractiveTable = Table.extend({
  addNodeView() {
    return ReactNodeViewRenderer(TableNodeView, { contentDOMElementTag: "tbody" });
  },
}).configure({
  resizable: true,
  cellMinWidth: 64,
  lastColumnResizable: false,
  // 전체 이동 시 표 선택이 셀 선택으로 바뀌어 원본의 내용만 지워지지 않도록 한다.
  allowTableNodeSelection: true,
});
