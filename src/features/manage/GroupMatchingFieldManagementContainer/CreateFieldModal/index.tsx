import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import BaseModal from "../../../../components/BaseModal";
import Button from "../../../../components/Button";
import Callout from "../../../../components/Callout";

import { GroupMatchingManageApi } from "../../../../api/manage/groupMatching";
import { extractErrorMessage } from "../../../../util/extractErrorMessage";

import styles from "./style.module.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function CreateFieldModal({ isOpen, onClose, onSuccess }: Props) {
  const [fieldName, setFieldName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { mutateAsync: createField, isPending } = useMutation({
    mutationFn: GroupMatchingManageApi.createField,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (fieldName.trim() === "") {
      setErrorMessage("분야 이름을 입력해주세요.");
      return;
    }

    try {
      await createField({ name: fieldName.trim() });
      alert("분야가 추가되었습니다.");
      onSuccess();
    } catch (error) {
      setErrorMessage(extractErrorMessage(error as Error));
    }
  };

  return (
    <BaseModal isOpen={isOpen} onRequestClose={onClose}>
      <h3 className={styles["title"]}>분야 추가</h3>

      {errorMessage && <Callout type="error">{errorMessage}</Callout>}

      <form onSubmit={handleSubmit} className={styles["form"]}>
        <div className={styles["form-group"]}>
          <label>분야 이름</label>
          <input
            type="text"
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
            placeholder="예: 클라우드 컴퓨팅"
            className={styles["input"]}
            required
          />
        </div>

        <div className={styles["button-group"]}>
          <Button variant="neutral" onClick={onClose} type="button">
            취소
          </Button>
          <Button type="submit" disabled={isPending}>
            추가하기
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
