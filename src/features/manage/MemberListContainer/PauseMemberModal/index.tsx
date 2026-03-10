import { useRef, useState } from "react";
import { Text } from "@chakra-ui/react";
import TargetUserConfirmationModal from "../TargetUserConfirmationModal";
import dayjs from "dayjs";

import styles from "./style.module.css";

type Props = {
  isOpen: boolean;
  targetUserProfile: {
    name: string;
    number: number;
    college: string;
  };
  isLoading?: boolean;
  onConfirm: (reason: string, returnAt: Date) => void;
  onCancel: () => void;
};

export default function PauseMemberModal({
  isOpen,
  targetUserProfile,
  isLoading,
  onConfirm,
  onCancel,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  const [reason, setReason] = useState("");
  const [date, setDate] = useState("");

  const handleConfirm = () => {
    if (formRef.current?.reportValidity()) {
      const dateOnKst = dayjs.tz(date, "Asia/Seoul").toDate();
      onConfirm(reason, dateOnKst);
    }
  };

  return (
    <TargetUserConfirmationModal
      isOpen={isOpen}
      title="정지 처리"
      targetUserProfile={targetUserProfile}
      isLoading={isLoading}
      onConfirm={handleConfirm}
      onCancel={onCancel}
    >
      <form ref={formRef} className={styles["content"]}>
        <p>
          <span>{targetUserProfile.name} 님을</span>
          <br />
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
          <span>의 사유로</span>
          <br />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <span>까지 정지 처리합니다.</span>
        </p>
        <Text mt={2}>
          활동 정지 시 의무 납부 대상 및 info21 미인증 대상 산출에서 제외되며,
          해당 날짜 자정에 자동으로 해제됩니다.
        </Text>
        <Text mt={2}>대상이 맞는지 다시 한 번 확인해주세요.</Text>
      </form>
    </TargetUserConfirmationModal>
  );
}
