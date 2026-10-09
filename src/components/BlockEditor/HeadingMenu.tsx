import { Box, Popover, Portal } from "@chakra-ui/react";
import { ChevronDown, Heading as HeadingIcon } from "lucide-react";
import { useState } from "react";

import { cn } from "../../util/cn";
import contentStyles from "../BlockContent/style.module.css";
import { readElementStyle } from "./styleDebug";
import styles from "./style.module.css";

const LEVELS = [1, 2, 3, 4, 5, 6] as const;

// 본문과 같은 Chakra 타이포그래피를 사용하며 H1은 4xl과 브랜드 색을 공유한다.
const HEADING_PREVIEW_CLASS: Record<number, string> = {
  1: contentStyles.headingLevel1,
  2: contentStyles.headingLevel2,
  3: contentStyles.headingLevel3,
  4: contentStyles.headingLevel4,
  5: contentStyles.headingLevel5,
  6: contentStyles.headingLevel6,
};

type Props = {
  level: number | undefined;
  onSelect: (level: number | null) => void;
};

export default function HeadingMenu({ level, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Popover.Root open={open} onOpenChange={(details) => setOpen(details.open)} lazyMount unmountOnExit positioning={{ placement: "bottom-start" }}>
      <Popover.Trigger asChild>
        <Box
          as="button"
          className={cn(styles.toolbarButton, styles.headingMenuTrigger, level ? styles.toolbarButtonActive : undefined)}
          aria-label="제목"
          aria-expanded={open}
          title="제목"
        >
          <HeadingIcon size={16} />
          <ChevronDown size={10} />
        </Box>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content className={cn(styles.headingMenuContent, contentStyles.document)}>
            <Box
              as="button"
              className={cn(styles.headingMenuOption, !level ? styles.headingMenuOptionActive : undefined)}
              aria-current={!level ? "true" : undefined}
              onClick={() => { onSelect(null); setOpen(false); }}
            >
              본문
            </Box>
            {LEVELS.map((lvl) => (
              <Box
                key={lvl}
                as="button"
                className={cn(styles.headingMenuOption, HEADING_PREVIEW_CLASS[lvl], level === lvl ? styles.headingMenuOptionActive : undefined)}
                aria-current={level === lvl ? "true" : undefined}
                onClick={(event) => {
                  console.log("[BlockEditor style] heading-preview", JSON.stringify({ level: lvl, ...readElementStyle(event.currentTarget) }, null, 2));
                  onSelect(lvl);
                  setOpen(false);
                }}
              >
                <strong className={contentStyles.bold}>제목 {lvl}</strong>
              </Box>
            ))}
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
