import { Box, VStack, HStack, Text, Badge } from "@chakra-ui/react";

import { GroupMatchingManageApiDto } from "../../../../api/manage/groupMatching";
import { GroupTypeLabel } from "../../../../constant";
import { DateFormats, formatDate } from "../../../../util/date";

type Props = {
  answer: GroupMatchingManageApiDto["GroupMatchingAnswerWithUserDto"];
  fieldNameMap: Record<string, string>;
};

export default function AnswerItem({ answer, fieldNameMap }: Props) {
  return (
    <Box
      p={4}
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="md"
    >
      <HStack justify="space-between" mb={3}>
        <Text fontWeight="semibold" fontSize="md">
          사용자 ID: {answer.userId}
        </Text>
        <Badge colorPalette="blue" variant="solid" borderRadius="md" px={3} py={1}>
          {GroupTypeLabel[answer.groupType]}
        </Badge>
      </HStack>

      <VStack align="stretch" gap={2}>
        <HStack>
          <Text fontWeight="medium" color="gray.600" minW="100px">
            활동 방식:
          </Text>
          <Text>{answer.isPreferOnline ? "온라인 선호" : "오프라인"}</Text>
        </HStack>

        <HStack align="start">
          <Text fontWeight="medium" color="gray.600" minW="100px">
            관심 분야:
          </Text>
          <HStack flexWrap="wrap" gap={2}>
            {answer.fields.map((field) => (
              <Badge
                key={field.id}
                colorPalette="gray"
                variant="subtle"
                borderRadius="md"
                px={2}
                py={1}
              >
                {fieldNameMap[field.id] || field.id}
              </Badge>
            ))}
          </HStack>
        </HStack>

        <HStack align="start">
          <Text fontWeight="medium" color="gray.600" minW="100px">
            하고 싶은 주제:
          </Text>
          <VStack align="start" gap={1} pl={2}>
            {answer.subjects.map((subject) => (
              <Text key={subject.id} fontSize="sm">
                • {subject.subject}
              </Text>
            ))}
          </VStack>
        </HStack>

        <HStack>
          <Text fontWeight="medium" color="gray.600" minW="100px">
            제출일:
          </Text>
          <Text>
            {formatDate(new Date(answer.createdAt), DateFormats.DATE_KOR)}
          </Text>
        </HStack>
      </VStack>
    </Box>
  );
}
