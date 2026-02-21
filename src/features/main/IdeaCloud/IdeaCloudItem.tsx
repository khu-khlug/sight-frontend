import type { IdeaCloudItem as IdeaCloudItemType } from "../../../api/ideaCloud/types";
import { Box, Text, IconButton } from "@chakra-ui/react";
import { X } from "lucide-react";
import { getLegacyGroupCreateUrl } from "../../../api/client/legacy";

type Props = {
  ideaCloud: IdeaCloudItemType;
  isManager: boolean;
  onDelete: (id: number) => void;
};

export default function IdeaCloudItem({
  ideaCloud,
  isManager,
  onDelete,
}: Props) {
  const handleClick = () => {
    window.open(getLegacyGroupCreateUrl(ideaCloud.id), "_blank");
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(ideaCloud.id);
  };

  return (
    <Box
      display="flex"
      alignItems="flex-start"
      justifyContent="space-between"
      gap="12px"
      padding="12px"
      borderRadius="md"
      _hover={{ backgroundColor: "gray.50" }}
      cursor="pointer"
      transition="background-color 0.2s"
      onClick={handleClick}
    >
      <Box flex="1" minWidth="0">
        <Text fontSize="md" marginBottom="4px">
          {ideaCloud.content}
        </Text>
        <Text fontSize="sm" color="gray.600">
          {ideaCloud.author.realname}
        </Text>
      </Box>

      {isManager && (
        <IconButton
          aria-label="삭제"
          size="xs"
          variant="ghost"
          color="gray.400"
          minWidth="auto"
          height="auto"
          padding="4px"
          onClick={handleDeleteClick}
          _hover={{ color: "gray.600" }}
        >
          <X size={14} />
        </IconButton>
      )}
    </Box>
  );
}
