import TargetUserConfirmationModal from "../TargetUserConfirmationModal";

import styles from "./style.module.css";

type Props = {
  isOpen: boolean;
  toBeGraduated: boolean;
  targetUserProfile: {
    name: string;
    number: number;
    college: string;
  };
  onConfirm: () => void;
  onCancel: () => void;
};

export default function SwitchGraduatedModal({
  isOpen,
  toBeGraduated,
  targetUserProfile,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <TargetUserConfirmationModal
      isOpen={isOpen}
      title={toBeGraduated ? "졸업 처리" : "졸업 취소 처리"}
      targetUserProfile={targetUserProfile}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <p className={styles["content"]}>
        {toBeGraduated
          ? `${targetUserProfile.name} 님이 졸업하신 것으로 확인되었습니까?`
          : `${targetUserProfile.name} 님이 아직 졸업하지 않은 것으로 확인되었습니까?`}
        <br />
        대상이 맞는지 다시 한 번 확인해주세요.
      </p>
    </TargetUserConfirmationModal>
  );
}
