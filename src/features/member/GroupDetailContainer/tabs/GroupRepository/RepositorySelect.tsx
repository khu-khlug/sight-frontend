import { createListCollection, Portal, ScrollArea, Select } from "@chakra-ui/react";
import { ChevronDown } from "lucide-react";
import type { ReactNode, UIEventHandler } from "react";

import HoverScrollbar from "../../../../../components/HoverScrollbar";
import styles from "./style.module.css";

type Item = { label: string; value: string };

type Props = {
  items: Item[];
  value: string;
  onChange: (value: string) => void;
  renderValue: ReactNode;
  renderItem: (item: Item) => ReactNode;
  triggerClassName?: string;
  valueClassName?: string;
  menuClassName?: string;
  itemClassName?: string;
  scrollable?: boolean;
  onMenuScroll?: UIEventHandler<HTMLDivElement>;
  footer?: ReactNode;
  disabled?: boolean;
  fullWidth?: boolean;
};

// 저장소·브랜치·커밋 선택기가 같은 선택 UI를 사용한다.
export default function RepositorySelect({
  items, value, onChange, renderValue, renderItem, triggerClassName,
  valueClassName, menuClassName, itemClassName = styles.selectedOption,
  scrollable = false, onMenuScroll, footer, disabled, fullWidth = false,
}: Props) {
  const collection = createListCollection({ items });
  const options = (
    <>
      {collection.items.map((item) => (
        <Select.Item key={item.value} item={item} className={itemClassName} data-current={item.value === value}>
          {renderItem(item)}
        </Select.Item>
      ))}
      {footer}
    </>
  );

  return (
    <Select.Root
      collection={collection}
      value={value ? [value] : []}
      onValueChange={(event) => {
        const next = event.value[0];
        if (next) onChange(next);
      }}
      size="sm"
      disabled={disabled}
      w={fullWidth ? "100%" : undefined}
      mb={fullWidth ? "0px" : undefined}
    >
      <Select.Trigger className={triggerClassName}>
        <Select.ValueText className={valueClassName}>{renderValue}</Select.ValueText>
        <Select.Indicator><ChevronDown size={14} /></Select.Indicator>
      </Select.Trigger>
      <Portal>
        <Select.Positioner>
          <Select.Content className={menuClassName}>
            {scrollable ? (
              <ScrollArea.Root maxH="280px" size="sm" variant="hover">
                <ScrollArea.Viewport maxH="280px" style={{ overflowX: "hidden" }} onScroll={onMenuScroll}>
                  <ScrollArea.Content w="100%" style={{ minWidth: 0 }}>{options}</ScrollArea.Content>
                </ScrollArea.Viewport>
                <HoverScrollbar />
              </ScrollArea.Root>
            ) : options}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  );
}
