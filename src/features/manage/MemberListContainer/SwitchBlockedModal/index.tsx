import TargetUserConfirmationModal from "../TargetUserConfirmationModal";

import styles from "./style.module.css";

type Props = {
  isOpen: boolean;
  toBeBlocked: boolean;
  targetUserProfile: {
    name: string;
    number: number;
    college: string;
  };
  onConfirm: () => void;
  onCancel: () => void;
};

export default function SwitchBlockedModal({
  isOpen,
  toBeBlocked,
  targetUserProfile,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <TargetUserConfirmationModal
      isOpen={isOpen}
      title={toBeBlocked ? "접속 차단" : "차단 해제"}
      targetUserProfile={targetUserProfile}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <p className={styles["content"]}>
        {toBeBlocked
          ? `${targetUserProfile.name} 님의 접속을 정말로 차단하시겠습니까?`
          : `${targetUserProfile.name} 님에게 적용된 접속 차단을 해제하시겠습니까?`}
        <br />
        대상이 맞는지 다시 한 번 확인해주세요.
      </p>
    </TargetUserConfirmationModal>
  );
}
