import { Box, Popover, Portal } from "@chakra-ui/react";
import { ArrowUpDown } from "lucide-react";
import { useState } from "react";

import { cn } from "../../../../../util/cn";
import styles from "./style.module.css";

import type { RecordSortOrder } from "../../../../../api/public/group/KanbanApi";
export type { RecordSortOrder } from "../../../../../api/public/group/KanbanApi";

const SORT_OPTIONS: { value: RecordSortOrder; label: string }[] = [
  { value: "NEWEST", label: "최신순" },
  { value: "OLDEST", label: "오래된순" },
  { value: "RECENTLY_UPDATED", label: "최근변경순" },
];

type Props = {
  value: RecordSortOrder;
  onChange: (value: RecordSortOrder) => void;
  triggerClassName: string;
  disabled?: boolean;
};

export default function RecordSortMenu({ value, onChange, triggerClassName, disabled = false }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Popover.Root
      open={open && !disabled}
      onOpenChange={(details) => { if (!disabled) setOpen(details.open); }}
      lazyMount
      unmountOnExit
      positioning={{ placement: "bottom-end" }}
    >
      <Popover.Trigger asChild>
        <button type="button" disabled={disabled} className={triggerClassName} aria-label="기록 정렬">
          <ArrowUpDown size={16} />
        </button>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content className={styles.content}>
            {SORT_OPTIONS.map((option) => (
              <Box
                key={option.value}
                as="button"
                className={cn(styles.option, option.value === value ? styles.optionActive : undefined)}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                {option.label}
              </Box>
            ))}
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
