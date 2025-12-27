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

import { GroupMatchingManageApi } from "../../../../api/manage/groupMatching";
import { extractErrorMessage } from "../../../../util/extractErrorMessage";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function CreateFieldModal({ isOpen, onClose, onSuccess }: Props) {
  const [fieldName, setFieldName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { mutateAsync: createField, isPending } = useMutation({
    mutationFn: GroupMatchingManageApi.createField,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (fieldName.trim() === "") {
      setErrorMessage("분야 이름을 입력해주세요.");
      return;
    }

    try {
      await createField({ fieldName: fieldName.trim() });
      alert("분야가 추가되었습니다.");
      onSuccess();
    } catch (error) {
      setErrorMessage(extractErrorMessage(error as Error));
    }
  };

  return (
    <BaseModal isOpen={isOpen} onRequestClose={onClose}>
      <Dialog.Header p={0} mb={4}>
        <Dialog.Title fontSize="lg" fontWeight="semibold">
          분야 추가
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
              placeholder="예: 클라우드 컴퓨팅"
              required
            />
          </VStack>

          <Dialog.Footer p={0} mt={2}>
            <HStack gap={3} justify="flex-end">
              <Button variant="neutral" onClick={onClose} type="button">
                취소
              </Button>
              <Button type="submit" disabled={isPending}>
                추가하기
              </Button>
            </HStack>
          </Dialog.Footer>
        </VStack>
      </Dialog.Body>
    </BaseModal>
  );
}
