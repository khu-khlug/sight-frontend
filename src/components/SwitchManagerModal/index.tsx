import { ManageUserApiDto } from "../../api/manage/user";
import BaseModal from "../BaseModal";
import Button from "../Button";

import styles from "./style.module.css";

type Props = {
  isOpen: boolean;
  targetUser: ManageUserApiDto["UserResponse"];
  onConfirm: () => void;
  onCancel: () => void;
};

export default function SwitchManagerModal({
  isOpen,
  targetUser,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <BaseModal isOpen={isOpen}>
      <div className={styles["modal-content"]}>
        <h2>{targetUser.manager ? "운영진 업무 종료" : "운영진 임명"}</h2>
        <p>
          {targetUser.manager
            ? `${targetUser.profile.name} 님의 운영진 업무를 종료시키시겠습니까?`
            : `${targetUser.profile.name} 님을 운영진으로 임명하시겠습니까?`}
          <br />
          대상이 맞는지 다시 한 번 확인해주세요.
        </p>
        <div className={styles["target-user-info"]}>
          <ul>
            <li>이름: {targetUser.profile.name}</li>
            <li>학번: {targetUser.profile.number}</li>
            <li>학과: {targetUser.profile.college}</li>
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
