import { useRef, useState } from "react";
import TargetUserConfirmationModal from "../TargetUserConfirmationModal";

import styles from "./style.module.css";
import dayjs from "dayjs";

type Props = {
  isOpen: boolean;
  toBeStopped: boolean;
  targetUserProfile: {
    name: string;
    number: number;
    college: string;
  };
  onConfirm: (reason: string, returnAt: Date) => void;
  onCancel: () => void;
};

export default function SwitchStoppedModal({
  isOpen,
  toBeStopped,
  targetUserProfile,
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
      title={toBeStopped ? "정지 처리" : "복귀 처리"}
      targetUserProfile={targetUserProfile}
      onConfirm={handleConfirm}
      onCancel={onCancel}
    >
      <form ref={formRef} className={styles["content"]}>
        {toBeStopped ? (
          <>
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
            <p>
              활동 정지 시 의무 납부 대상 및 info21 미인증 대상 산출에서
              제외되며, 해당 날짜 자정에 자동으로 해제됩니다.
            </p>
          </>
        ) : (
          <>
            <p>
              {targetUserProfile.name} 님이 복귀하신 것으로 확인되었습니까? 복귀
              시 의무 납부 대상 및 info21 미인증 대상 산출에 포함됩니다.
            </p>
          </>
        )}
        <p>대상이 맞는지 다시 한 번 확인해주세요.</p>
      </form>
    </TargetUserConfirmationModal>
  );
}
