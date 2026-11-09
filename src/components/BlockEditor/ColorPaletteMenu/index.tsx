import { Popover, Portal } from "@chakra-ui/react";
import { PaintBucket, Palette } from "lucide-react";
import { useState } from "react";

import { system } from "../../../theme";
import { cn } from "../../../util/cn";
import AppTooltip from "../../AppTooltip";
import toolbarStyles from "../style.module.css";
import styles from "./style.module.css";

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
const FAMILIES = [
  ["brand", "브랜드"],
  ["red", "빨강"],
  ["orange", "주황"],
  ["yellow", "노랑"],
  ["green", "초록"],
  ["teal", "청록"],
  ["blue", "파랑"],
  ["cyan", "하늘"],
  ["purple", "보라"],
  ["pink", "분홍"],
  ["gray", "회색"],
  ["blackAlpha", "검정α"],
  ["whiteAlpha", "흰색α"],
] as const;

type Props = {
  kind: "text" | "background";
  currentColor?: string;
  recentColors: string[];
  onOpenChange?: (open: boolean) => void;
  onSelect: (color: string) => void;
  onClear: () => void;
};

export default function ColorPaletteMenu({ kind, currentColor, recentColors, onOpenChange, onSelect, onClear }: Props) {
  const [open, setOpen] = useState(false);
  const [triggerHovered, setTriggerHovered] = useState(false);
  const label = kind === "text" ? "글자색" : "배경색";
  const Icon = kind === "text" ? Palette : PaintBucket;

  return (
    <Popover.Root open={open} onOpenChange={(details) => { setOpen(details.open); onOpenChange?.(details.open); }} autoFocus={false} lazyMount unmountOnExit positioning={{ placement: "bottom-start" }}>
      <AppTooltip content={label} placement="top">
        <span className={styles.colorPaletteTooltipAnchor}>
          <Popover.Trigger asChild>
            <button type="button" className={toolbarStyles.toolbarButton} aria-label={label}
              onPointerEnter={() => setTriggerHovered(true)} onPointerLeave={() => setTriggerHovered(false)}>
              <Icon size={16} />
            </button>
          </Popover.Trigger>
        </span>
      </AppTooltip>
      <Portal>
        <Popover.Positioner>
          <Popover.Content className={cn(styles.colorPaletteContent, triggerHovered && styles.colorPaletteTriggerHovered)} aria-label={`${label} 팔레트`}>
            <div className={styles.colorPaletteBody}>
              <div className={styles.colorPaletteActions}>
                <button type="button" className={styles.colorPaletteClear} onClick={onClear}>
                  초기화
                </button>
                {(["black", "white"] as const).map((name) => {
                  const color = system.token(`colors.${name}`);
                  return (
                    <button
                      key={name}
                      type="button"
                      className={styles.colorPaletteSwatch}
                      style={{ backgroundColor: color }}
                      aria-label={name === "black" ? "검정" : "흰색"}
                      aria-pressed={currentColor === color}
                      onClick={() => onSelect(color)}
                    />
                  );
                })}
                <div className={styles.colorPaletteRecent} role="group" aria-label="최근 사용한 색">
                  {Array.from({ length: 9 }, (_, index) => {
                    const color = recentColors[index];
                    return color ? (
                      <button
                        key={color}
                        type="button"
                        className={styles.colorPaletteSwatch}
                        style={{
                          backgroundImage: `linear-gradient(${color}, ${color}), repeating-conic-gradient(#e4e4e7 0% 25%, white 0% 50%)`,
                          backgroundSize: "auto, 8px 8px",
                        }}
                        aria-label={`최근 사용한 색 ${index + 1}: ${color}`}
                        title={color}
                        aria-pressed={currentColor === color}
                        onClick={() => onSelect(color)}
                      />
                    ) : <span key={`empty-${index}`} className={styles.colorPaletteRecentEmpty} aria-hidden="true" />;
                  })}
                </div>
              </div>
              <div className={styles.colorPaletteGrid}>
                <span aria-hidden="true" />
                {SHADES.map((shade) => <span key={shade} className={styles.colorPaletteShadeLabel}>{shade}</span>)}
                {FAMILIES.map(([family, familyLabel]) => (
                  <div key={family} className={styles.colorPaletteRow}>
                    <span className={styles.colorPaletteFamilyLabel}>{familyLabel}</span>
                    {SHADES.map((shade) => {
                      const color = system.token(`colors.${family}.${shade}`);
                      return color ? (
                        <button
                          key={shade}
                          type="button"
                          className={styles.colorPaletteSwatch}
                          style={family.endsWith("Alpha")
                            ? {
                              backgroundImage: `linear-gradient(${color}, ${color}), repeating-conic-gradient(#e4e4e7 0% 25%, white 0% 50%)`,
                              backgroundSize: "auto, 8px 8px",
                            }
                            : { backgroundColor: color }}
                          aria-label={`${familyLabel} ${shade}`}
                          aria-pressed={currentColor === color}
                          onClick={() => onSelect(color)}
                        />
                      ) : <span key={shade} aria-hidden="true" />;
                    })}
                  </div>
                ))}
              </div>
            </div>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
