import TargetUserConfirmationModal from "../TargetUserConfirmationModal";

import styles from "./style.module.css";

type Props = {
  isOpen: boolean;
  toBeManager: boolean;
  targetUserProfile: {
    name: string;
    number: number;
    college: string;
  };
  onConfirm: () => void;
  onCancel: () => void;
};

export default function SwitchManagerModal({
  isOpen,
  toBeManager,
  targetUserProfile,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <TargetUserConfirmationModal
      isOpen={isOpen}
      title={toBeManager ? "운영진 임명" : "운영진 업무 종료"}
      targetUserProfile={targetUserProfile}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <p className={styles["content"]}>
        {toBeManager
          ? `${targetUserProfile.name} 님을 운영진으로 임명하시겠습니까?`
          : `${targetUserProfile.name} 님의 운영진 업무를 종료시키시겠습니까?`}
        <br />
        대상이 맞는지 다시 한 번 확인해주세요.
      </p>
    </TargetUserConfirmationModal>
  );
}
