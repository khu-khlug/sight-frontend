import { Box, VStack, HStack, Text, Badge } from "@chakra-ui/react";

import { GroupMatchingAnswerDto } from "../../../../api/manage/groupMatching";
import {
  GroupType,
  GroupTypeLabel,
  ActivityFrequencyLabel,
  ActivityFrequency,
} from "../../../../constant";
import { DateFormats, formatDate } from "../../../../util/date";

type Props = {
  answer: GroupMatchingAnswerDto;
};

export default function AnswerItem({ answer }: Props) {
  const isStudyType =
    answer.groupType === GroupType.BASIC_LANGUAGE_STUDY ||
    answer.groupType === GroupType.PROJECT_STYLE_STUDY;

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
        <Badge
          colorPalette="blue"
          variant="solid"
          borderRadius="md"
          px={3}
          py={1}
        >
          {GroupTypeLabel[answer.groupType]}
        </Badge>
      </HStack>

      <VStack align="stretch" gap={2}>
        <HStack>
          <Text fontWeight="medium" color="gray.600" minW="120px">
            활동 방식:
          </Text>
          <Text>{answer.isPreferOnline ? "온라인 선호" : "오프라인 선호"}</Text>
        </HStack>

        <HStack>
          <Text fontWeight="medium" color="gray.600" minW="120px">
            활동 빈도:
          </Text>
          <Text>
            {ActivityFrequencyLabel[answer.activityFrequency as ActivityFrequency] ||
              answer.activityFrequency}
          </Text>
        </HStack>

        <HStack align="start">
          <Text fontWeight="medium" color="gray.600" minW="120px">
            활동 형태:
          </Text>
          <Text>{answer.activityFormat}</Text>
        </HStack>

        {/* Study-specific fields */}
        {isStudyType && answer.selectedOptions.length > 0 && (
          <HStack align="start">
            <Text fontWeight="medium" color="gray.600" minW="120px">
              선택 옵션:
            </Text>
            <HStack flexWrap="wrap" gap={2}>
              {answer.selectedOptions.map((option) => (
                <Badge
                  key={option.id}
                  colorPalette="gray"
                  variant="subtle"
                  borderRadius="md"
                  px={2}
                  py={1}
                >
                  {option.name}
                </Badge>
              ))}
            </HStack>
          </HStack>
        )}

        {isStudyType && answer.customOption && (
          <HStack>
            <Text fontWeight="medium" color="gray.600" minW="120px">
              기타 옵션:
            </Text>
            <Text>{answer.customOption}</Text>
          </HStack>
        )}

        {/* Practical project fields */}
        {answer.groupType === GroupType.PRACTICAL_PROJECT && answer.role && (
          <HStack>
            <Text fontWeight="medium" color="gray.600" minW="120px">
              역할:
            </Text>
            <Text>{answer.role}</Text>
          </HStack>
        )}

        {answer.groupType === GroupType.PRACTICAL_PROJECT &&
          answer.hasIdea !== null && (
            <HStack align="start">
              <Text fontWeight="medium" color="gray.600" minW="120px">
                아이디어:
              </Text>
              <Text>
                {answer.hasIdea ? answer.idea || "(내용 없음)" : "없음"}
              </Text>
            </HStack>
          )}

        {answer.otherSuggestions && (
          <HStack align="start">
            <Text fontWeight="medium" color="gray.600" minW="120px">
              기타 건의:
            </Text>
            <Text>{answer.otherSuggestions}</Text>
          </HStack>
        )}

        <HStack>
          <Text fontWeight="medium" color="gray.600" minW="120px">
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
