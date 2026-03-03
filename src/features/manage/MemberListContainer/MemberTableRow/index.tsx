import dayjs from "dayjs";
import { ChevronRight, Pause } from "lucide-react";

import { ManageUserApiDto } from "../../../../api/manage/user";
import { StudentStatus } from "../../../../constant";

import { SearchType, StudentStatusLabel } from "../types";
import badgeStyles from "../badge.module.css";
import TagList from "../TagList";

import styles from "./style.module.css";

type Props = {
  user: ManageUserApiDto["UserResponse"];
  searchType: SearchType;
  onDetailClick: () => void;
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
              <span className={`${badgeStyles["badge"]} ${badgeStyles["manager-badge"]}`}>
                운영진
              </span>
            )}
            {isStopped && (
              <span className={`${badgeStyles["badge"]} ${badgeStyles["stopped-badge"]}`}>
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
        <TagList redTags={user.redTags} normalTags={user.normalTags} />
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
