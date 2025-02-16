import { DoorOpen, EllipsisVertical, IdCard, Pause } from "lucide-react";

import { ManageUserApiDto } from "../../api/manage/user";
import { StudentStatus } from "../../constant";

import styles from "./style.module.css";
import CollegeIcon from "../CollegeIcon";
import { DateFormats, formatDate } from "../../util/date";
import { cn } from "../../util/cn";

type Props = {
  user: ManageUserApiDto["UserResponse"];
};

const StudentStatusLabel: Record<StudentStatus, string> = {
  [StudentStatus.UNITED]: "교류",
  [StudentStatus.ABSENCE]: "휴학",
  [StudentStatus.UNDERGRADUATE]: "재학",
  [StudentStatus.GRADUATE]: "졸업",
};

function isGraduated(user: ManageUserApiDto["UserResponse"]) {
  return user.studentStatus === StudentStatus.GRADUATE;
}

export default function MemberItem({ user }: Props) {
  const colleges = user.profile.college
    .split(",")
    .map((college) => college.trim());

  const isStopped = user.returnAt !== null;

  return (
    <div
      className={cn(styles["container"], { [styles["stopped"]]: isStopped })}
    >
      <div className={styles["first-panel"]}>
        <div className={styles["name-area"]}>
          <span className={styles["name"]}>{user.profile.name}</span>
          {user.manager && (
            <span className={styles["manager-chip"]}>운영진</span>
          )}
        </div>
        <div className={styles["contact"]}>
          <p>{user.name}</p>
          <p>{user.profile.phone}</p>
          <p>{user.profile.email}</p>
        </div>
        <div className={styles["tags"]}>
          {user.redTags.map((tag) => (
            <p key={`${user.id}-${tag}`} className={styles["red-tag"]}>
              {tag}
            </p>
          ))}
          {user.normalTags.map((tag) => (
            <p key={`${user.id}-${tag}`}>{tag}</p>
          ))}
        </div>
      </div>
      <div className={styles["second-panel"]}>
        {isStopped && (
          <p className={styles["stop-info"]}>
            <Pause strokeWidth="2" size="16" />
            <span>
              ~{formatDate(user.returnAt!, DateFormats.DATE_KOR)},{" "}
              {user.returnReason}
            </span>
          </p>
        )}
        <p>
          <IdCard strokeWidth="2" size="16" />
          <span>
            {user.profile.number},
            {isGraduated(user) ? " " : ` ${user.profile.grade}학년 `}
            {StudentStatusLabel[user.studentStatus]}
          </span>
        </p>
        <p>
          <DoorOpen strokeWidth="2" size="16" />
          <span>{formatDate(user.createdAt, DateFormats.DATE_KOR)}</span>
        </p>
        {colleges.map((college) => (
          <p key={`${user.id}-${college}`}>
            <CollegeIcon strokeWidth="2" size="16" college={college} />
            <span>{college}</span>
          </p>
        ))}
      </div>
      <button className={styles["more-button"]}>
        <EllipsisVertical size="16" />
      </button>
    </div>
  );
}
