import { DragEvent, useState } from "react";

export type DropPayload = { kind: "file"; file: File } | { kind: "url"; url: string };

/*
 * "dropable" 같은 HTML 속성은 없다 — draggable과 달리 브라우저가 구현해둔 네이티브 동작이
 * 아니라서, 속성만 붙여서는 아무 일도 안 일어난다. 대신 이 훅이 그 자리를 대신한다 — 반환하는
 * dropTargetProps를 스프레드하기만 하면 어떤 박스든 드롭 타겟이 된다.
 *
 * 받는 값은 실제 OS 파일(event.dataTransfer.files)이 있으면 그걸 우선하고, 없으면
 * text/uri-list(없으면 text/plain)를 본다 — <a>/<img>처럼 기본 draggable인 요소나
 * draggableFileProps(../../util/draggableFile)를 붙인 요소를 드래그해서 놓으면 실제
 * 파일 바이트 없이 URL만 넘어오기 때문이다.
 */
export function useDropTarget(onDrop: (payload: DropPayload) => void) {
  const [isDragOver, setIsDragOver] = useState(false);

  return {
    isDragOver,
    dropTargetProps: {
      onDragOver: (event: DragEvent) => {
        event.preventDefault();
        setIsDragOver(true);
      },
      onDragLeave: () => setIsDragOver(false),
      onDrop: (event: DragEvent) => {
        event.preventDefault();
        setIsDragOver(false);
        const file = event.dataTransfer.files?.[0];
        if (file) {
          onDrop({ kind: "file", file });
          return;
        }
        const url = event.dataTransfer.getData("text/uri-list") || event.dataTransfer.getData("text/plain");
        if (url) onDrop({ kind: "url", url });
      },
    },
  };
}
