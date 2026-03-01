import { Heading } from "@chakra-ui/react";
import BaseModal from "../../../../components/BaseModal";
import Button from "../../../../components/Button";

import styles from "./style.module.css";

type Props = {
  isOpen: boolean;
  targetUserProfile: {
    name: string;
    number: number;
    college: string;
  };
  title: string;
  children: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function TargetUserConfirmationModal({
  isOpen,
  targetUserProfile,
  title,
  children,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <BaseModal isOpen={isOpen}>
      <div className={styles["modal-content"]}>
        <Heading as="h2" size="xl">{title}</Heading>
        {children}
        <div className={styles["target-user-info"]}>
          <ul>
            <li>이름: {targetUserProfile.name}</li>
            <li>학번: {targetUserProfile.number}</li>
            <li>학과: {targetUserProfile.college}</li>
          </ul>
        </div>
        <div className={styles["button-group"]}>
          <Button variant="neutral" onClick={onCancel}>
            취소
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            확인
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
