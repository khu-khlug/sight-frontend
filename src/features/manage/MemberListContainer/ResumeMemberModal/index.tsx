import { Text } from "@chakra-ui/react";
import TargetUserConfirmationModal from "../TargetUserConfirmationModal";

type Props = {
  isOpen: boolean;
  targetUserProfile: {
    name: string;
    number: number;
    college: string;
  };
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ResumeMemberModal({
  isOpen,
  targetUserProfile,
  isLoading,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <TargetUserConfirmationModal
      isOpen={isOpen}
      title="복귀 처리"
      targetUserProfile={targetUserProfile}
      isLoading={isLoading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <Text mt={2}>
        {targetUserProfile.name} 님이 복귀하신 것으로 확인되었습니까? 복귀 시
        의무 납부 대상 및 info21 미인증 대상 산출에 포함됩니다.
      </Text>
      <Text mt={2}>대상이 맞는지 다시 한 번 확인해주세요.</Text>
    </TargetUserConfirmationModal>
  );
}
