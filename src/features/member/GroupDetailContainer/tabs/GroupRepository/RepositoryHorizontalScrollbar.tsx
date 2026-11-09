import { useLayoutEffect, useRef, useState } from "react";

import styles from "./RepositoryHorizontalScrollbar.module.css";

type Props = {
  viewportId: string;
  viewportWidth: number;
  scrollWidth: number;
  scrollLeft: number;
  onScrollTo: (left: number) => void;
};

// Dashboard의 직접 자식이다. 스크롤 위치는 부모가 파일 트리 뷰포트와 연결한다.
export default function RepositoryHorizontalScrollbar({
  viewportId,
  viewportWidth,
  scrollWidth,
  scrollLeft,
  onScrollTo,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef(0);
  const dragging = useRef(false);
  const [trackWidth, setTrackWidth] = useState(0);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const updateWidth = () => setTrackWidth(track.getBoundingClientRect().width);
    const observer = new ResizeObserver(updateWidth);
    observer.observe(track);
    updateWidth();
    return () => observer.disconnect();
  }, [scrollWidth > viewportWidth]);

  const maxScroll = Math.max(0, scrollWidth - viewportWidth);
  if (maxScroll === 0) return null;

  const thumbWidth = Math.min(trackWidth, Math.max(20, trackWidth * viewportWidth / scrollWidth));
  const maxThumbLeft = Math.max(0, trackWidth - thumbWidth);
  const thumbLeft = maxScroll > 0 ? scrollLeft / maxScroll * maxThumbLeft : 0;

  function scrollToPointer(clientX: number) {
    const track = trackRef.current;
    if (!track || maxThumbLeft === 0) return;
    const left = Math.max(0, Math.min(maxThumbLeft, clientX - track.getBoundingClientRect().left - dragOffset.current));
    onScrollTo(left / maxThumbLeft * maxScroll);
  }

  return (
    <div
      ref={trackRef}
      className={styles.track}
      role="scrollbar"
      tabIndex={0}
      aria-label="파일 트리 가로 스크롤"
      aria-orientation="horizontal"
      aria-controls={viewportId}
      aria-valuemin={0}
      aria-valuemax={maxScroll}
      aria-valuenow={Math.min(scrollLeft, maxScroll)}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        dragOffset.current = thumbRef.current?.contains(event.target as Node)
          ? event.clientX - thumbRef.current.getBoundingClientRect().left
          : thumbWidth / 2;
        dragging.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        scrollToPointer(event.clientX);
      }}
      onPointerMove={(event) => {
        if (dragging.current) scrollToPointer(event.clientX);
      }}
      onPointerUp={(event) => {
        dragging.current = false;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }}
      onPointerCancel={() => { dragging.current = false; }}
      onWheel={(event) => {
        event.preventDefault();
        onScrollTo(scrollLeft + (Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY));
      }}
      onKeyDown={(event) => {
        const step = event.key === "ArrowLeft" ? -40
          : event.key === "ArrowRight" ? 40
          : event.key === "PageUp" ? -viewportWidth
          : event.key === "PageDown" ? viewportWidth
          : event.key === "Home" ? -scrollWidth
          : event.key === "End" ? scrollWidth : null;
        if (step !== null) {
          event.preventDefault();
          onScrollTo(scrollLeft + step);
        }
      }}
    >
      <div
        ref={thumbRef}
        className={styles.thumb}
        style={{ width: thumbWidth, transform: `translateX(${thumbLeft}px)` }}
      />
    </div>
  );
}
