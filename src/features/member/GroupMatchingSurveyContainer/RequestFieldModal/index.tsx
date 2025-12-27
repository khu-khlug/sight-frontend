import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  VStack,
  HStack,
  Input,
  Textarea,
  Text,
  Box,
} from "@chakra-ui/react";

import BaseModal from "../../../../components/BaseModal";
import Button from "../../../../components/Button";
import Callout from "../../../../components/Callout";

import { GroupMatchingPublicApi } from "../../../../api/public/groupMatching";
import { extractErrorMessage } from "../../../../util/extractErrorMessage";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function RequestFieldModal({ isOpen, onClose }: Props) {
  const [fieldName, setFieldName] = useState("");
  const [requestReason, setRequestReason] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { mutateAsync: createFieldRequest, isPending } = useMutation({
    mutationFn: GroupMatchingPublicApi.createFieldRequest,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (fieldName.trim() === "" || requestReason.trim() === "") {
      setErrorMessage("모든 항목을 입력해주세요.");
      return;
    }

    try {
      await createFieldRequest({
        fieldName: fieldName.trim(),
        requestReason: requestReason.trim(),
      });
      alert("분야 추가 요청이 제출되었습니다. 운영진 검토 후 반영됩니다.");
      setFieldName("");
      setRequestReason("");
      onClose();
    } catch (error) {
      setErrorMessage(extractErrorMessage(error as Error));
    }
  };

  return (
    <BaseModal isOpen={isOpen} onRequestClose={onClose}>
      <Dialog.Header p={0} mb={4}>
        <Dialog.Title fontSize="lg" fontWeight="semibold">
          새 분야 요청
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
            <Text fontWeight="medium">분야 이름</Text>
            <Input
              type="text"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              placeholder="예: 웹 프론트엔드"
              required
            />
          </VStack>

          <VStack align="stretch" gap={2}>
            <Text fontWeight="medium">요청 사유</Text>
            <Textarea
              value={requestReason}
              onChange={(e) => setRequestReason(e.target.value)}
              placeholder="이 분야가 필요한 이유를 간단히 설명해주세요."
              rows={4}
              required
            />
          </VStack>

          <Dialog.Footer p={0} mt={2}>
            <HStack gap={3} justify="flex-end">
              <Button variant="neutral" onClick={onClose} type="button">
                취소
              </Button>
              <Button type="submit" disabled={isPending}>
                요청하기
              </Button>
            </HStack>
          </Dialog.Footer>
        </VStack>
      </Dialog.Body>
    </BaseModal>
  );
}
