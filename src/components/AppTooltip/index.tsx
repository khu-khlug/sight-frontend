import { Portal, Tooltip } from "@chakra-ui/react";
import { TriangleAlert } from "lucide-react";
import type { ReactElement, ReactNode } from "react";

import { cn } from "../../util/cn";
import styles from "./style.module.css";

type Placement = "top" | "right" | "bottom" | "left";

type Props = {
  content: ReactNode;
  children: ReactElement;
  placement?: Placement;
  variant?: "default" | "error";
  openDelay?: number;
  // 지정하면 호버 대신 호출부가 열림 상태를 직접 제어한다(예: 클릭으로 띄우기). 지정하지
  // 않으면 기존처럼 호버로만 뜬다.
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

// 호버로 뜰 때까지의 지연 — 열림을 직접 제어하는 호출부도 같은 지연을 쓰도록 내보낸다.
export const TOOLTIP_OPEN_DELAY_MS = 350;

// 브라우저 기본 title 툴팁 대신 화면 전체에서 같은 모양과 지연 시간을 사용한다.
export default function AppTooltip({ content, children, placement = "right", variant = "default", openDelay = TOOLTIP_OPEN_DELAY_MS, open, onOpenChange }: Props) {
  return (
    <Tooltip.Root
      openDelay={openDelay}
      closeDelay={100}
      positioning={{ placement, gutter: 8 }}
      open={open}
      onOpenChange={onOpenChange ? (details) => onOpenChange(details.open) : undefined}
    >
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Portal>
        <Tooltip.Positioner>
          <Tooltip.Content className={cn(styles.content, variant === "error" ? styles.errorContent : undefined)}>
            {variant === "error" && <TriangleAlert size={14} className={styles.errorIcon} aria-hidden="true" />}
            <span>{content}</span>
          </Tooltip.Content>
        </Tooltip.Positioner>
      </Portal>
    </Tooltip.Root>
  );
}
