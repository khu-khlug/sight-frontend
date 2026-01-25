import type { BookmarkedGroup } from "../../../api/main/types";
import { Card, Text, Box } from "@chakra-ui/react";

type Props = {
  group: BookmarkedGroup;
};

export default function GroupCard({ group }: Props) {
  return (
    <Card.Root
      cursor="pointer"
      _hover={{ borderColor: "var(--main-color)", transform: "translateY(-2px)" }}
      transition="all 0.2s"
      borderWidth="1px"
      borderColor="gray.200"
      padding="16px"
    >
      <Card.Body padding="0">
        <Text fontSize="sm" color="gray.600" marginBottom="8px">
          {group.category}
        </Text>
        <Text fontSize="lg" fontWeight="bold" marginBottom="12px">
          {group.name}
        </Text>
        <Box display="flex" alignItems="center" gap="4px">
          <Text fontSize="sm" color="gray.600">
            그룹장:
          </Text>
          <Text fontSize="sm">{group.leader.name}</Text>
        </Box>
      </Card.Body>
    </Card.Root>
  );
}
