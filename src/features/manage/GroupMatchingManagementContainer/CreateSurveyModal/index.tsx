import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import BaseModal from "../../../../components/BaseModal";
import Button from "../../../../components/Button";
import Callout from "../../../../components/Callout";

import { GroupMatchingManageApi } from "../../../../api/manage/groupMatching";
import { extractErrorMessage } from "../../../../util/extractErrorMessage";
import { Semester } from "../../../../constant";

import styles from "./style.module.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function CreateSurveyModal({ isOpen, onClose, onSuccess }: Props) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [semester, setSemester] = useState<Semester>(Semester.FIRST);
  const [closedAt, setClosedAt] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { mutateAsync: createSurvey, isPending } = useMutation({
    mutationFn: GroupMatchingManageApi.createGroupMatching,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!closedAt) {
      setErrorMessage("마감일을 입력해주세요.");
      return;
    }

    try {
      await createSurvey({
        year,
        semester,
        closedAt: new Date(closedAt).toISOString(),
      });
      alert("설문이 생성되었습니다.");
      onSuccess();
    } catch (error) {
      setErrorMessage(extractErrorMessage(error as Error));
    }
  };

  return (
    <BaseModal isOpen={isOpen} onRequestClose={onClose}>
      <h3 className={styles["title"]}>새 설문 생성</h3>

      {errorMessage && <Callout type="error">{errorMessage}</Callout>}

      <form onSubmit={handleSubmit} className={styles["form"]}>
        <div className={styles["form-group"]}>
          <label>연도</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            min={currentYear - 1}
            max={currentYear + 1}
            className={styles["input"]}
            required
          />
        </div>

        <div className={styles["form-group"]}>
          <label>학기</label>
          <select
            value={semester}
            onChange={(e) => setSemester(Number(e.target.value) as Semester)}
            className={styles["select"]}
            required
          >
            <option value={Semester.FIRST}>1학기</option>
            <option value={Semester.SECOND}>2학기</option>
          </select>
        </div>

        <div className={styles["form-group"]}>
          <label>마감일</label>
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
            생성하기
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
