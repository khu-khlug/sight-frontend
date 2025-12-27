import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Input,
  RadioGroup,
  Checkbox,
  SimpleGrid,
  IconButton,
} from "@chakra-ui/react";
import { X } from "lucide-react";

import Container from "../../../components/Container";
import Button from "../../../components/Button";
import Callout from "../../../components/Callout";
import CenterRingLoadingIndicator from "../../../components/RingLoadingIndicator/center";

import {
  GroupMatchingPublicApi,
  SubmitAnswerRequestDto,
  UpdateAnswerRequestDto,
} from "../../../api/public/groupMatching";
import { extractErrorMessage } from "../../../util/extractErrorMessage";
import { DateFormats, formatDate } from "../../../util/date";
import {
  GroupType,
  GroupTypeLabel,
  Semester,
  SemesterLabel,
} from "../../../constant";

import RequestFieldModal from "./RequestFieldModal";

export default function GroupMatchingSurveyContainer() {
  // Query: Get current survey
  const {
    status: surveyStatus,
    data: survey,
    error: surveyError,
  } = useQuery({
    queryKey: ["current-group-matching"],
    queryFn: GroupMatchingPublicApi.getCurrentGroupMatching,
    retry: 0,
  });

  // Query: Get my answer (if survey exists)
  const {
    status: answerStatus,
    data: myAnswer,
    error: answerError,
    refetch: refetchAnswer,
  } = useQuery({
    queryKey: ["my-group-matching-answer", survey?.id],
    queryFn: () => GroupMatchingPublicApi.getMyAnswer(survey!.id),
    enabled: !!survey,
    retry: 0,
  });

  // Query: Get available fields
  const {
    status: fieldsStatus,
    data: fields,
    error: fieldsError,
  } = useQuery({
    queryKey: ["group-matching-fields"],
    queryFn: GroupMatchingPublicApi.listAvailableFields,
    enabled: !!survey,
    retry: 0,
  });

  // Form state
  const [groupType, setGroupType] = useState<GroupType>(GroupType.STUDY);
  const [isPreferOnline, setIsPreferOnline] = useState<boolean>(false);
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([""]);

  // Modal state
  const [isRequestFieldModalOpen, setIsRequestFieldModalOpen] = useState(false);

  // Initialize form with existing answer
  useEffect(() => {
    if (myAnswer) {
      setGroupType(myAnswer.groupType);
      setIsPreferOnline(myAnswer.isPreferOnline);
      setSelectedFieldIds(myAnswer.fields.map((f) => f.id));
      const answerSubjects = myAnswer.groupMatchingSubjects.map(
        (s) => s.subject
      );
      setSubjects(answerSubjects.length > 0 ? answerSubjects : [""]);
    }
  }, [myAnswer]);

  // Mutation: Submit answer
  const { mutateAsync: submitAnswer, isPending: isSubmitting } = useMutation({
    mutationFn: (dto: {
      groupMatchingId: string;
      data: SubmitAnswerRequestDto;
    }) => GroupMatchingPublicApi.submitAnswer(dto.groupMatchingId, dto.data),
    onSuccess: () => {
      refetchAnswer();
    },
  });

  // Mutation: Update answer
  const { mutateAsync: updateAnswer, isPending: isUpdating } = useMutation({
    mutationFn: (dto: {
      groupMatchingId: string;
      data: UpdateAnswerRequestDto;
    }) => GroupMatchingPublicApi.updateAnswer(dto.groupMatchingId, dto.data),
    onSuccess: () => {
      refetchAnswer();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedFieldIds.length === 0) {
      alert("관심 분야를 최소 1개 이상 선택해주세요.");
      return;
    }

    const filteredSubjects = subjects.filter((s) => s.trim() !== "");
    if (filteredSubjects.length === 0) {
      alert("하고 싶은 주제를 최소 1개 이상 입력해주세요.");
      return;
    }

    try {
      if (myAnswer) {
        await updateAnswer({
          groupMatchingId: survey!.id,
          data: {
            groupType,
            isPreferOnline,
            fieldIds: selectedFieldIds,
            subjects: filteredSubjects,
          },
        });
        alert("설문 응답이 수정되었습니다.");
      } else {
        await submitAnswer({
          groupMatchingId: survey!.id,
          data: {
            groupType,
            isPreferOnline,
            groupMatchingFieldIds: selectedFieldIds,
            groupMatchingSubjects: filteredSubjects,
          },
        });
        alert("설문 응답이 제출되었습니다.");
      }
    } catch (error) {
      alert(extractErrorMessage(error as Error));
    }
  };

  const handleSubjectChange = (index: number, value: string) => {
    const newSubjects = [...subjects];
    newSubjects[index] = value;
    setSubjects(newSubjects);
  };

  const handleAddSubject = () => {
    if (subjects.length < 3) {
      setSubjects([...subjects, ""]);
    }
  };

  const handleRemoveSubject = (index: number) => {
    if (subjects.length > 1) {
      setSubjects(subjects.filter((_, i) => i !== index));
    }
  };

  const toggleField = (fieldId: string) => {
    if (selectedFieldIds.includes(fieldId)) {
      setSelectedFieldIds(selectedFieldIds.filter((id) => id !== fieldId));
    } else {
      setSelectedFieldIds([...selectedFieldIds, fieldId]);
    }
  };

  // Loading state
  if (surveyStatus === "pending") {
    return (
      <Container>
        <CenterRingLoadingIndicator />
      </Container>
    );
  }

  // Error state
  if (surveyStatus === "error") {
    return (
      <Container>
        <Callout type="error">{extractErrorMessage(surveyError)}</Callout>
      </Container>
    );
  }

  // No active survey
  if (!survey) {
    return (
      <Container>
        <Heading as="h2" size="lg" mb={4}>
          그룹 매칭 설문
        </Heading>
        <Callout>현재 진행 중인 그룹 매칭 설문이 없습니다.</Callout>
      </Container>
    );
  }

  // Survey exists but is closed
  const isClosed = new Date(survey.closedAt) < new Date();
  if (isClosed && !myAnswer) {
    return (
      <Container>
        <Heading as="h2" size="lg" mb={4}>
          그룹 매칭 설문
        </Heading>
        <Callout type="error">
          설문이 마감되었습니다. (마감일:{" "}
          {formatDate(new Date(survey.closedAt), DateFormats.DATE_KOR)})
        </Callout>
      </Container>
    );
  }

  // Answer loading
  if (answerStatus === "pending" || fieldsStatus === "pending") {
    return (
      <Container>
        <CenterRingLoadingIndicator />
      </Container>
    );
  }

  // Answer error
  if (answerStatus === "error" || fieldsStatus === "error") {
    return (
      <Container>
        <Callout type="error">
          {extractErrorMessage((answerError || fieldsError) as Error)}
        </Callout>
      </Container>
    );
  }

  const isReadOnly = isClosed && !!myAnswer;

  return (
    <>
      <Container>
        <Heading as="h2" size="lg" mb={5}>
          {survey.year}년 {SemesterLabel[survey.semester as Semester]} 그룹 매칭
          설문
        </Heading>

        <Box bg="gray.50" p={4} borderRadius="md" mb={6}>
          <Text fontSize="sm" color="gray.600">
            마감일:{" "}
            {formatDate(new Date(survey.closedAt), DateFormats.DATE_KOR)}
          </Text>
          {myAnswer && (
            <Text fontSize="sm" color="brand.500" fontWeight="medium" mt={1}>
              제출일:{" "}
              {formatDate(new Date(myAnswer.createdAt), DateFormats.DATE_KOR)}
              {myAnswer.updatedAt !== myAnswer.createdAt && (
                <>
                  {" "}
                  (수정:{" "}
                  {formatDate(
                    new Date(myAnswer.updatedAt),
                    DateFormats.DATE_KOR
                  )}
                  )
                </>
              )}
            </Text>
          )}
        </Box>
        {isReadOnly && (
          <Box mb={6}>
            <Callout>
              설문이 마감되었습니다. 제출된 응답은 수정할 수 없습니다.
            </Callout>
          </Box>
        )}

        <VStack as="form" onSubmit={handleSubmit} gap={7} align="stretch">
          {/* Group Type Selection */}
          <Box>
            <Text fontWeight="semibold" fontSize="15px" mb={3}>
              그룹 유형
            </Text>
            <RadioGroup.Root
              value={groupType}
              onValueChange={(details) =>
                setGroupType(details.value as GroupType)
              }
              disabled={isReadOnly}
            >
              <HStack gap={6}>
                <RadioGroup.Item value={GroupType.STUDY}>
                  <RadioGroup.ItemHiddenInput />
                  <RadioGroup.ItemControl />
                  <RadioGroup.ItemText>
                    {GroupTypeLabel[GroupType.STUDY]}
                  </RadioGroup.ItemText>
                </RadioGroup.Item>
                <RadioGroup.Item value={GroupType.PROJECT}>
                  <RadioGroup.ItemHiddenInput />
                  <RadioGroup.ItemControl />
                  <RadioGroup.ItemText>
                    {GroupTypeLabel[GroupType.PROJECT]}
                  </RadioGroup.ItemText>
                </RadioGroup.Item>
              </HStack>
            </RadioGroup.Root>
          </Box>

          {/* Online Preference */}
          <Box>
            <Text fontWeight="semibold" fontSize="15px" mb={3}>
              활동 방식
            </Text>
            <Checkbox.Root
              checked={isPreferOnline}
              onCheckedChange={(details) =>
                setIsPreferOnline(details.checked === true)
              }
              disabled={isReadOnly}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Label>온라인 활동 선호</Checkbox.Label>
            </Checkbox.Root>
          </Box>

          {/* Field Selection (Inline Checkboxes) */}
          <Box>
            <Text fontWeight="semibold" fontSize="15px" mb={3}>
              관심 분야 (최소 1개)
            </Text>
            <SimpleGrid
              columns={{ base: 1, md: 2, lg: 3 }}
              gap={3}
              p={4}
              bg="gray.50"
              borderRadius="md"
              mb={3}
            >
              {fields?.map((field) => (
                <Checkbox.Root
                  key={field.id}
                  checked={selectedFieldIds.includes(field.id)}
                  onCheckedChange={() => toggleField(field.id)}
                  disabled={isReadOnly}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Label>{field.name}</Checkbox.Label>
                </Checkbox.Root>
              ))}
            </SimpleGrid>
            {!isReadOnly && (
              <Button
                type="button"
                variant="neutral"
                onClick={() => setIsRequestFieldModalOpen(true)}
              >
                새 분야 요청
              </Button>
            )}
          </Box>

          {/* Subjects (Dynamic List) */}
          <Box>
            <Text fontWeight="semibold" fontSize="15px" mb={3}>
              하고 싶은 주제 (최소 1개, 최대 3개)
            </Text>
            <VStack gap={3} align="stretch">
              {subjects.map((subject, index) => (
                <HStack key={index}>
                  <Input
                    value={subject}
                    onChange={(e) => handleSubjectChange(index, e.target.value)}
                    placeholder={`주제 ${index + 1}`}
                    disabled={isReadOnly}
                  />
                  {!isReadOnly && subjects.length > 1 && (
                    <IconButton
                      type="button"
                      onClick={() => handleRemoveSubject(index)}
                      aria-label="Remove subject"
                      variant="ghost"
                      colorPalette="red"
                    >
                      <X />
                    </IconButton>
                  )}
                </HStack>
              ))}
            </VStack>
            {!isReadOnly && subjects.length < 3 && (
              <Button
                type="button"
                variant="neutral"
                onClick={handleAddSubject}
                mt={3}
              >
                주제 추가
              </Button>
            )}
          </Box>

          {!isReadOnly && (
            <Box>
              <Button type="submit" disabled={isSubmitting || isUpdating}>
                {myAnswer ? "수정하기" : "제출하기"}
              </Button>
            </Box>
          )}
        </VStack>
      </Container>

      {/* Modals */}
      {isRequestFieldModalOpen && (
        <RequestFieldModal
          isOpen={isRequestFieldModalOpen}
          onClose={() => setIsRequestFieldModalOpen(false)}
        />
      )}
    </>
  );
}
