import { Box, Heading, HStack, List } from "@chakra-ui/react";
import BaseModal from "../../../../components/BaseModal";
import Button from "../../../../components/Button";

type Props = {
  isOpen: boolean;
  targetUserProfile: {
    name: string;
    number: number;
    college: string;
  };
  title: string;
  children: React.ReactNode;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function TargetUserConfirmationModal({
  isOpen,
  targetUserProfile,
  title,
  children,
  isLoading,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <BaseModal isOpen={isOpen}>
      <Heading as="h2" size="xl" textAlign="center">{title}</Heading>
      <Box mt="8px">{children}</Box>
      <Box
        mt="8px"
        bg="#00000009"
        border="1px solid #00000010"
        backgroundClip="padding-box"
        borderRadius="8px"
        p="16px"
      >
        <List.Root pl="16px" m="0">
          <List.Item>이름: {targetUserProfile.name}</List.Item>
          <List.Item mt="4px">학번: {targetUserProfile.number}</List.Item>
          <List.Item mt="4px">학과: {targetUserProfile.college}</List.Item>
        </List.Root>
      </Box>
      <HStack justify="center" gap="16px" mt="20px">
        <Button variant="neutral" onClick={onCancel}>
          취소
        </Button>
        <Button variant="primary" loading={isLoading} onClick={onConfirm}>
          확인
        </Button>
      </HStack>
    </BaseModal>
  );
}
