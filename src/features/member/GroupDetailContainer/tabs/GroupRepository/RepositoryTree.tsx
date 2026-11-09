import { Text } from "@chakra-ui/react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";

import type { RepoTreeEntry } from "../../../../../api/public/group/GroupRepositoryApi";
import FileTree from "./FileTree";
import { buildFileTree, visibleFileTreeRows, type FileTreeNode } from "./buildFileTree";
import styles from "./style.module.css";

export type RepositoryScrollMetrics = {
  viewportWidth: number;
  scrollWidth: number;
  scrollLeft: number;
};

type Props = {
  entries: RepoTreeEntry[];
  viewportRef: RefObject<HTMLDivElement>;
  viewportId: string;
  onScrollMetricsChange: (metrics: RepositoryScrollMetrics) => void;
  onFileClick: (node: FileTreeNode) => void;
};

// 강조 표시와 파일 행은 펼침 상태와 현재 경로 상태를 공유한다.
export default function RepositoryTree({ entries, viewportRef, viewportId, onScrollMetricsChange, onFileClick }: Props) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => new Set());
  const [activePath, setActivePath] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const nodes = useMemo(() => buildFileTree(entries), [entries]);
  const rows = useMemo(() => visibleFileTreeRows(nodes, expandedPaths), [nodes, expandedPaths]);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;

    const updateDimensions = () => {
      onScrollMetricsChange({
        viewportWidth: viewport.clientWidth,
        scrollWidth: viewport.scrollWidth,
        scrollLeft: viewport.scrollLeft,
      });
    };
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(viewport);
    observer.observe(content);
    updateDimensions();
    return () => {
      observer.disconnect();
      onScrollMetricsChange({ viewportWidth: 0, scrollWidth: 0, scrollLeft: 0 });
    };
  }, [onScrollMetricsChange, viewportRef]);

  function toggleFolder(path: string) {
    setExpandedPaths((previous) => {
      const next = new Set(previous);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
    setActivePath(path);
  }

  if (rows.length === 0) {
    return <Text fontSize="sm" color="gray.500" mt={4}>파일이 없습니다.</Text>;
  }

  return (
    <div className={styles.treeRegion}>
      <div className={styles.highlightLayer} aria-hidden="true">
        {rows.map(({ node }) => (
          <div key={node.path} className={styles.highlightRow} data-active={activePath === node.path} />
        ))}
      </div>
      <div
        id={viewportId}
        ref={viewportRef}
        className={styles.horizontalViewport}
        onScroll={(event) => {
          const viewport = event.currentTarget;
          onScrollMetricsChange({
            viewportWidth: viewport.clientWidth,
            scrollWidth: viewport.scrollWidth,
            scrollLeft: viewport.scrollLeft,
          });
        }}
      >
        <div ref={contentRef} className={styles.treeContent}>
          <FileTree
            rows={rows}
            expandedPaths={expandedPaths}
            onToggle={toggleFolder}
            onActivePathChange={setActivePath}
            onFileClick={onFileClick}
          />
        </div>
      </div>
    </div>
  );
}
