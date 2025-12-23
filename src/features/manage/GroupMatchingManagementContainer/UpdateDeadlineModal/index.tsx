import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import BaseModal from "../../../../components/BaseModal";
import Button from "../../../../components/Button";
import Callout from "../../../../components/Callout";

import {
  GroupMatchingManageApi,
  type GroupMatchingManageApiDto,
} from "../../../../api/manage/groupMatching";
import { extractErrorMessage } from "../../../../util/extractErrorMessage";

import styles from "./style.module.css";

type Props = {
  isOpen: boolean;
  survey: GroupMatchingManageApiDto["GroupMatchingDto"];
  onClose: () => void;
  onSuccess: () => void;
};

export default function UpdateDeadlineModal({
  isOpen,
  survey,
  onClose,
  onSuccess,
}: Props) {
  const currentDeadline = survey.closedAt.split("T")[0]; // Extract YYYY-MM-DD
  const [closedAt, setClosedAt] = useState(currentDeadline);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { mutateAsync: updateSurvey, isPending } = useMutation({
    mutationFn: (dto: GroupMatchingManageApiDto["UpdateGroupMatchingRequestDto"]) =>
      GroupMatchingManageApi.updateGroupMatching(survey.id, dto),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!closedAt) {
      setErrorMessage("마감일을 입력해주세요.");
      return;
    }

    try {
      await updateSurvey({
        closedAt: new Date(closedAt).toISOString(),
      });
      alert("마감일이 변경되었습니다.");
      onSuccess();
    } catch (error) {
      setErrorMessage(extractErrorMessage(error as Error));
    }
  };

  return (
    <BaseModal isOpen={isOpen} onRequestClose={onClose}>
      <h3 className={styles["title"]}>마감일 변경</h3>

      {errorMessage && <Callout type="error">{errorMessage}</Callout>}

      <form onSubmit={handleSubmit} className={styles["form"]}>
        <div className={styles["form-group"]}>
          <label>새 마감일</label>
          <input
            type="date"
            value={closedAt}
            onChange={(e) => setClosedAt(e.target.value)}
            className={styles["input"]}
            required
          />
        </div>

        <div className={styles["button-group"]}>
          <Button variant="neutral" onClick={onClose} type="button">
            취소
          </Button>
          <Button type="submit" disabled={isPending}>
            변경하기
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
