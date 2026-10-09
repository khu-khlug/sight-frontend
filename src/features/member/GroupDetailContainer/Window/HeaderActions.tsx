import { Box } from "@chakra-ui/react";
import { ArrowRightLeft, ChevronLeft, ChevronRight, Square } from "lucide-react";
import { MouseEvent } from "react";

import AppTooltip from "../../../../components/AppTooltip";
import { cn } from "../../../../util/cn";
import styles from "./style.module.css";

const stop = (event: MouseEvent) => event.stopPropagation();

/*
 * 싱글 모드 창의 좌/우 버튼 — 듀얼로 진입시킨다(knowledge/frontend/card-window-manager.md §5).
 * canGoDual이 false면(가용 영역이 정사각형보다 좁음) 아예 보이지 않는다 — 좁을 땐 분할 모드
 * 자체를 쓸 수 없으니 버튼도 둘 필요가 없다. 방향을 그대로 보내면 WindowLayer가 해당 쪽을
 * 0.51 비율의 메인으로 정하고 듀얼 상태로 전환한다.
 */
export function SingleWindowActions({ onSendToSide, canGoDual }: { onSendToSide: (side: "left" | "right") => void; canGoDual: boolean }) {
  if (!canGoDual) return null;
  const handleClick = (side: "left" | "right") => (event: MouseEvent) => {
    stop(event);
    onSendToSide(side);
  };
  return (
    <Box className={styles.navGroup}>
      <AppTooltip content="왼쪽으로 보내기" placement="top">
        <Box
          as="button"
          className={cn(styles.iconSlot, styles.navSlot)}
          aria-label="왼쪽으로 보내기"
          onClick={handleClick("left")}
        >
          <span className={styles.iconCircle}><ChevronLeft size={18} /></span>
        </Box>
      </AppTooltip>
      <AppTooltip content="오른쪽으로 보내기" placement="top">
        <Box
          as="button"
          className={cn(styles.iconSlot, styles.navSlot)}
          aria-label="오른쪽으로 보내기"
          onClick={handleClick("right")}
        >
          <span className={styles.iconCircle}><ChevronRight size={18} /></span>
        </Box>
      </AppTooltip>
    </Box>
  );
}

/*
 * 듀얼 모드 메인창의 버튼 — 펼치기(싱글로 복귀)와 좌우 창 교환. 좌측 창은 [펼치기, 교환],
 * 우측 창은 [교환, 펼치기] 순서로 거울상 배치한다(§5).
 */
export function DualWindowActions({ side, otherSideEmpty = false, onExpand, onSwitchSide }: { side: "left" | "right"; otherSideEmpty?: boolean; onExpand: () => void; onSwitchSide: () => void }) {
  const switchLabel = otherSideEmpty ? (side === "left" ? "오른쪽으로 보내기" : "왼쪽으로 보내기") : "좌우 창 교환";
  const expandButton = (
    <AppTooltip content="펼치기" placement="top">
      <Box
        as="button"
        className={cn(styles.iconSlot, styles.expandSlot)}
        aria-label="펼치기"
        onClick={(event) => { stop(event); onExpand(); }}
      >
        <span className={styles.iconCircle}><Square size={16} /></span>
      </Box>
    </AppTooltip>
  );
  const switchButton = (
    <AppTooltip content={switchLabel} placement="top">
      <Box
        as="button"
        className={cn(styles.iconSlot, styles.navSlot)}
        aria-label={switchLabel}
        onClick={(event) => { stop(event); onSwitchSide(); }}
      >
        <span className={styles.iconCircle}>{otherSideEmpty
          ? (side === "left" ? <ChevronRight size={18} /> : <ChevronLeft size={18} />)
          : <ArrowRightLeft size={18} />}</span>
      </Box>
    </AppTooltip>
  );
  return side === "left" ? <>{expandButton}{switchButton}</> : <>{switchButton}{expandButton}</>;
}
