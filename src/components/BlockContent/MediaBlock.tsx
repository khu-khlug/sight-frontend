import type { Node as TiptapNode } from "@tiptap/core";
import { DOMSerializer } from "@tiptap/pm/model";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent } from "react";

import styles from "./mediaBlock.module.css";

type Size = { width: number; height: number };
type Direction = "nw" | "ne" | "sw" | "se" | "n" | "e" | "s" | "w";
const corners: Direction[] = ["nw", "ne", "sw", "se"];
const edges: Direction[] = ["n", "e", "s", "w"];
const labels: Record<Direction, string> = { nw: "왼쪽 위", ne: "오른쪽 위", sw: "왼쪽 아래", se: "오른쪽 아래", n: "위", e: "오른쪽", s: "아래", w: "왼쪽" };
const positive = (value: unknown): number | null => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
};

function titleFromUrl(src: string, fallback: string): string {
  try {
    const url = new URL(src, window.location.href);
    if (url.protocol === "http:" || url.protocol === "https:") {
      const name = url.pathname.split("/").filter(Boolean).pop();
      if (name) return decodeURIComponent(name);
    }
  } catch { /* 이전 기록의 주소를 해석할 수 없으면 종류를 표시한다. */ }
  return fallback;
}

function MediaBlockView({ node, editor, updateAttributes }: NodeViewProps) {
  const kind = node.type.name;
  const isImage = kind === "image";
  const isAudio = kind === "audio";
  const isYoutube = kind === "youtube";
  const src = String(node.attrs.src ?? "");
  const title = node.attrs.title || (isYoutube ? "YouTube 동영상" : titleFromUrl(src, isAudio ? "오디오" : "동영상"));
  const blockRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [intrinsic, setIntrinsic] = useState<(Size & { src: string }) | null>(null);
  const natural = intrinsic?.src === src ? intrinsic : null;
  const [preview, setPreview] = useState<Size | null>(null);
  const gestureRef = useRef<{
    pointerId: number; x: number; y: number; size: Size; direction: Direction;
    maxWidth: number; coordinateScale: number; userSelect: string; cursor: string; latest: Size;
  } | null>(null);

  // 유튜브 URL 변환과 iframe 옵션은 기존 확장의 직렬화 규칙을 그대로 사용한다.
  const youtubeSrc = useMemo(() => {
    if (!isYoutube) return "";
    const dom = DOMSerializer.fromSchema(editor.schema).serializeNode(node);
    return dom instanceof HTMLElement ? dom.querySelector("iframe")?.getAttribute("src") ?? "" : "";
  }, [isYoutube, node, editor.schema]);

  const width = preview?.width ?? positive(node.attrs.width) ?? (isImage ? natural?.width : null);
  const height = preview?.height ?? positive(node.attrs.height);
  const ratio = width && height ? width / height
    : natural ? natural.width / natural.height : 16 / 9;

  const restorePointerStyles = () => {
    const gesture = gestureRef.current;
    if (!gesture) return;
    document.body.style.userSelect = gesture.userSelect;
    document.body.style.cursor = gesture.cursor;
    gestureRef.current = null;
  };

  useEffect(() => () => {
    const gesture = gestureRef.current;
    if (!gesture) return;
    document.body.style.userSelect = gesture.userSelect;
    document.body.style.cursor = gesture.cursor;
    gestureRef.current = null;
  }, []);

  const finishResize = (commit: boolean) => {
    const gesture = gestureRef.current;
    if (!gesture) return;
    if (commit && editor.isEditable && !editor.isDestroyed
      && (gesture.latest.width !== gesture.size.width || gesture.latest.height !== gesture.size.height)) {
      updateAttributes({ width: gesture.latest.width, height: gesture.latest.height });
    }
    restorePointerStyles();
    setPreview(null);
  };

  useEffect(() => {
    const cancel = () => { finishResize(false); };
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape" && gestureRef.current) { event.preventDefault(); cancel(); }
    };
    window.addEventListener("blur", cancel);
    document.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("blur", cancel);
      document.removeEventListener("keydown", escape);
    };
    // 취소할 때는 최신 gestureRef만 읽는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startResize = (event: PointerEvent<HTMLButtonElement>, direction: Direction) => {
    if (!editor.isEditable || event.button !== 0 || gestureRef.current || !frameRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    const frame = frameRef.current;
    const rect = frame.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const size = { width: frame.offsetWidth, height: frame.offsetHeight };
    gestureRef.current = {
      pointerId: event.pointerId, x: event.clientX, y: event.clientY, size, direction,
      maxWidth: Math.max(24, blockRef.current?.parentElement?.parentElement?.clientWidth ?? editor.view.dom.clientWidth),
      coordinateScale: size.width / rect.width,
      userSelect: document.body.style.userSelect, cursor: document.body.style.cursor, latest: size,
    };
    document.body.style.userSelect = "none";
    document.body.style.cursor = getComputedStyle(event.currentTarget).cursor;
    event.currentTarget.setPointerCapture(event.pointerId);
    setPreview(size);
  };

  const moveResize = (event: PointerEvent<HTMLButtonElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    const { size, direction, maxWidth, coordinateScale } = gesture;
    const dx = (event.clientX - gesture.x) * coordinateScale * (direction.includes("w") ? -1 : 1);
    const dy = (event.clientY - gesture.y) * coordinateScale * (direction.includes("n") ? -1 : 1);
    let scale: number;
    if (direction.length === 2) {
      // 꼭짓점 이동을 원래 대각선에 투영해 가로/세로 비율을 유지한다.
      scale = 1 + (dx * size.width + dy * size.height) / (size.width ** 2 + size.height ** 2);
    } else if (direction === "e" || direction === "w") {
      scale = (size.width + dx) / size.width;
    } else {
      scale = (size.height + dy) / size.height;
    }
    const minimum = Math.max(24 / size.width, 24 / size.height);
    const limited = Math.max(minimum, Math.min(maxWidth / size.width, scale));
    const next = { width: size.width * limited, height: size.height * limited };
    gesture.latest = next;
    setPreview(next);
  };

  const endResize = (event: PointerEvent<HTMLButtonElement>) => {
    if (gestureRef.current?.pointerId !== event.pointerId) return;
    event.stopPropagation();
    finishResize(event.type === "pointerup");
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const rememberImageSize = (image: HTMLImageElement) => {
    if (image.naturalWidth && image.naturalHeight) setIntrinsic({ src, width: image.naturalWidth, height: image.naturalHeight });
  };

  return (
    <NodeViewWrapper className={styles.block} data-media-block={kind} contentEditable={false}
      style={{ width: isAudio ? "100%" : width ? `${width}px` : "100%" }}>
      <div ref={blockRef} className={styles.mediaContainer}>
        {!isImage && <div className={styles.header} title={title}>{title}</div>}
        <div ref={frameRef} className={styles.frame} style={isAudio ? undefined : { aspectRatio: ratio }}>
          {isImage ? (
            <img className={styles.visual} src={src} alt={node.attrs.alt ?? ""} title={node.attrs.title ?? undefined}
              draggable={false} onLoad={(event) => rememberImageSize(event.currentTarget)} />
          ) : isAudio ? (
            <audio src={src} controls={node.attrs.controls !== false} preload={node.attrs.preload ?? "metadata"}
              autoPlay={node.attrs.autoplay === true} loop={node.attrs.loop === true} muted={node.attrs.muted === true} />
          ) : isYoutube ? (
            <iframe className={styles.visual} src={youtubeSrc} title={title} allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
          ) : (
            <video className={styles.visual} src={src} controls preload="metadata"
              onLoadedMetadata={(event) => {
                const video = event.currentTarget;
                if (video.videoWidth && video.videoHeight) setIntrinsic({ src, width: video.videoWidth, height: video.videoHeight });
              }} />
          )}
        </div>
        {editor.isEditable && !isAudio && [...corners, ...(isImage ? edges : [])].map((direction) => (
            <button key={direction} type="button" className={styles.handle} data-media-resize={direction}
              aria-label={`${labels[direction]} 크기 조절`}
              onPointerDown={(event) => startResize(event, direction)} onPointerMove={moveResize}
              onPointerUp={endResize} onPointerCancel={endResize} onLostPointerCapture={endResize} />
          ))}
      </div>
    </NodeViewWrapper>
  );
}

// 기본 HTML 형태와 명령은 유지하고, 제목/크기 속성과 공통 NodeView만 덧붙인다.
export function withMediaBlock<Options, Storage>(extension: TiptapNode<Options, Storage>) {
  return extension.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        title: { default: null },
        width: { default: null },
        height: { default: null },
      };
    },
    addNodeView() {
      return ReactNodeViewRenderer(MediaBlockView, {
        stopEvent: ({ event }) => event.target instanceof Element
          && event.target.closest("[data-media-resize], audio, video, iframe") !== null,
      });
    },
  });
}
