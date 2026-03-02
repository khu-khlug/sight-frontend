import dayjs from "dayjs";
import { ChevronRight, Pause } from "lucide-react";

import { ManageUserApiDto } from "../../../../api/manage/user";
import { StudentStatus } from "../../../../constant";

import styles from "./style.module.css";

type SearchType = "name" | "number" | "department" | "email" | "phone";

type Props = {
  user: ManageUserApiDto["UserResponse"];
  searchType: SearchType;
  onDetailClick: () => void;
};

const StudentStatusLabel: Record<StudentStatus, string> = {
  [StudentStatus.UNITED]: "교류",
  [StudentStatus.ABSENCE]: "휴학",
  [StudentStatus.UNDERGRADUATE]: "재학",
  [StudentStatus.GRADUATE]: "졸업",
};

export default function MemberTableRow({ user, searchType, onDetailClick }: Props) {
  const isStopped = user.returnAt !== null;
  const isGraduated = user.studentStatus === StudentStatus.GRADUATE;

  const getSubLine = (): string | null => {
    if (isStopped) {
      return `~${dayjs(user.returnAt).format("YYYY/MM/DD")}`;
    }
    switch (searchType) {
      case "department":
        return user.profile.college;
      case "email":
        return user.profile.email;
      case "phone":
        return user.profile.phone;
      default:
        return null;
    }
  };

  const gradeStatusText = isGraduated
    ? "졸업"
    : `${user.profile.grade}학년 ${StudentStatusLabel[user.studentStatus]}`;

  const subLine = getSubLine();

  const rowClassName = [styles["row"], isStopped ? styles["stopped"] : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <tr className={rowClassName}>
      <td>
        <div className={styles["name-cell"]}>
          <div className={styles["name-line"]}>
            <span className={styles["name"]}>{user.profile.name}</span>
            {user.manager && (
              <span className={`${styles["badge"]} ${styles["manager-badge"]}`}>
                운영진
              </span>
            )}
            {isStopped && (
              <span className={`${styles["badge"]} ${styles["stopped-badge"]}`}>
                정지
              </span>
            )}
          </div>
          {isStopped && subLine && (
            <span className={styles["sub-line-stopped"]}>
              <Pause size={11} />
              {subLine}
            </span>
          )}
          {!isStopped && subLine && (
            <span className={styles["sub-line"]}>{subLine}</span>
          )}
        </div>
      </td>
      <td data-label="학번">{user.profile.number}</td>
      <td data-label="학년/학적">{gradeStatusText}</td>
      <td data-label="태그">
        <div className={styles["tag-list"]}>
          {user.redTags.map((tag) => (
            <span key={`${user.id}-red-${tag}`} className={`${styles["tag"]} ${styles["red"]}`}>
              {tag}
            </span>
          ))}
          {user.normalTags.map((tag) => (
            <span key={`${user.id}-${tag}`} className={styles["tag"]}>
              {tag}
            </span>
          ))}
        </div>
      </td>
      <td>
        <button className={styles["detail-button"]} onClick={onDetailClick}>
          <span className={styles["detail-text"]}>상세보기</span>
          <ChevronRight size={18} className={styles["detail-icon"]} />
        </button>
      </td>
    </tr>
  );
}
