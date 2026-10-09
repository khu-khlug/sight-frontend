import { createContext, useContext, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import styles from "./style.module.css";

const WindowResizingContext = createContext(false);

// 슬롯의 폭·높이 전환만 추적한다. 사용자가 직접 드래그하는 동안에는 내용을 표시한다.
export function SkeletonResizeBoundary({ children }: { children: ReactNode }) {
  const boundaryRef = useRef<HTMLDivElement>(null);
  const [resizing, setResizing] = useState(false);

  useLayoutEffect(() => {
    const element = boundaryRef.current;
    if (!element) return;
    const layer = element.closest<HTMLElement>("[data-window-layer]");
    const transitions = new Map<EventTarget, Set<string>>();
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setResizing(layer?.dataset.resizing !== "true" && transitions.size > 0);
      });
    };
    const relevant = (event: TransitionEvent) => event.target instanceof HTMLElement
      && event.target !== element && event.target.contains(element)
      && (["width", "height"].includes(event.propertyName) || (event.target === layer && event.propertyName === "left"));
    const start = (event: TransitionEvent) => {
      if (!relevant(event) || !event.target) return;
      const properties = transitions.get(event.target) ?? new Set<string>();
      properties.add(event.propertyName);
      transitions.set(event.target, properties);
      cancelAnimationFrame(frame);
      setResizing(layer?.dataset.resizing !== "true");
    };
    const end = (event: TransitionEvent) => {
      if (!relevant(event) || !event.target) return;
      const properties = transitions.get(event.target);
      properties?.delete(event.propertyName);
      if (!properties?.size) transitions.delete(event.target);
      update();
    };
    const observer = new MutationObserver(() => {
      if (layer?.dataset.resizing === "true") {
        cancelAnimationFrame(frame);
        setResizing(false);
      }
      else update();
    });
    if (layer) observer.observe(layer, { attributes: true, attributeFilter: ["data-resizing"] });
    document.addEventListener("transitionrun", start, true);
    document.addEventListener("transitionend", end, true);
    document.addEventListener("transitioncancel", end, true);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      document.removeEventListener("transitionrun", start, true);
      document.removeEventListener("transitionend", end, true);
      document.removeEventListener("transitioncancel", end, true);
    };
  }, []);

  return (
    <WindowResizingContext.Provider value={resizing}>
      <div ref={boundaryRef} className={styles.boundary}>{children}</div>
    </WindowResizingContext.Provider>
  );
}

type Props = HTMLAttributes<HTMLDivElement> & {
  // 생략하면 소속 창의 크기 변경 상태를 따른다.
  active?: boolean;
};

type SlotLayout = {
  height: number;
  position: CSSProperties["position"];
  contentStyle: CSSProperties;
};

export default function SkeletonWrapper({ children, active, className, style, ...props }: Props) {
  const windowResizing = useContext(WindowResizingContext);
  const showSkeleton = active ?? windowResizing;
  const ref = useRef<HTMLDivElement>(null);
  const layout = useRef<SlotLayout | null>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || showSkeleton) return;
    const measure = () => {
      if (!element.offsetWidth || !element.offsetHeight) return;
      const computed = getComputedStyle(element);
      const horizontalPadding = parseFloat(computed.paddingLeft) + parseFloat(computed.paddingRight);
      const verticalPadding = parseFloat(computed.paddingTop) + parseFloat(computed.paddingBottom);
      layout.current = {
        height: element.offsetHeight,
        position: computed.position === "static" ? "relative" : computed.position as CSSProperties["position"],
        contentStyle: {
          width: element.clientWidth - horizontalPadding,
          height: element.clientHeight - verticalPadding,
          left: computed.paddingLeft,
          top: computed.paddingTop,
          display: computed.display,
          flexDirection: computed.flexDirection as CSSProperties["flexDirection"],
          flexWrap: computed.flexWrap as CSSProperties["flexWrap"],
          alignItems: computed.alignItems,
          justifyContent: computed.justifyContent,
          gap: computed.gap,
          gridTemplateColumns: computed.gridTemplateColumns,
          gridTemplateRows: computed.gridTemplateRows,
        },
      };
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [showSkeleton]);

  return (
    <div
      {...props}
      ref={ref}
      className={`${className ?? ""} ${showSkeleton ? styles.active : ""}`}
      style={showSkeleton && layout.current ? {
        ...style,
        position: layout.current.position,
        height: layout.current.height,
        boxSizing: "border-box",
      } : style}
    >
      <div
        className={styles.slot}
        aria-hidden={showSkeleton || undefined}
        style={showSkeleton ? layout.current?.contentStyle : undefined}
      >
        {children}
      </div>
    </div>
  );
}
