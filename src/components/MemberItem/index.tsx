import { DoorOpen, EllipsisVertical, IdCard } from "lucide-react";

import { ManageUserApiDto } from "../../api/manage/user";
import { UserState } from "../../constant";

import styles from "./style.module.css";
import CollegeIcon from "../CollegeIcon";
import { DateFormats, formatDate } from "../../util/date";

type Props = {
  user: ManageUserApiDto["UserResponse"];
};

const UserStateLabel: Record<UserState, string> = {
  [UserState.UNITED]: "교류",
  [UserState.ABSENCE]: "휴학",
  [UserState.UNDERGRADUATE]: "재학",
  [UserState.GRADUATE]: "졸업",
};

export default function MemberItem({ user }: Props) {
  const colleges = user.profile.college
    .split(",")
    .map((college) => college.trim());

  return (
    <div className={styles["container"]}>
      <div className={styles["first-panel"]}>
        <div>
          <span className={styles["name"]}>{user.profile.name}</span>
          <span className={styles["identifier"]}>{user.name}</span>
        </div>
        <div className={styles["contact"]}>
          <p>{user.profile.phone}</p>
          <p>{user.profile.email}</p>
        </div>
      </div>
      <div className={styles["second-panel"]}>
        <p>
          <IdCard strokeWidth="2" size="13" />
          <span>
            {user.profile.number}, {user.profile.grade}학년{" "}
            {UserStateLabel[user.state]}
          </span>
        </p>
        <p>
          <DoorOpen strokeWidth="2" size="13" />
          <span>{formatDate(user.createdAt, DateFormats.DATE_KOR)}</span>
        </p>
        {colleges.map((college) => (
          <p key={`${user.id}-${college}`}>
            <CollegeIcon strokeWidth="2" size="13" college={college} />
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
