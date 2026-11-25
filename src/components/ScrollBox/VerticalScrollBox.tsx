import { Box, ScrollArea } from "@chakra-ui/react";
import { ReactNode } from "react";

import HoverScrollbar from "../HoverScrollbar";
import styles from "./style.module.css";

type Props = {
  children: ReactNode;
  className?: string;
  // Viewport 네 방향에 균일하게 들어가는 padding 값(px) — 이 값만 정하면 콘텐츠가 전체
  // 박스 안에서 사방으로 같은 여백을 두고, 스크롤바는 그와 무관하게 테두리에 붙는다.
  gutter?: number;
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "hover" | "always";
  bg?: string;
  // 사용처별 스크롤바 위치 보정(예: 둥근 모서리 쪽 여백)이 필요할 때만 쓴다.
  scrollbarClassName?: string;
};

/*
 * 세로 스크롤만 필요한 영역의 표준 구조 — Viewport(gutter만큼 padding)·컨텐츠박스·스크롤바
 * 세 겹으로 고정한다. 쓰는 쪽은 gutter 하나만 정하면 된다(0이면 패딩 없음).
 *
 * gutter는 Viewport의 margin이 아니라 padding으로 준다 — overflow-x:hidden은 Viewport
 * 자신의 padding-box 경계에서 클리핑하는데, margin은 그 경계 바깥(Root와 Viewport 사이)이라
 * 안쪽 콘텐츠가 음수 마진으로 그 margin 영역까지 번지려 해도(예: 카드 커버이미지 풀블리드)
 * 이미 클리핑 경계를 넘은 뒤라 무조건 잘린다. padding은 클리핑 기준 박스 안쪽이라, 음수
 * 마진으로 그 padding 영역까지만 번지면 클리핑 경계를 넘지 않아 잘리지 않는다. 또한 gutter
 * 값을 --scrollbox-gutter로 노출해서, 풀블리드가 필요한 자식이 고정 px를 하드코딩하는 대신
 * `calc(var(--scrollbox-gutter) * -1)` 같은 식으로 실제 값을 그대로 가져다 쓸 수 있게 한다.
 */
export default function VerticalScrollBox({ children, className, gutter = 0, size = "sm", variant = "hover", bg, scrollbarClassName }: Props) {
  return (
    <ScrollArea.Root className={styles.root} size={size} variant={variant} bg={bg}>
      <ScrollArea.Viewport
        h="100%"
        w="100%"
        style={{ padding: gutter, overflowX: "hidden", ["--scrollbox-gutter" as string]: `${gutter}px` }}
      >
        <ScrollArea.Content
          className={styles.verticalContent}
          style={{ minWidth: 0}}
        >
          <Box className={className ? `${styles.verticalContentBox} ${className}` : styles.verticalContentBox}>
            {children}
          </Box>
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <HoverScrollbar orientation="vertical" className={scrollbarClassName}/>
    </ScrollArea.Root>
  );
}
