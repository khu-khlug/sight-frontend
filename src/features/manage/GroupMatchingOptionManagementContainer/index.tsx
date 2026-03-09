import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Flex,
  Heading,
  VStack,
  HStack,
  Box,
  Text,
  NativeSelectRoot,
  NativeSelectField,
  Badge,
} from "@chakra-ui/react";

import Container from "../../../components/Container";
import Callout from "../../../components/Callout";
import CenterRingLoadingIndicator from "../../../components/RingLoadingIndicator/center";

import { GroupMatchingManageApi } from "../../../api/manage/groupMatching";
import { extractErrorMessage } from "../../../util/extractErrorMessage";

type OptionType = "BASIC_LANGUAGE_STUDY" | "PROJECT_STYLE_STUDY";

const optionTypeLabel: Record<OptionType, string> = {
  BASIC_LANGUAGE_STUDY: "기초 언어 스터디",
  PROJECT_STYLE_STUDY: "프로젝트형 스터디",
};

export default function GroupMatchingOptionManagementContainer() {
  const [selectedMatchingId, setSelectedMatchingId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<OptionType>("BASIC_LANGUAGE_STUDY");

  // Get group matchings
  const {
    status: matchingsStatus,
    data: matchingsData,
    error: matchingsError,
  } = useQuery({
    queryKey: ["group-matchings-admin"],
    queryFn: GroupMatchingManageApi.listGroupMatchings,
    retry: 0,
  });

  // Auto-select first matching
  const effectiveMatchingId =
    selectedMatchingId ||
    matchingsData?.groupMatchings[0]?.id ||
    "";

  // Get options
  const {
    status: optionsStatus,
    data: options,
    error: optionsError,
  } = useQuery({
    queryKey: ["group-matching-options-manage", effectiveMatchingId, activeTab],
    queryFn: () =>
      GroupMatchingManageApi.listOptions(effectiveMatchingId, activeTab),
    enabled: !!effectiveMatchingId,
    retry: 0,
  });

  if (matchingsStatus === "pending") {
    return (
      <Container>
        <CenterRingLoadingIndicator />
      </Container>
    );
  }

  if (matchingsStatus === "error") {
    return (
      <Container>
        <Callout type="error">{extractErrorMessage(matchingsError)}</Callout>
      </Container>
    );
  }

  if (!matchingsData || matchingsData.groupMatchings.length === 0) {
    return (
      <Container>
        <Heading as="h2" size="lg" mb={5}>
          옵션 관리
        </Heading>
        <Callout>그룹 매칭이 없습니다.</Callout>
      </Container>
    );
  }

  return (
    <Container>
      <Heading as="h2" size="lg" mb={5}>
        옵션 관리
      </Heading>

      {/* Matching selector */}
      <VStack align="stretch" gap={2} mb={5} maxW="300px">
        <Text fontWeight="medium" fontSize="sm">
          그룹 매칭 선택
        </Text>
        <NativeSelectRoot>
          <NativeSelectField
            value={effectiveMatchingId}
            onChange={(e) => setSelectedMatchingId(e.target.value)}
          >
            {matchingsData.groupMatchings.map((gm) => (
              <option key={gm.id} value={gm.id}>
                {gm.year}년 {gm.semester}학기
              </option>
            ))}
          </NativeSelectField>
        </NativeSelectRoot>
      </VStack>

      {/* Tab buttons */}
      <HStack gap={3} mb={5}>
        {(
          ["BASIC_LANGUAGE_STUDY", "PROJECT_STYLE_STUDY"] as OptionType[]
        ).map((type) => (
          <Box
            key={type}
            px={4}
            py={2}
            borderRadius="md"
            cursor="pointer"
            fontWeight="medium"
            fontSize="sm"
            bg={activeTab === type ? "brand.500" : "gray.100"}
            color={activeTab === type ? "white" : "gray.700"}
            onClick={() => setActiveTab(type)}
            transition="all 0.2s"
            _hover={{
              bg: activeTab === type ? "brand.600" : "gray.200",
            }}
          >
            {optionTypeLabel[type]}
          </Box>
        ))}
      </HStack>

      {/* Options list */}
      {optionsStatus === "pending" ? (
        <CenterRingLoadingIndicator />
      ) : optionsStatus === "error" ? (
        <Callout type="error">{extractErrorMessage(optionsError)}</Callout>
      ) : options && options.length > 0 ? (
        <VStack gap={2} align="stretch">
          {options.map((option) => (
            <Flex
              key={option.id}
              p={3}
              bg="white"
              border="1px solid"
              borderColor="gray.200"
              borderRadius="md"
              align="center"
              justify="space-between"
            >
              <Text fontSize="md">{option.name}</Text>
              <Badge colorPalette="gray" variant="subtle" fontSize="xs">
                {optionTypeLabel[activeTab]}
              </Badge>
            </Flex>
          ))}
        </VStack>
      ) : (
        <Text color="gray.500" textAlign="center" py={8}>
          등록된 옵션이 없습니다.
        </Text>
      )}
    </Container>
  );
}
