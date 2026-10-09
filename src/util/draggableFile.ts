import { DragEvent } from "react";

// 앱 안의 파일 요소(저장소 파일, 활동보고서, 채팅 첨부 등)를 끌 때 함께 싣는 전용 형식이다.
const SIGHT_FILE_DRAG_TYPE = "application/x-sight-file";

export type DraggedFile = { url: string; name: string; size?: number; contentType?: string };

// dragover에서는 실제 파일/메타데이터를 읽을 수 없으므로 제공된 형식으로 판정한다.
export function hasFileDrag(dataTransfer: DataTransfer): boolean {
  return Array.from(dataTransfer.types).some((type) => type === "Files" || type === SIGHT_FILE_DRAG_TYPE);
}

/*
 * 파일 요소를 드래그 가능하게 만든다. 전용 형식에 파일명·용량 등 메타데이터를 싣고, 기존처럼
 * text/uri-list·text/plain에도 URL을 채워서 URL만 받는 곳(useDropTarget, 외부 앱)도 그대로 동작한다.
 * 기록 편집기(BlockEditor)는 readDraggedFile로 전용 형식을 먼저 읽는다.
 */
export function draggableFileProps(file: DraggedFile) {
  return {
    draggable: true,
    onDragStart: (event: DragEvent) => {
      event.dataTransfer.setData(SIGHT_FILE_DRAG_TYPE, JSON.stringify(file));
      event.dataTransfer.setData("text/uri-list", file.url);
      event.dataTransfer.setData("text/plain", file.url);
    },
  };
}

export function readDraggedFile(dataTransfer: DataTransfer | null): DraggedFile | null {
  const raw = dataTransfer?.getData(SIGHT_FILE_DRAG_TYPE);
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return null;
    const item = value as Partial<DraggedFile>;
    if (typeof item.url !== "string" || typeof item.name !== "string") return null;
    return {
      url: item.url,
      name: item.name,
      size: typeof item.size === "number" ? item.size : undefined,
      contentType: typeof item.contentType === "string" ? item.contentType : undefined,
    };
  } catch {
    return null;
  }
}
