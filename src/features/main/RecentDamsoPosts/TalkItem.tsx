import type { Talk } from "../../../api/talk/types";
import { Box, Text } from "@chakra-ui/react";
import dayjs from "dayjs";

type Props = {
  talk: Talk;
};

export default function TalkItem({ talk }: Props) {
  const relativeTimeStr = dayjs(talk.createdAt).fromNow();

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      gap="12px"
      padding="12px"
      borderRadius="md"
      _hover={{ backgroundColor: "gray.50" }}
      cursor="pointer"
      transition="background-color 0.2s"
    >
      <Box flex="1" minWidth="0">
        <Text
          fontSize="md"
          marginBottom="4px"
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
        >
          {talk.title}
        </Text>
        <Text fontSize="sm" color="gray.600">
          {talk.author.realname}
        </Text>
      </Box>

      <Text fontSize="sm" color="gray.500" flexShrink="0">
        {relativeTimeStr}
      </Text>
    </Box>
  );
}
