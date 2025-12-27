import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Flex, Heading, VStack, HStack, Box, Text } from "@chakra-ui/react";

import Container from "../../../components/Container";
import Button from "../../../components/Button";
import Callout from "../../../components/Callout";
import CenterRingLoadingIndicator from "../../../components/RingLoadingIndicator/center";

import {
  GroupMatchingManageApi,
  GroupMatchingResponse,
} from "../../../api/manage/groupMatching";
import { extractErrorMessage } from "../../../util/extractErrorMessage";
import { DateFormats, formatDate } from "../../../util/date";
import { Semester, SemesterLabel } from "../../../constant";

import CreateSurveyModal from "./CreateSurveyModal";
import UpdateDeadlineModal from "./UpdateDeadlineModal";

export default function GroupMatchingManagementContainer() {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] =
    useState<GroupMatchingResponse | null>(null);

  const { status, data, error, refetch } = useQuery({
    queryKey: ["group-matchings-admin"],
    queryFn: GroupMatchingManageApi.listGroupMatchings,
    retry: 0,
  });

  const handleViewAnswers = (surveyId: string) => {
    navigate(`/manage/group-matching-answers?surveyId=${surveyId}`);
  };

  const handleUpdateDeadline = (survey: GroupMatchingResponse) => {
    setSelectedSurvey(survey);
  };

  if (status === "pending") {
    return (
      <Container>
        <CenterRingLoadingIndicator />
      </Container>
    );
  }

  if (status === "error") {
    return (
      <Container>
        <Callout type="error">{extractErrorMessage(error)}</Callout>
      </Container>
    );
  }

  return (
    <>
      <Container>
        <Flex justify="space-between" align="center" mb={5}>
          <Heading as="h2" size="lg">
            그룹 매칭 목록
          </Heading>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            그룹 매칭 생성
          </Button>
        </Flex>

        {data && data.groupMatchings.length > 0 ? (
          <VStack gap={4} align="stretch">
            {data.groupMatchings.map((survey) => (
              <Box
                key={survey.id}
                p={5}
                bg="gray.50"
                borderRadius="md"
                display="flex"
                justifyContent="space-between"
                alignItems="flex-start"
                gap={5}
              >
                <VStack align="start" flex={1} gap={3}>
                  <HStack>
                    <Text fontWeight="semibold" color="gray.600" minW="80px">
                      학기:
                    </Text>
                    <Text>
                      {survey.year}년{" "}
                      {SemesterLabel[survey.semester as Semester]}
                    </Text>
                  </HStack>
                  <HStack>
                    <Text fontWeight="semibold" color="gray.600" minW="80px">
                      마감일:
                    </Text>
                    <Text>
                      {formatDate(
                        new Date(survey.closedAt),
                        DateFormats.DATE_KOR
                      )}
                    </Text>
                  </HStack>
                  <HStack>
                    <Text fontWeight="semibold" color="gray.600" minW="80px">
                      생성일:
                    </Text>
                    <Text>
                      {formatDate(
                        new Date(survey.createdAt),
                        DateFormats.DATE_KOR
                      )}
                    </Text>
                  </HStack>
                </VStack>

                <HStack gap={3}>
                  <Button onClick={() => handleViewAnswers(survey.id)}>
                    응답 보기
                  </Button>
                  <Button
                    variant="neutral"
                    onClick={() => handleUpdateDeadline(survey)}
                  >
                    마감일 변경
                  </Button>
                </HStack>
              </Box>
            ))}
          </VStack>
        ) : (
          <Callout>현재 진행 중인 그룹 매칭 설문이 없습니다.</Callout>
        )}
      </Container>

      {isCreateModalOpen && (
        <CreateSurveyModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            refetch();
          }}
        />
      )}

      {selectedSurvey && (
        <UpdateDeadlineModal
          isOpen={!!selectedSurvey}
          survey={selectedSurvey}
          onClose={() => setSelectedSurvey(null)}
          onSuccess={() => {
            setSelectedSurvey(null);
            refetch();
          }}
        />
      )}
    </>
  );
}
