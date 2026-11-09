import { ScrollArea } from "@chakra-ui/react";
import { ReactNode } from "react";

import HoverScrollbar from "../HoverScrollbar";
import styles from "./style.module.css";

type Props = {
  children: ReactNode;
  className?: string;
  // 콘텐츠 상단 패딩이자 하단 마진 값(px).
  gutter?: number;
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "hover" | "always";
  bg?: string;
  // 사용처별 스크롤바 위치 보정(예: 둥근 모서리 쪽 여백)이 필요할 때만 쓴다.
  scrollbarClassName?: string;
};

/*
 * 가로 스크롤만 필요한 영역의 표준 구조 — 스크롤박스(위쪽 패딩)·컨텐츠박스(아래쪽 마진)·
 * 스크롤바 세 겹. 컨텐츠박스에 폭을 강제하지 않아야 내용이 뷰포트보다 넓어질 수 있다(그래야
 * 가로 스크롤이 생긴다).
 */
export default function HorizontalScrollBox({ children, className, gutter = 0, size = "sm", variant = "hover", bg, scrollbarClassName }: Props) {
  return (
    <ScrollArea.Root className={styles.root} size={size} variant={variant} bg={bg}>
      <ScrollArea.Viewport h="100%" style={{ overflowY: "hidden" }}>
        <ScrollArea.Content
          className={styles.horizontalContent}
          style={{ paddingTop: gutter, paddingLeft: gutter, paddingRight: gutter }}
        >
          <div className={className} style={{ marginBottom: gutter }}>
            {children}
          </div>
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <HoverScrollbar orientation="horizontal" className={scrollbarClassName} />
    </ScrollArea.Root>
  );
}
