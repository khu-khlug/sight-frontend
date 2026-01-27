import type { GroupDto } from "../../../api/public/group";
import { Card, Text, Box } from "@chakra-ui/react";
import { GroupCategory, GroupCategoryLabel } from "../../../constant";

type Props = {
  group: GroupDto;
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
          {GroupCategoryLabel[group.category as GroupCategory] ?? group.category}
        </Text>
        <Text fontSize="lg" fontWeight="bold" marginBottom="12px">
          {group.title}
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
