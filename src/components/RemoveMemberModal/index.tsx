import TargetUserConfirmationModal from "../TargetUserConfirmationModal";

import styles from "./style.module.css";

type Props = {
  isOpen: boolean;
  targetUserProfile: {
    name: string;
    number: number;
    college: string;
  };
  onConfirm: () => void;
  onCancel: () => void;
};

export default function RemoveMemberModal({
  isOpen,
  targetUserProfile,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <TargetUserConfirmationModal
      isOpen={isOpen}
      title="회원 제명"
      targetUserProfile={targetUserProfile}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <div className={styles["content"]}>
        <p>{targetUserProfile.name} 님을 정말 쿠러그에서 제명하시겠습니까?</p>
        <p className={styles["warning-irreversible"]}>되돌릴 수 없습니다.</p>
        <p>대상이 맞는지 다시 한 번 신중히 확인해주세요.</p>
      </div>
    </TargetUserConfirmationModal>
  );
}
