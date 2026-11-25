import { Folder, FolderOpen } from "lucide-react";

import MaterialFileIcon from "../../../../../components/MaterialFileIcon";
import { draggableFileProps } from "../../../../../util/draggableFile";

import { VisibleFileTreeRow } from "./buildFileTree";
import styles from "./FileTree.module.css";

type Props = {
  rows: VisibleFileTreeRow[];
  expandedPaths: Set<string>;
  onToggle: (path: string) => void;
  onActivePathChange: (path: string | null) => void;
  onFileClick: (node: VisibleFileTreeRow["node"]) => void;
};

function RowGuides({
  depth,
  ancestorHasNext,
  hasNextSibling,
  hasChildren,
}: Pick<VisibleFileTreeRow, "depth" | "ancestorHasNext" | "hasNextSibling"> & { hasChildren: boolean }) {
  return (
    <>
      {ancestorHasNext.map((hasNext, level) =>
        level > 0 && hasNext ? (
          <span
            key={level}
            className={styles.ancestorGuide}
            style={{ left: `${level * 16}px` }}
            aria-hidden="true"
          />
        ) : null,
      )}
      {depth > 0 && (
        <span
          className={styles.branch}
          style={{ left: `${depth * 16}px` }}
          data-last={!hasNextSibling}
          aria-hidden="true"
        />
      )}
      {hasChildren && (
        <span
          className={styles.childStem}
          style={{ left: `${(depth + 1) * 16}px` }}
          aria-hidden="true"
        />
      )}
    </>
  );
}

export default function FileTree({ rows, expandedPaths, onToggle, onActivePathChange, onFileClick }: Props) {
  return (
    <div className={styles.tree} onPointerLeave={() => onActivePathChange(null)}>
      {rows.map((row) => {
        const { node, depth } = row;
        const isFolder = node.type === "tree";
        const expanded = expandedPaths.has(node.path);

        return isFolder ? (
          <button
            key={node.path}
            type="button"
            className={styles.row}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
            aria-expanded={expanded}
            onClick={() => onToggle(node.path)}
            onPointerEnter={() => onActivePathChange(node.path)}
            onFocus={() => onActivePathChange(node.path)}
            onBlur={() => onActivePathChange(null)}
          >
            <RowGuides {...row} hasChildren={expanded && node.children.length > 0} />
            {expanded ? <FolderOpen size={16} /> : <Folder size={16} />}
            <span className={styles.name}>{node.name}</span>
          </button>
        ) : (
          <button
            key={node.path}
            type="button"
            className={styles.row}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
            onClick={() => onFileClick(node)}
            onPointerEnter={() => onActivePathChange(node.path)}
            onFocus={() => onActivePathChange(node.path)}
            onBlur={() => onActivePathChange(null)}
            {...(node.rawUrl ? draggableFileProps({ url: node.rawUrl, name: node.name }) : undefined)}
          >
            <RowGuides {...row} hasChildren={false} />
            <MaterialFileIcon fileName={node.name} size={16} />
            <span className={styles.name}>{node.name}</span>
          </button>
        );
      })}
    </div>
  );
}
