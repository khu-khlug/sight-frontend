import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Input,
  Textarea,
  RadioGroup,
  Checkbox,
  SimpleGrid,
  Flex,
  Link,
  Field,
} from "@chakra-ui/react";

import { toast } from "react-toastify";

import Container from "../../../components/Container";
import Button from "../../../components/Button";
import Callout from "../../../components/Callout";
import CenterRingLoadingIndicator from "../../../components/RingLoadingIndicator/center";

import {
  GroupMatchingPublicApi,
  SubmitAnswerRequestDto,
} from "../../../api/public/groupMatching";
import { extractErrorMessage } from "../../../util/extractErrorMessage";
import { DateFormats, formatDate } from "../../../util/date";
import {
  GroupType,
  ActivityFrequency,
  ActivityFrequencyLabel,
  PracticalProjectRole,
  Semester,
  SemesterLabel,
} from "../../../constant";

import GroupTypeSelector from "./GroupTypeSelector";

export default function GroupMatchingSurveyContainer() {
  const navigate = useNavigate();

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

  // Form state
  const [groupType, setGroupType] = useState<GroupType | null>(null);
  const [isPreferOnline, setIsPreferOnline] = useState<boolean>(false);
  const [activityFrequency, setActivityFrequency] = useState<ActivityFrequency>(
    ActivityFrequency.ONCE_OR_TWICE,
  );
  const [activityFormat, setActivityFormat] = useState("");
  const [otherSuggestions, setOtherSuggestions] = useState("");

  // Study-specific state
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [isCustomOptionChecked, setIsCustomOptionChecked] = useState(false);
  const [customOption, setCustomOption] = useState("");

  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Practical project state
  const [role, setRole] = useState<string>("");
  const [hasIdea, setHasIdea] = useState<boolean>(true);
  const [idea, setIdea] = useState("");

  // Query: options for study types
  const isStudyType =
    groupType === GroupType.BASIC_LANGUAGE_STUDY ||
    groupType === GroupType.PROJECT_STYLE_STUDY;

  const { data: options, status: optionsStatus } = useQuery({
    queryKey: ["group-matching-options", survey?.id, groupType],
    queryFn: () =>
      GroupMatchingPublicApi.listOptions(
        survey!.id,
        groupType as "BASIC_LANGUAGE_STUDY" | "PROJECT_STYLE_STUDY",
      ),
    enabled: !!survey && isStudyType,
    retry: 0,
  });

  // Initialize form with existing answer
  useEffect(() => {
    if (myAnswer) {
      setGroupType(myAnswer.groupType);
      setIsPreferOnline(myAnswer.isPreferOnline);
      setActivityFrequency(myAnswer.activityFrequency);
      setActivityFormat(myAnswer.activityFormat);
      setOtherSuggestions(myAnswer.otherSuggestions || "");
      setSelectedOptionIds(myAnswer.selectedOptions.map((o) => o.id));
      if (myAnswer.customOption) {
        setIsCustomOptionChecked(true);
        setCustomOption(myAnswer.customOption);
      }
      setRole(myAnswer.role || "");
      setHasIdea(myAnswer.hasIdea || false);
      setIdea(myAnswer.idea || "");
    }
  }, [myAnswer]);

  // Mutations
  const { mutateAsync: submitAnswer, isPending: isSubmitting } = useMutation({
    mutationFn: (dto: {
      groupMatchingId: string;
      data: SubmitAnswerRequestDto;
    }) => GroupMatchingPublicApi.submitAnswer(dto.groupMatchingId, dto.data),
    onSuccess: () => {
      refetchAnswer();
    },
  });

  const { mutateAsync: updateAnswer, isPending: isUpdating } = useMutation({
    mutationFn: (dto: {
      groupMatchingId: string;
      data: SubmitAnswerRequestDto;
    }) => GroupMatchingPublicApi.updateAnswer(dto.groupMatchingId, dto.data),
    onSuccess: () => {
      refetchAnswer();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);

    if (!groupType) return;
    if (isStudyType && selectedOptionIds.length === 0 && !isCustomOptionChecked) return;
    if (isCustomOptionChecked && customOption.trim() === "") return;
    if (groupType === GroupType.PRACTICAL_PROJECT && !role) return;
    if (groupType === GroupType.PRACTICAL_PROJECT && hasIdea && !idea.trim()) return;
    if (!activityFormat.trim()) return;

    const requestData = {
      activityFormat: activityFormat.trim(),
      otherSuggestions: otherSuggestions.trim() || undefined,
    } as SubmitAnswerRequestDto;
    requestData.groupType = groupType!;
    requestData.isPreferOnline = isPreferOnline;
    requestData.activityFrequency = activityFrequency;

    if (isStudyType) {
      requestData.selectedOptionIds = selectedOptionIds;
      requestData.customOption = isCustomOptionChecked
        ? customOption.trim()
        : undefined;
    }

    if (groupType === GroupType.PRACTICAL_PROJECT) {
      requestData.role = role;
      requestData.hasIdea = hasIdea;
      requestData.idea = hasIdea ? idea.trim() : undefined;
    }

    try {
      if (myAnswer) {
        await updateAnswer({
          groupMatchingId: survey!.id,
          data: requestData,
        });
        toast.success("설문 응답이 수정되었습니다.");
      } else {
        await submitAnswer({
          groupMatchingId: survey!.id,
          data: requestData,
        });
        toast.success("설문 응답이 제출되었습니다.");
      }
    } catch (error) {
      alert(extractErrorMessage(error as Error));
    }
  };

  const handleGroupTypeSelect = (type: GroupType) => {
    setGroupType(type);
    // Reset type-specific fields
    setSelectedOptionIds([]);
    setIsCustomOptionChecked(false);
    setCustomOption("");
    setRole("");
    setHasIdea(false);
    setIdea("");
  };

  const handleGroupTypeReset = () => {
    setGroupType(null);
    setSelectedOptionIds([]);
    setIsCustomOptionChecked(false);
    setCustomOption("");
    setRole("");
    setHasIdea(false);
    setIdea("");
  };

  const toggleOption = (optionId: string) => {
    if (selectedOptionIds.includes(optionId)) {
      setSelectedOptionIds([]);
    } else {
      setSelectedOptionIds([optionId]);
      setIsCustomOptionChecked(false);
    }
  };

  const handleGoToLogin = () => {
    navigate("/login?redirect=/group-matching");
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
    const is401Error =
      isAxiosError(surveyError) && surveyError.response?.status === 401;

    return (
      <Container>
        <Callout type="error">
          <Flex gap={3} align="center" justify="space-between">
            <Text flex={1}>{extractErrorMessage(surveyError)}</Text>
            {is401Error && (
              <Button onClick={handleGoToLogin} variant="danger">
                로그인
              </Button>
            )}
          </Flex>
        </Callout>
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
  if (answerStatus === "pending") {
    return (
      <Container>
        <CenterRingLoadingIndicator />
      </Container>
    );
  }

  // Answer error
  if (answerStatus === "error") {
    return (
      <Container>
        <Callout type="error">
          {extractErrorMessage(answerError as Error)}
        </Callout>
      </Container>
    );
  }

  const isReadOnly = isClosed && !!myAnswer;

  return (
    <Container>
      <Heading as="h2" size="lg" mb={5}>
        {survey.year}년 {SemesterLabel[survey.semester as Semester]} 그룹 매칭
        설문
      </Heading>

      <Text>
        안녕하세요, 쿠러그 운영진입니다!
        <br />
        <br />
        이번 학기 여러분의 원활한 활동을 위해 관심 분야를 조사합니다. 쿠러그는
        1인 이상으로 구성된 그룹 단위로 활동합니다.{" "}
        <strong>관심 분야가 겹치는 회원끼리 매칭</strong>을 해드리고 있으니,
        신중하게 답변 부탁드립니다.
        <br />
        <br />
        궁금하신 부분이 있다면{" "}
        <Link href="mailto:we_are@khlug.org">we_are@khlug.org</Link> 혹은
        운영진에게 디스코드 DM으로 문의해주세요.
      </Text>

      <Box bg="gray.50" p={4} borderRadius="md" mt={4} mb={6}>
        <Text fontSize="sm" color="gray.600">
          마감일: {formatDate(new Date(survey.closedAt), DateFormats.DATE_KOR)}
        </Text>
        {myAnswer && (
          <Text fontSize="sm" color="brand.500" fontWeight="medium" mt={1}>
            제출일:{" "}
            {formatDate(new Date(myAnswer.createdAt), DateFormats.DATE_KOR)}
            {myAnswer.updatedAt !== myAnswer.createdAt && (
              <>
                {" "}
                (수정:{" "}
                {formatDate(new Date(myAnswer.updatedAt), DateFormats.DATE_KOR)}
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
        {/* Step 1: Group Type Selection */}
        <Box>
          <Text fontWeight="semibold" fontSize="15px" mb={3}>
            Step 1. 그룹 유형 선택
          </Text>
          <GroupTypeSelector
            selectedType={groupType}
            onSelect={handleGroupTypeSelect}
            onReset={handleGroupTypeReset}
            disabled={isReadOnly}
          />
        </Box>

        {/* Step 2: Type-specific Questions */}
        {groupType && (
          <Box>
            <Text fontWeight="semibold" fontSize="15px" mb={3}>
              Step 2. 세부 질문
            </Text>

            {/* Study types: option selection */}
            {isStudyType && (
              <VStack gap={4} align="stretch">
                <Box>
                  <Text fontSize="sm" color="gray.600" mb={2}>
                    관심 있는 분야를 선택해주세요. (1개만 선택 가능)
                  </Text>
                  {optionsStatus === "pending" ? (
                    <CenterRingLoadingIndicator />
                  ) : (
                    <SimpleGrid
                      columns={{ base: 1, md: 2, lg: 3 }}
                      gap={3}
                      p={4}
                      bg="gray.50"
                      borderRadius="md"
                      border={
                        hasAttemptedSubmit &&
                        selectedOptionIds.length === 0 &&
                        !isCustomOptionChecked
                          ? "1px solid"
                          : undefined
                      }
                      borderColor="red.400"
                    >
                      {options?.map((option) => (
                        <Checkbox.Root
                          key={option.id}
                          checked={selectedOptionIds.includes(option.id)}
                          onCheckedChange={() => toggleOption(option.id)}
                          disabled={isReadOnly}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control>
                            <Checkbox.Indicator />
                          </Checkbox.Control>
                          <Checkbox.Label>{option.name}</Checkbox.Label>
                        </Checkbox.Root>
                      ))}
                      <Checkbox.Root
                        checked={isCustomOptionChecked}
                        onCheckedChange={(details) => {
                          const checked = details.checked === true;
                          setIsCustomOptionChecked(checked);
                          if (checked) setSelectedOptionIds([]);
                        }}
                        disabled={isReadOnly}
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                        <Checkbox.Label>기타</Checkbox.Label>
                      </Checkbox.Root>
                    </SimpleGrid>
                  )}
                  {hasAttemptedSubmit &&
                    selectedOptionIds.length === 0 &&
                    !isCustomOptionChecked && (
                      <Text fontSize="sm" color="red.500" mt={1}>
                        관심 분야를 선택해주세요.
                      </Text>
                    )}
                </Box>
                {isCustomOptionChecked && (
                  <Field.Root
                    invalid={
                      hasAttemptedSubmit && customOption.trim() === ""
                    }
                  >
                    <Input
                      value={customOption}
                      onChange={(e) => setCustomOption(e.target.value)}
                      placeholder="직접 입력해주세요"
                      disabled={isReadOnly}
                    />
                    <Text fontSize="xs" color="orange.500" mt={1}>
                      기타 항목은 매칭 확률이 낮을 수 있어요
                    </Text>
                    <Field.ErrorText>내용을 입력해주세요.</Field.ErrorText>
                  </Field.Root>
                )}
              </VStack>
            )}

            {/* Practical project: role and idea */}
            {groupType === GroupType.PRACTICAL_PROJECT && (
              <VStack gap={5} align="stretch">
                <Field.Root invalid={hasAttemptedSubmit && !role}>
                  <Text fontSize="sm" color="gray.600" mb={2}>
                    역할을 선택해주세요.
                  </Text>
                  <RadioGroup.Root
                    value={role}
                    onValueChange={(details) => setRole(details.value ?? "")}
                    disabled={isReadOnly}
                  >
                    <VStack gap={2} align="stretch">
                      {Object.values(PracticalProjectRole).map((r) => (
                        <RadioGroup.Item key={r} value={r}>
                          <RadioGroup.ItemHiddenInput />
                          <RadioGroup.ItemControl />
                          <RadioGroup.ItemText>{r}</RadioGroup.ItemText>
                        </RadioGroup.Item>
                      ))}
                    </VStack>
                  </RadioGroup.Root>
                  <Field.ErrorText>역할을 선택해주세요.</Field.ErrorText>
                </Field.Root>

                <Box>
                  <Text fontSize="sm" color="gray.600" mb={2}>
                    진행하고 싶은 아이디어가 있나요?
                  </Text>
                  <RadioGroup.Root
                    value={hasIdea ? "yes" : "no"}
                    onValueChange={(details) =>
                      setHasIdea(details.value === "yes")
                    }
                    disabled={isReadOnly}
                  >
                    <HStack gap={6}>
                      <RadioGroup.Item value="yes">
                        <RadioGroup.ItemHiddenInput />
                        <RadioGroup.ItemControl />
                        <RadioGroup.ItemText>예</RadioGroup.ItemText>
                      </RadioGroup.Item>
                      <RadioGroup.Item value="no">
                        <RadioGroup.ItemHiddenInput />
                        <RadioGroup.ItemControl />
                        <RadioGroup.ItemText>아니오</RadioGroup.ItemText>
                      </RadioGroup.Item>
                    </HStack>
                  </RadioGroup.Root>
                  {hasIdea && (
                    <Field.Root invalid={hasAttemptedSubmit && !idea.trim()} mt={3}>
                      <Textarea
                        value={idea}
                        onChange={(e) => setIdea(e.target.value)}
                        placeholder="아이디어를 간단히 설명해주세요"
                        rows={3}
                        disabled={isReadOnly}
                      />
                      <Field.ErrorText>아이디어를 입력해주세요.</Field.ErrorText>
                    </Field.Root>
                  )}
                </Box>
              </VStack>
            )}
          </Box>
        )}

        {/* Step 3: Common Questions */}
        {groupType && (
          <Box>
            <Text fontWeight="semibold" fontSize="15px" mb={3}>
              Step 3. 공통 질문
            </Text>
            <VStack gap={5} align="stretch">
              {/* Online preference */}
              <Box>
                <Text fontSize="sm" color="gray.600" mb={2}>
                  활동 방식 선호
                </Text>
                <RadioGroup.Root
                  value={isPreferOnline ? "online" : "offline"}
                  onValueChange={(details) =>
                    setIsPreferOnline(details.value === "online")
                  }
                  disabled={isReadOnly}
                >
                  <HStack gap={6}>
                    <RadioGroup.Item value="offline">
                      <RadioGroup.ItemHiddenInput />
                      <RadioGroup.ItemControl />
                      <RadioGroup.ItemText>오프라인</RadioGroup.ItemText>
                    </RadioGroup.Item>
                    <RadioGroup.Item value="online">
                      <RadioGroup.ItemHiddenInput />
                      <RadioGroup.ItemControl />
                      <RadioGroup.ItemText>온라인</RadioGroup.ItemText>
                    </RadioGroup.Item>
                  </HStack>
                </RadioGroup.Root>
              </Box>

              {/* Activity frequency */}
              <Box>
                <Text fontSize="sm" color="gray.600" mb={2}>
                  활동 빈도
                </Text>
                <RadioGroup.Root
                  value={activityFrequency}
                  onValueChange={(details) =>
                    setActivityFrequency(details.value as ActivityFrequency)
                  }
                  disabled={isReadOnly}
                >
                  <VStack gap={2} align="stretch">
                    {Object.entries(ActivityFrequencyLabel).map(
                      ([value, label]) => (
                        <RadioGroup.Item key={value} value={value}>
                          <RadioGroup.ItemHiddenInput />
                          <RadioGroup.ItemControl />
                          <RadioGroup.ItemText>{label}</RadioGroup.ItemText>
                        </RadioGroup.Item>
                      ),
                    )}
                  </VStack>
                </RadioGroup.Root>
              </Box>

              {/* Activity format */}
              <Field.Root invalid={hasAttemptedSubmit && !activityFormat.trim()}>
                <Text fontSize="sm" color="gray.600" mb={2}>
                  기대하는 활동 형태
                </Text>
                <Textarea
                  value={activityFormat}
                  onChange={(e) => setActivityFormat(e.target.value)}
                  placeholder="예: 책 보고 따라가는 형태, 바이브 코딩, 해커톤 스타일 등"
                  rows={3}
                  disabled={isReadOnly}
                />
                <Field.ErrorText>기대하는 활동 형태를 입력해주세요.</Field.ErrorText>
              </Field.Root>

              {/* Other suggestions */}
              <Box>
                <Text fontSize="sm" color="gray.600" mb={2}>
                  기타 건의사항 (선택)
                </Text>
                <Textarea
                  value={otherSuggestions}
                  onChange={(e) => setOtherSuggestions(e.target.value)}
                  placeholder="운영진에게 전달하고 싶은 내용이 있다면 자유롭게 작성해주세요"
                  rows={3}
                  disabled={isReadOnly}
                />
              </Box>
            </VStack>
          </Box>
        )}

        {!isReadOnly && groupType && (
          <Box>
            <Button type="submit" disabled={isSubmitting || isUpdating}>
              {myAnswer ? "수정하기" : "제출하기"}
            </Button>
          </Box>
        )}
      </VStack>
    </Container>
  );
}
