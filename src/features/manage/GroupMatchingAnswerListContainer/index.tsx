import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  Heading,
  VStack,
  HStack,
  Text,
  NativeSelectRoot,
  NativeSelectField,
} from "@chakra-ui/react";

import Container from "../../../components/Container";
import Button from "../../../components/Button";
import Callout from "../../../components/Callout";
import CenterRingLoadingIndicator from "../../../components/RingLoadingIndicator/center";
import PageNavigator from "../../../components/PageNavigator";

import { GroupMatchingManageApi } from "../../../api/manage/groupMatching";
import { extractErrorMessage } from "../../../util/extractErrorMessage";
import { GroupType, GroupTypeLabel } from "../../../constant";

import AnswerItem from "./AnswerItem";

export default function GroupMatchingAnswerListContainer() {
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [filterGroupType, setFilterGroupType] = useState<GroupType | null>(
    null
  );
  const [filterOptionId, setFilterOptionId] = useState<string | null>(null);

  const limit = 20;
  const offset = (page - 1) * limit;

  // URL 파라미터에서 surveyId 가져오기
  const surveyIdFromUrl = searchParams.get("surveyId");

  // Get group matchings
  const { data: groupMatchingsData } = useQuery({
    queryKey: ["group-matchings-admin"],
    queryFn: GroupMatchingManageApi.listGroupMatchings,
    retry: 0,
  });

  // URL에 surveyId가 있으면 해당 설문을, 없으면 최신 설문을 사용
  const survey = surveyIdFromUrl
    ? groupMatchingsData?.groupMatchings.find(
        (s) => s.id === surveyIdFromUrl
      ) || null
    : groupMatchingsData?.groupMatchings[0] || null;

  // Get options for filter (study types only)
  const optionFilterType =
    filterGroupType === GroupType.BASIC_LANGUAGE_STUDY ||
    filterGroupType === GroupType.PROJECT_STYLE_STUDY
      ? filterGroupType
      : null;

  const { data: optionsForFilter } = useQuery({
    queryKey: ["group-matching-options-filter", survey?.id, optionFilterType],
    queryFn: () =>
      GroupMatchingManageApi.listOptions(
        survey!.id,
        optionFilterType as "BASIC_LANGUAGE_STUDY" | "PROJECT_STYLE_STUDY"
      ),
    enabled: !!survey && !!optionFilterType,
    retry: 0,
  });

  // Get answers
  const { status, data, error, refetch } = useQuery({
    queryKey: [
      "group-matching-answers",
      survey?.id,
      page,
      filterGroupType,
      filterOptionId,
    ],
    queryFn: () =>
      GroupMatchingManageApi.listAnswers({
        groupMatchingId: survey!.id,
        groupType: filterGroupType,
        optionId: filterOptionId,
        limit,
        offset,
      }),
    enabled: !!survey,
    retry: 0,
  });

  const handleSearch = () => {
    setPage(1);
    refetch();
  };

  const handleGroupTypeChange = (value: string) => {
    setFilterGroupType(value === "" ? null : (value as GroupType));
    setFilterOptionId(null); // Reset option filter when group type changes
  };

  if (!survey) {
    return (
      <Container>
        <Callout>진행 중인 설문이 없습니다.</Callout>
      </Container>
    );
  }

  return (
    <>
      <Container>
        <Heading as="h2" size="lg" mb={5}>
          응답 목록
        </Heading>

        {/* Filters */}
        <HStack gap={4} mb={5}>
          <VStack align="stretch" gap={2} flex={1}>
            <Text fontWeight="medium" fontSize="sm">
              그룹 유형
            </Text>
            <NativeSelectRoot>
              <NativeSelectField
                value={filterGroupType || ""}
                onChange={(e) => handleGroupTypeChange(e.target.value)}
              >
                <option value="">전체</option>
                <option value={GroupType.BASIC_LANGUAGE_STUDY}>
                  {GroupTypeLabel[GroupType.BASIC_LANGUAGE_STUDY]}
                </option>
                <option value={GroupType.PROJECT_STYLE_STUDY}>
                  {GroupTypeLabel[GroupType.PROJECT_STYLE_STUDY]}
                </option>
                <option value={GroupType.PRACTICAL_PROJECT}>
                  {GroupTypeLabel[GroupType.PRACTICAL_PROJECT]}
                </option>
              </NativeSelectField>
            </NativeSelectRoot>
          </VStack>

          {optionFilterType && (
            <VStack align="stretch" gap={2} flex={1}>
              <Text fontWeight="medium" fontSize="sm">
                옵션
              </Text>
              <NativeSelectRoot>
                <NativeSelectField
                  value={filterOptionId || ""}
                  onChange={(e) =>
                    setFilterOptionId(
                      e.target.value === "" ? null : e.target.value
                    )
                  }
                >
                  <option value="">전체</option>
                  {optionsForFilter?.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </NativeSelectField>
              </NativeSelectRoot>
            </VStack>
          )}

          <Button onClick={handleSearch} alignSelf="flex-end">
            검색
          </Button>
        </HStack>
      </Container>

      <Container>
        {(() => {
          switch (status) {
            case "pending":
              return <CenterRingLoadingIndicator />;
            case "error":
              return (
                <Callout type="error">{extractErrorMessage(error)}</Callout>
              );
            case "success":
              return (
                <>
                  <Heading as="h3" size="md" mb={4}>
                    총{" "}
                    <Text as="span" color="brand.500">
                      {data.count}개
                    </Text>{" "}
                    응답
                  </Heading>
                  <VStack gap={4} align="stretch" mb={5}>
                    {data.answers.map((answer) => (
                      <AnswerItem key={answer.id} answer={answer} />
                    ))}
                  </VStack>
                  <PageNavigator
                    currentPage={page}
                    countPerPage={limit}
                    totalCount={data.count}
                    onPageChange={(page) => setPage(page)}
                  />
                </>
              );
          }
        })()}
      </Container>
    </>
  );
}
