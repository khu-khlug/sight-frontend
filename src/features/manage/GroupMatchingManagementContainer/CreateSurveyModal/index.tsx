import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  VStack,
  HStack,
  Input,
  Text,
  Box,
  NativeSelectRoot,
  NativeSelectField,
} from "@chakra-ui/react";

import BaseModal from "../../../../components/BaseModal";
import Button from "../../../../components/Button";
import Callout from "../../../../components/Callout";

import { GroupMatchingManageApi } from "../../../../api/manage/groupMatching";
import { extractErrorMessage } from "../../../../util/extractErrorMessage";
import { Semester } from "../../../../constant";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function CreateSurveyModal({ isOpen, onClose, onSuccess }: Props) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [semester, setSemester] = useState<Semester>(Semester.FIRST);
  const [closedAt, setClosedAt] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { mutateAsync: createSurvey, isPending } = useMutation({
    mutationFn: GroupMatchingManageApi.createGroupMatching,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!closedAt) {
      setErrorMessage("마감일을 입력해주세요.");
      return;
    }

    try {
      await createSurvey({
        year,
        semester,
        closedAt: new Date(closedAt).toISOString(),
      });
      alert("설문이 생성되었습니다.");
      onSuccess();
    } catch (error) {
      setErrorMessage(extractErrorMessage(error as Error));
    }
  };

  return (
    <BaseModal isOpen={isOpen} onRequestClose={onClose}>
      <Dialog.Header p={0} mb={4}>
        <Dialog.Title fontSize="lg" fontWeight="semibold">
          새 설문 생성
        </Dialog.Title>
      </Dialog.Header>

      <Dialog.Body p={0}>
        {errorMessage && (
          <Box mb={4}>
            <Callout type="error">{errorMessage}</Callout>
          </Box>
        )}

        <VStack as="form" onSubmit={handleSubmit} gap={4} align="stretch">
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

          <Dialog.Footer p={0} mt={2}>
            <HStack gap={3} justify="flex-end">
              <Button variant="neutral" onClick={onClose} type="button">
                취소
              </Button>
              <Button type="submit" disabled={isPending}>
                생성하기
              </Button>
            </HStack>
          </Dialog.Footer>
        </VStack>
      </Dialog.Body>
    </BaseModal>
  );
}
