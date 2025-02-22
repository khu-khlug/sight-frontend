import { DoorOpen, EllipsisVertical, IdCard, Pause } from "lucide-react";

import { ManageUserApiDto } from "../../api/manage/user";
import { StudentStatus, UserStatus } from "../../constant";

import styles from "./style.module.css";
import CollegeIcon from "../CollegeIcon";
import { DateFormats, formatDate } from "../../util/date";
import { cn } from "../../util/cn";
import { useEffect, useRef, useState } from "react";
import SwitchManagerModal from "../SwitchManagerModal";
import SwitchGraduatedModal from "../SwitchGraduatedModal";
import SwitchStoppedModal from "../SwitchStoppedModal";

type Props = {
  user: ManageUserApiDto["UserResponse"];
};

const StudentStatusLabel: Record<StudentStatus, string> = {
  [StudentStatus.UNITED]: "교류",
  [StudentStatus.ABSENCE]: "휴학",
  [StudentStatus.UNDERGRADUATE]: "재학",
  [StudentStatus.GRADUATE]: "졸업",
};

export default function MemberItem({ user }: Props) {
  const [moreButtonOpened, setMoreButtonOpened] = useState(false);
  const moreButtonMenuRef = useRef<HTMLDivElement>(null);

  const [isSwitchManagerModalOpen, setIsSwitchManagerModalOpen] =
    useState(false);
  const [isSwitchGraduatedModalOpen, setIsSwitchGraduatedModalOpen] =
    useState(false);
  const [isSwitchStoppedModalOpen, setIsSwitchStoppedModalOpen] =
    useState(false);

  useEffect(() => {
    // 메뉴 바깥쪽을 클릭했을 때 메뉴 닫기
    const handleClickOutside = (event: MouseEvent) => {
      if (
        moreButtonMenuRef.current &&
        !moreButtonMenuRef.current.contains(event.target as Node)
      ) {
        setMoreButtonOpened(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setMoreButtonOpened]);

  const openSwitchManagerModal = () => {
    setIsSwitchManagerModalOpen(true);
    setMoreButtonOpened(false);
  };

  const openSwitchGraduatedModal = () => {
    setIsSwitchGraduatedModalOpen(true);
    setMoreButtonOpened(false);
  };

  const openSwitchStoppedModal = () => {
    setIsSwitchStoppedModalOpen(true);
    setMoreButtonOpened(false);
  };

  const colleges = user.profile.college
    .split(",")
    .map((college) => college.trim());

  const isManager = user.manager;
  const isGraduated = user.studentStatus === StudentStatus.GRADUATE;
  const isStopped = user.returnAt !== null;
  const isBlocked = user.status === UserStatus.INACTIVE;

  const userProfileForConfirm = {
    name: user.profile.name,
    number: user.profile.number!,
    college: user.profile.college,
  };

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
            <span>~{formatDate(user.returnAt!, DateFormats.DATE_KOR)}</span>
            <span>{user.returnReason}</span>
          </p>
        )}
        <p>
          <IdCard strokeWidth="2" size="16" />
          <span>{user.profile.number}</span>
          <span>
            {isGraduated ? " " : ` ${user.profile.grade}학년 `}
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
      <div>
        <button
          className={styles["more-button"]}
          onClick={() => setMoreButtonOpened(true)}
        >
          <EllipsisVertical size="16" />
        </button>
        <div
          ref={moreButtonMenuRef}
          className={cn(styles["more-button-menu"], {
            [styles["opened"]]: moreButtonOpened,
          })}
        >
          <button onClick={openSwitchManagerModal}>
            {isManager ? "운영진 업무 종료" : "운영진 임명"}
          </button>
          <button onClick={openSwitchGraduatedModal}>
            {isGraduated ? "재적" : "졸업"}
          </button>
          <button onClick={openSwitchStoppedModal}>
            {isStopped ? "정지 해제" : "정지"}
          </button>
          <button className={styles["red"]}>
            {isBlocked ? "차단 해제" : "접속 차단"}
          </button>
          <button className={styles["red"]}>제명</button>
        </div>
      </div>
      {isSwitchManagerModalOpen && (
        <SwitchManagerModal
          isOpen={isSwitchManagerModalOpen}
          toBeManager={!isManager}
          targetUserProfile={userProfileForConfirm}
          onConfirm={() => console.log("Confirmed!")}
          onCancel={() => setIsSwitchManagerModalOpen(false)}
        />
      )}
      {isSwitchGraduatedModalOpen && (
        <SwitchGraduatedModal
          isOpen={isSwitchGraduatedModalOpen}
          toBeGraduated={!isGraduated}
          targetUserProfile={userProfileForConfirm}
          onConfirm={() => console.log("Confirmed!")}
          onCancel={() => setIsSwitchGraduatedModalOpen(false)}
        />
      )}
      {isSwitchStoppedModalOpen && (
        <SwitchStoppedModal
          isOpen={isSwitchStoppedModalOpen}
          toBeStopped={!isStopped}
          targetUserProfile={userProfileForConfirm}
          onConfirm={() => console.log("Confirmed!")}
          onCancel={() => setIsSwitchStoppedModalOpen(false)}
        />
      )}
    </div>
  );
}
