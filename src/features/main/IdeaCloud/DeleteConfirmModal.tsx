import { Box, Text } from "@chakra-ui/react";
import BaseModal from "../../../components/BaseModal";
import Button from "../../../components/Button";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
};

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: Props) {
  return (
    <BaseModal isOpen={isOpen} onRequestClose={onClose}>
      <Box display="flex" flexDirection="column" gap="16px">
        <Text fontSize="lg" fontWeight="bold">
          아이디어 삭제
        </Text>
        <Text>이 아이디어를 삭제하시겠습니까?</Text>
        <Box display="flex" justifyContent="flex-end" gap="8px">
          <Button variant="neutral" onClick={onClose} disabled={isLoading}>
            취소
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={isLoading}
            loading={isLoading}
          >
            삭제
          </Button>
        </Box>
      </Box>
    </BaseModal>
  );
}
