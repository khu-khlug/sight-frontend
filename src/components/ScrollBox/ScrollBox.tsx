import { Box, ScrollArea } from "@chakra-ui/react";
import { ReactNode } from "react";

import HoverScrollbar from "../HoverScrollbar";
import styles from "./style.module.css";

type Props = {
  children: ReactNode;
  className?: string;
  // Viewport의 padding을 CSS padding 단축 속성과 같은 순서(상/우/하/좌)로 각각 지정한다.
  gutter?: [top: number, right: number, bottom: number, left: number];
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "hover" | "always";
  bg?: string;
  // 사용처별 스크롤바 위치 보정(예: 둥근 모서리 쪽 여백)이 필요할 때만 쓴다. 두 스크롤바는
  // 축마다 보정 방향이 달라서(세로는 bottom, 가로는 insetInlineStart/End) 따로 받는다.
  verticalScrollbarClassName?: string;
  horizontalScrollbarClassName?: string;
  // "scroll"(기본)이면 가로로 넘치는 콘텐츠를 가로 스크롤로 보여준다(가로 스크롤바 있음).
  // "wrap"이면 가로 스크롤을 아예 막는다(overflowX: hidden, 가로 스크롤바 없음) — 콘텐츠
  // 자신이 줄바꿈되게 CSS(width:100%, white-space:normal 등)를 맞추는 건 쓰는 쪽 책임이다.
  horizontalMode?: "scroll" | "wrap";
};

/*
 * 가로+세로 둘 다 스크롤하는 영역의 표준 구조 — VerticalScrollBox와 동일한 뼈대에서
 * 가로 스크롤 금지(overflowX: hidden)만 빼고 가로 스크롤바를 추가한 버전이다. 콘텐츠박스에
 * 폭/높이를 강제하지 않아야 내용이 두 방향 모두 뷰포트보다 커질 수 있다(그래야 스크롤이
 * 생긴다). 특정 축으로 콘텐츠가 뷰포트보다 작으면 그 축 스크롤바는 zag-js 기본 동작
 * (data-overflow-* 없을 때 scrollbar를 display:none)으로 알아서 숨는다. horizontalMode로
 * 가로 스크롤 자체를 켜고 끌 수 있다 — DOM/스크롤 상태를 유지한 채 prop만 바뀌므로 토글
 * 시 리마운트로 인한 스크롤 위치 리셋이 없다.
 */
export default function ScrollBox({ children, className, gutter = [0, 0, 0, 0], size = "sm", variant = "hover", bg, verticalScrollbarClassName, horizontalScrollbarClassName, horizontalMode = "scroll" }: Props) {
  const [gutterTop, gutterRight, gutterBottom, gutterLeft] = gutter;
  return (
    <ScrollArea.Root className={styles.root} size={size} variant={variant} bg={bg}>
      {/* w="auto"는 실제 브라우저에서 Viewport가 Root의 진짜 전체 폭을 못 잡는 문제가 있다
          (VerticalScrollBox에서 먼저 확인됨) — w="100%" + padding(margin 대신)으로 줘야
          wrap 모드에서 안쪽 콘텐츠의 width:100%가 진짜 뷰포트 폭 기준으로 계산된다. */}
      <ScrollArea.Viewport
        h="100%"
        w="100%"
        style={{ padding: `${gutterTop}px ${gutterRight}px ${gutterBottom}px ${gutterLeft}px`, overflowX: horizontalMode === "wrap" ? "hidden" : undefined }}
      >
        <ScrollArea.Content
          className={styles.bothContent}
          style={{ minWidth: 0 }}
        >
          <Box className={className ? `${styles.bothContentBox} ${className}` : styles.bothContentBox}>
            {children}
          </Box>
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <HoverScrollbar orientation="vertical" className={verticalScrollbarClassName} />
      {horizontalMode === "scroll" && <HoverScrollbar orientation="horizontal" className={horizontalScrollbarClassName} />}
    </ScrollArea.Root>
  );
}
