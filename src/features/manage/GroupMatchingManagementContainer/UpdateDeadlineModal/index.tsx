import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  VStack,
  HStack,
  Input,
  Text,
  Box,
} from "@chakra-ui/react";

import BaseModal from "../../../../components/BaseModal";
import Button from "../../../../components/Button";
import Callout from "../../../../components/Callout";

import {
  GroupMatchingManageApi,
  type GroupMatchingManageApiDto,
} from "../../../../api/manage/groupMatching";
import { extractErrorMessage } from "../../../../util/extractErrorMessage";

type Props = {
  isOpen: boolean;
  survey: GroupMatchingManageApiDto["GroupMatchingResponse"];
  onClose: () => void;
  onSuccess: () => void;
};

export default function UpdateDeadlineModal({
  isOpen,
  survey,
  onClose,
  onSuccess,
}: Props) {
  const currentDeadline = survey.closedAt.split("T")[0]; // Extract YYYY-MM-DD
  const [closedAt, setClosedAt] = useState(currentDeadline);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { mutateAsync: updateSurvey, isPending } = useMutation({
    mutationFn: (dto: GroupMatchingManageApiDto["UpdateClosedAtRequest"]) =>
      GroupMatchingManageApi.updateGroupMatchingClosedAt(survey.id, dto),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!closedAt) {
      setErrorMessage("마감일을 입력해주세요.");
      return;
    }

    try {
      await updateSurvey({
        closedAt: new Date(closedAt).toISOString(),
      });
      alert("마감일이 변경되었습니다.");
      onSuccess();
    } catch (error) {
      setErrorMessage(extractErrorMessage(error as Error));
    }
  };

  return (
    <BaseModal isOpen={isOpen} onRequestClose={onClose}>
      <Dialog.Header p={0} mb={4}>
        <Dialog.Title fontSize="lg" fontWeight="semibold">
          마감일 변경
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
            <Text fontWeight="medium">새 마감일</Text>
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
                변경하기
              </Button>
            </HStack>
          </Dialog.Footer>
        </VStack>
      </Dialog.Body>
    </BaseModal>
  );
}
