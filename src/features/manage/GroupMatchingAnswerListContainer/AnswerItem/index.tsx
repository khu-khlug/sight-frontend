import { GroupMatchingManageApiDto } from "../../../../api/manage/groupMatching";
import { GroupTypeLabel } from "../../../../constant";
import { DateFormats, formatDate } from "../../../../util/date";

import styles from "./style.module.css";

type Props = {
  answer: GroupMatchingManageApiDto["GroupMatchingAnswerWithUserDto"];
};

export default function AnswerItem({ answer }: Props) {
  return (
    <div className={styles["container"]}>
      <div className={styles["header"]}>
        <div className={styles["user-info"]}>
          <span className={styles["name"]}>{answer.userName}</span>
          <span className={styles["number"]}>{answer.userNumber}</span>
        </div>
        <span className={styles["group-type-badge"]}>
          {GroupTypeLabel[answer.groupType]}
        </span>
      </div>

      <div className={styles["content"]}>
        <div className={styles["row"]}>
          <span className={styles["label"]}>활동 방식:</span>
          <span>{answer.isPreferOnline ? "온라인 선호" : "오프라인"}</span>
        </div>

        <div className={styles["row"]}>
          <span className={styles["label"]}>관심 분야:</span>
          <div className={styles["fields"]}>
            {answer.fields.map((field) => (
              <span key={field.id} className={styles["field-chip"]}>
                {field.name}
              </span>
            ))}
          </div>
        </div>

        <div className={styles["row"]}>
          <span className={styles["label"]}>하고 싶은 주제:</span>
          <ul className={styles["subjects"]}>
            {answer.subjects.map((subject) => (
              <li key={subject.id}>{subject.subject}</li>
            ))}
          </ul>
        </div>

        <div className={styles["row"]}>
          <span className={styles["label"]}>제출일:</span>
          <span>
            {formatDate(new Date(answer.createdAt), DateFormats.DATE_KOR)}
          </span>
        </div>
      </div>
    </div>
  );
}
