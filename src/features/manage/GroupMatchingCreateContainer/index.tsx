import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  VStack,
  HStack,
  Input,
  Text,
  Box,
  NativeSelectRoot,
  NativeSelectField,
  IconButton,
  Heading,
} from "@chakra-ui/react";
import { X } from "lucide-react";

import Container from "../../../components/Container";
import Button from "../../../components/Button";
import Callout from "../../../components/Callout";

import {
  GroupMatchingManageApi,
  CreateGroupMatchingOptionInput,
} from "../../../api/manage/groupMatching";
import { extractErrorMessage } from "../../../util/extractErrorMessage";
import { Semester } from "../../../constant";

export default function GroupMatchingCreateContainer() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const [year, setYear] = useState(currentYear);
  const [semester, setSemester] = useState<Semester>(Semester.FIRST);
  const [closedAt, setClosedAt] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [basicOptions, setBasicOptions] = useState<string[]>([""]);
  const [projectOptions, setProjectOptions] = useState<string[]>([""]);
  const [copySourceId, setCopySourceId] = useState<string>("");

  const { data: groupMatchingsData } = useQuery({
    queryKey: ["group-matchings-admin"],
    queryFn: GroupMatchingManageApi.listGroupMatchings,
    retry: 0,
  });

  const { mutateAsync: createSurvey, isPending } = useMutation({
    mutationFn: GroupMatchingManageApi.createGroupMatching,
  });

  const handleCopyFromPrevious = async () => {
    if (!copySourceId) {
      alert("복사할 그룹 매칭을 선택해주세요.");
      return;
    }
    try {
      const [basicOpts, projectOpts] = await Promise.all([
        GroupMatchingManageApi.listOptions(copySourceId, "BASIC_LANGUAGE_STUDY"),
        GroupMatchingManageApi.listOptions(copySourceId, "PROJECT_STYLE_STUDY"),
      ]);
      if (basicOpts.length > 0) setBasicOptions(basicOpts.map((o) => o.name));
      if (projectOpts.length > 0)
        setProjectOptions(projectOpts.map((o) => o.name));
      alert("이전 그룹 매칭의 옵션을 복사했습니다.");
    } catch (error) {
      alert(extractErrorMessage(error as Error));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!closedAt) {
      setErrorMessage("마감일을 입력해주세요.");
      return;
    }

    const filteredBasic = basicOptions.filter((o) => o.trim() !== "");
    const filteredProject = projectOptions.filter((o) => o.trim() !== "");

    const options: CreateGroupMatchingOptionInput[] = [
      ...filteredBasic.map((name) => ({
        name: name.trim(),
        type: "BASIC_LANGUAGE_STUDY" as const,
      })),
      ...filteredProject.map((name) => ({
        name: name.trim(),
        type: "PROJECT_STYLE_STUDY" as const,
      })),
    ];

    try {
      await createSurvey({
        year,
        semester,
        closedAt: closedAt,
        options,
      });
      navigate("/manage/group-matching");
    } catch (error) {
      setErrorMessage(extractErrorMessage(error as Error));
    }
  };

  return (
    <Container>
      <Heading as="h2" size="lg" mb={6}>
        그룹 매칭 생성
      </Heading>

      {errorMessage && (
        <Box mb={4}>
          <Callout type="error">{errorMessage}</Callout>
        </Box>
      )}

      <VStack as="form" onSubmit={handleSubmit} gap={6} align="stretch">
        <VStack align="stretch" gap={2}>
          <Text fontWeight="medium">연도</Text>
          <Input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            min={currentYear - 1}
            max={currentYear + 1}
            required
          />
        </VStack>

        <VStack align="stretch" gap={2}>
          <Text fontWeight="medium">학기</Text>
          <NativeSelectRoot>
            <NativeSelectField
              value={semester}
              onChange={(e) => setSemester(Number(e.target.value) as Semester)}
            >
              <option value={Semester.FIRST}>1학기</option>
              <option value={Semester.SECOND}>2학기</option>
            </NativeSelectField>
          </NativeSelectRoot>
        </VStack>

        <VStack align="stretch" gap={2}>
          <Text fontWeight="medium">마감일</Text>
          <Input
            type="date"
            value={closedAt}
            onChange={(e) => setClosedAt(e.target.value)}
            required
          />
        </VStack>

        {groupMatchingsData && groupMatchingsData.groupMatchings.length > 0 && (
          <VStack align="stretch" gap={2}>
            <Text fontWeight="medium">이전 매칭에서 옵션 복사</Text>
            <HStack>
              <NativeSelectRoot>
                <NativeSelectField
                  value={copySourceId}
                  onChange={(e) => setCopySourceId(e.target.value)}
                >
                  <option value="">선택</option>
                  {groupMatchingsData.groupMatchings.map((gm) => (
                    <option key={gm.id} value={gm.id}>
                      {gm.year}년 {gm.semester}학기
                    </option>
                  ))}
                </NativeSelectField>
              </NativeSelectRoot>
              <Button type="button" variant="neutral" onClick={handleCopyFromPrevious}>
                복사
              </Button>
            </HStack>
          </VStack>
        )}

        <VStack align="stretch" gap={2}>
          <Text fontWeight="medium">기초 언어 스터디 옵션</Text>
          {basicOptions.map((opt, index) => (
            <HStack key={index}>
              <Input
                value={opt}
                onChange={(e) => {
                  const next = [...basicOptions];
                  next[index] = e.target.value;
                  setBasicOptions(next);
                }}
                placeholder={`옵션 ${index + 1}`}
              />
              {basicOptions.length > 1 && (
                <IconButton
                  type="button"
                  onClick={() =>
                    setBasicOptions(basicOptions.filter((_, i) => i !== index))
                  }
                  aria-label="Remove option"
                  variant="ghost"
                  colorPalette="red"
                  size="sm"
                >
                  <X size={16} />
                </IconButton>
              )}
            </HStack>
          ))}
          <Button
            type="button"
            variant="neutral"
            onClick={() => setBasicOptions([...basicOptions, ""])}
          >
            옵션 추가
          </Button>
        </VStack>

        <VStack align="stretch" gap={2}>
          <Text fontWeight="medium">프로젝트형 스터디 옵션</Text>
          {projectOptions.map((opt, index) => (
            <HStack key={index}>
              <Input
                value={opt}
                onChange={(e) => {
                  const next = [...projectOptions];
                  next[index] = e.target.value;
                  setProjectOptions(next);
                }}
                placeholder={`옵션 ${index + 1}`}
              />
              {projectOptions.length > 1 && (
                <IconButton
                  type="button"
                  onClick={() =>
                    setProjectOptions(
                      projectOptions.filter((_, i) => i !== index)
                    )
                  }
                  aria-label="Remove option"
                  variant="ghost"
                  colorPalette="red"
                  size="sm"
                >
                  <X size={16} />
                </IconButton>
              )}
            </HStack>
          ))}
          <Button
            type="button"
            variant="neutral"
            onClick={() => setProjectOptions([...projectOptions, ""])}
          >
            옵션 추가
          </Button>
        </VStack>

        <HStack gap={3} justify="flex-end">
          <Button
            variant="neutral"
            type="button"
            onClick={() => navigate("/manage/group-matching")}
          >
            취소
          </Button>
          <Button type="submit" disabled={isPending}>
            생성하기
          </Button>
        </HStack>
      </VStack>
    </Container>
  );
}
