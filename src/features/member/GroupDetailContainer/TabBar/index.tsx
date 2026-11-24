import { CSSProperties } from "react";
import { Columns3, LucideIcon } from "lucide-react";

import AppTooltip from "../../../../components/AppTooltip";
import { cn } from "../../../../util/cn";
import styles from "./style.module.css";

export type TabItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  placement?: "top" | "bottom";
  revealOnHover?: boolean;
};

type Props = {
  tabs: TabItem[];
  activeId: string | null;
  onChange: (id: string | null) => void;
  isMobile: boolean;
};

// 탭바의 치수(px). CSS에도 변수(--tab-*)로 전달해 한 곳에서 관리한다.
const TAB_SIZE = 56;
const TAB_GAP = 8;
const TAB_PADDING = 0;
const ICON_SIZE = 28;

export default function TabBar({ tabs, activeId, onChange, isMobile }: Props) {
  const rootStyle = {
    "--tab-size": `${TAB_SIZE}px`,
    "--tab-gap": `${TAB_GAP}px`,
    "--tab-padding": `${TAB_PADDING}px`,
  } as CSSProperties;

  return (
    <div
      role="tablist"
      aria-label="그룹 메뉴"
      aria-orientation={isMobile ? "horizontal" : "vertical"}
      className={styles.tabBar}
      style={rootStyle}
    >
      {isMobile && (
        <button
          type="button"
          role="tab"
          aria-selected={activeId === null}
          className={cn(styles.tab, styles.boardTab, activeId === null && styles.active)}
          onClick={() => onChange(null)}
        >
          <Columns3 size={ICON_SIZE} />
          <span className={styles.label}>보드</span>
        </button>
      )}
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeId;
        const Icon = tab.icon;
        const startsBottomGroup = tab.placement === "bottom" && tabs[index - 1]?.placement !== "bottom";

        return (
          <AppTooltip key={tab.id} content={tab.label}>
            <button
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={tab.label}
              className={cn(
                styles.tab,
                isActive && styles.active,
                startsBottomGroup && styles.bottomGroup,
                tab.revealOnHover && styles.revealOnHover,
              )}
              onClick={(event) => {
                onChange(tab.id);
                if (isMobile) event.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" });
              }}
            >
              <Icon size={ICON_SIZE} />
              {isMobile && <span className={styles.label}>{tab.label}</span>}
            </button>
          </AppTooltip>
        );
      })}
    </div>
  );
}
