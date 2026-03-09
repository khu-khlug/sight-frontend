import { Box, Text, VStack } from "@chakra-ui/react";

import Button from "../../../../components/Button";
import {
  GroupType,
  GroupTypeLabel,
  GroupTypeDescription,
} from "../../../../constant";

import styles from "./style.module.css";

type Props = {
  selectedType: GroupType | null;
  onSelect: (type: GroupType) => void;
  onReset: () => void;
  disabled?: boolean;
};

const groupTypes: GroupType[] = [
  GroupType.BASIC_LANGUAGE_STUDY,
  GroupType.PROJECT_STYLE_STUDY,
  GroupType.PRACTICAL_PROJECT,
];

export default function GroupTypeSelector({
  selectedType,
  onSelect,
  onReset,
  disabled,
}: Props) {
  // Show only selected type with reset button
  if (selectedType) {
    return (
      <VStack gap={3} align="stretch">
        <Box className={styles.card} data-selected="true">
          <Text fontWeight="semibold" fontSize="md">
            {GroupTypeLabel[selectedType]}
          </Text>
          <Text fontSize="sm" color="gray.600">
            {GroupTypeDescription[selectedType]}
          </Text>
        </Box>
        {!disabled && (
          <Button variant="neutral" onClick={onReset} type="button">
            선택 취소
          </Button>
        )}
      </VStack>
    );
  }

  // Show all options
  return (
    <VStack gap={3} align="stretch">
      {groupTypes.map((type) => (
        <Box
          key={type}
          className={styles.card}
          onClick={() => onSelect(type)}
          cursor="pointer"
        >
          <Text fontWeight="semibold" fontSize="md">
            {GroupTypeLabel[type]}
          </Text>
          <Text fontSize="sm" color="gray.600">
            {GroupTypeDescription[type]}
          </Text>
        </Box>
      ))}
    </VStack>
  );
}
