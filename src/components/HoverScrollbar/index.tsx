import { ScrollArea } from "@chakra-ui/react";

import { cn } from "../../util/cn";
import styles from "./style.module.css";

type Props = {
  orientation?: "vertical" | "horizontal";
  className?: string;
};

/*
 * Chakra ScrollArea 기본은 스크롤 영역 아무 곳에나 커서가 있으면 스크롤바가 보인다.
 * 여기서는 스크롤바 자신 위에 커서가 있을 때만(순수 CSS :hover) 보이게 그 규칙을
 * 덮어쓴다 — 대시보드(정보/멤버/아카이브/활동로그 탭)와 채팅 탭이 같은 모양을 쓰도록
 * 공용 컴포넌트로 뺐다. orientation="horizontal"은 KanbanBoard의 가로 스크롤바와 같은
 * 용도(가로 스크롤이 필요한 영역)로 쓴다 — insetInlineEnd 보정은 세로 스크롤바에만 필요하다.
 * className은 둥근 모서리 등 사용처별 예외 보정(예: 스크롤바 끝쪽 inset 추가)에만 쓴다.
 */
export default function HoverScrollbar({ orientation = "vertical", className}: Props) {
  return (
    <ScrollArea.Scrollbar
      orientation={orientation}
      className={cn(styles.scrollbar, className)}
      style={orientation === "vertical" ? { insetInlineEnd: "1.5px" } : undefined}
    />
  );
}
