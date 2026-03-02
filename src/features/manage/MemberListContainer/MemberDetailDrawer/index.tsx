import { useState } from "react";
import { Drawer, Portal } from "@chakra-ui/react";
import { X } from "lucide-react";

import { ManageUserApiDto } from "../../../../api/manage/user";
import { StudentStatus, UserStatus } from "../../../../constant";
import { DateFormats, formatDate } from "../../../../util/date";

import SwitchManagerModal from "../SwitchManagerModal";
import SwitchGraduatedModal from "../SwitchGraduatedModal";
import SwitchStoppedModal from "../SwitchStoppedModal";
import SwitchBlockedModal from "../SwitchBlockedModal";
import RemoveMemberModal from "../RemoveMemberModal";

import styles from "./style.module.css";

type Props = {
  user: ManageUserApiDto["UserResponse"] | null;
  isOpen: boolean;
  onClose: () => void;
};

const StudentStatusLabel: Record<StudentStatus, string> = {
  [StudentStatus.UNITED]: "교류",
  [StudentStatus.ABSENCE]: "휴학",
  [StudentStatus.UNDERGRADUATE]: "재학",
  [StudentStatus.GRADUATE]: "졸업",
};

export default function MemberDetailDrawer({ user, isOpen, onClose }: Props) {
  const [isSwitchManagerModalOpen, setIsSwitchManagerModalOpen] = useState(false);
  const [isSwitchGraduatedModalOpen, setIsSwitchGraduatedModalOpen] = useState(false);
  const [isSwitchStoppedModalOpen, setIsSwitchStoppedModalOpen] = useState(false);
  const [isSwitchBlockedModalOpen, setIsSwitchBlockedModalOpen] = useState(false);
  const [isRemoveMemberModalOpen, setIsRemoveMemberModalOpen] = useState(false);

  const isManager = user?.manager ?? false;
  const isGraduated = user?.studentStatus === StudentStatus.GRADUATE;
  const isStopped = user?.returnAt !== null && user?.returnAt !== undefined;
  const isBlocked = user?.status === UserStatus.INACTIVE;

  const userProfileForConfirm = user
    ? {
        name: user.profile.name,
        number: user.profile.number!,
        college: user.profile.college,
      }
    : { name: "", number: 0, college: "" };

  return (
    <>
      <Drawer.Root
        placement="end"
        size="sm"
        open={isOpen}
        onOpenChange={({ open }) => !open && onClose()}
      >
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content>
              <Drawer.Header className={styles["drawer-header"]}>
                {user && (
                  <div className={styles["header-name"]}>
                    <span style={{ fontSize: "18px", fontWeight: 700 }}>
                      {user.profile.name}
                    </span>
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
                )}
                <Drawer.CloseTrigger asChild>
                  <button className={styles["close-button"]}>
                    <X size={18} />
                  </button>
                </Drawer.CloseTrigger>
              </Drawer.Header>

              <Drawer.Body>
                {user && (
                  <>
                    <div className={styles["section"]}>
                      <h3 className={styles["section-title"]}>기본 정보</h3>
                      <div className={styles["info-row"]}>
                        <span className={styles["info-label"]}>학번</span>
                        <span className={styles["info-value"]}>{user.profile.number}</span>
                      </div>
                      <div className={styles["info-row"]}>
                        <span className={styles["info-label"]}>학년</span>
                        <span className={styles["info-value"]}>{user.profile.grade}학년</span>
                      </div>
                      <div className={styles["info-row"]}>
                        <span className={styles["info-label"]}>학적상태</span>
                        <span className={styles["info-value"]}>
                          {StudentStatusLabel[user.studentStatus]}
                        </span>
                      </div>
                      <div className={styles["info-row"]}>
                        <span className={styles["info-label"]}>학과</span>
                        <span className={styles["info-value"]}>{user.profile.college}</span>
                      </div>
                      <div className={styles["info-row"]}>
                        <span className={styles["info-label"]}>입학년도</span>
                        <span className={styles["info-value"]}>{user.admission}</span>
                      </div>
                    </div>

                    <hr className={styles["separator"]} />

                    {(user.profile.email || user.profile.phone || user.slack) && (
                      <>
                        <div className={styles["section"]}>
                          <h3 className={styles["section-title"]}>연락처</h3>
                          {user.profile.email && (
                            <div className={styles["info-row"]}>
                              <span className={styles["info-label"]}>이메일</span>
                              <span className={styles["info-value"]}>{user.profile.email}</span>
                            </div>
                          )}
                          {user.profile.phone && (
                            <div className={styles["info-row"]}>
                              <span className={styles["info-label"]}>전화번호</span>
                              <span className={styles["info-value"]}>{user.profile.phone}</span>
                            </div>
                          )}
                          {user.slack && (
                            <div className={styles["info-row"]}>
                              <span className={styles["info-label"]}>슬랙</span>
                              <span className={styles["info-value"]}>{user.slack}</span>
                            </div>
                          )}
                        </div>

                        <hr className={styles["separator"]} />
                      </>
                    )}

                    <div className={styles["section"]}>
                      <h3 className={styles["section-title"]}>태그</h3>
                      <div className={styles["tag-list"]}>
                        {user.redTags.map((tag) => (
                          <span
                            key={`drawer-red-${tag}`}
                            className={`${styles["tag"]} ${styles["red"]}`}
                          >
                            {tag}
                          </span>
                        ))}
                        {user.normalTags.map((tag) => (
                          <span key={`drawer-${tag}`} className={styles["tag"]}>
                            {tag}
                          </span>
                        ))}
                        {user.redTags.length === 0 && user.normalTags.length === 0 && (
                          <span style={{ color: "#999", fontSize: "14px" }}>
                            태그가 없습니다
                          </span>
                        )}
                      </div>
                    </div>

                    {isStopped && (
                      <>
                        <hr className={styles["separator"]} />
                        <div className={styles["section"]}>
                          <h3 className={styles["section-title"]}>정지 정보</h3>
                          <div className={styles["info-row"]}>
                            <span className={styles["info-label"]}>만료일</span>
                            <span className={styles["info-value"]}>
                              {formatDate(user.returnAt!, DateFormats.DATE_KOR)}
                            </span>
                          </div>
                          {user.returnReason && (
                            <div className={styles["info-row"]}>
                              <span className={styles["info-label"]}>사유</span>
                              <span className={styles["info-value"]}>{user.returnReason}</span>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    <hr className={styles["separator"]} />

                    <div className={styles["section"]}>
                      <h3 className={styles["section-title"]}>활동 이력</h3>
                      <div className={styles["info-row"]}>
                        <span className={styles["info-label"]}>가입일</span>
                        <span className={styles["info-value"]}>
                          {formatDate(user.createdAt, DateFormats.DATE)}
                        </span>
                      </div>
                      <div className={styles["info-row"]}>
                        <span className={styles["info-label"]}>마지막 로그인</span>
                        <span className={styles["info-value"]}>
                          {formatDate(user.lastLoginAt, DateFormats.DATETIME)}
                        </span>
                      </div>
                      <div className={styles["info-row"]}>
                        <span className={styles["info-label"]}>KHUIS 인증</span>
                        <span className={styles["info-value"]}>
                          {formatDate(user.khuisAuthAt, DateFormats.DATE)}
                        </span>
                      </div>
                      <div className={styles["info-row"]}>
                        <span className={styles["info-label"]}>포인트</span>
                        <span className={styles["info-value"]}>{user.point}</span>
                      </div>
                    </div>
                  </>
                )}
              </Drawer.Body>

              <Drawer.Footer>
                {user && (
                  <div className={styles["footer-buttons"]}>
                    <div className={styles["neutral-buttons"]}>
                      <button
                        className={styles["neutral-button"]}
                        onClick={() => setIsSwitchManagerModalOpen(true)}
                      >
                        {isManager ? "운영진 업무 종료" : "운영진 임명"}
                      </button>
                      <button
                        className={styles["neutral-button"]}
                        onClick={() => setIsSwitchGraduatedModalOpen(true)}
                      >
                        {isGraduated ? "재적" : "졸업"}
                      </button>
                      <button
                        className={styles["neutral-button"]}
                        onClick={() => setIsSwitchStoppedModalOpen(true)}
                      >
                        {isStopped ? "정지 해제" : "정지"}
                      </button>
                    </div>
                    <div className={styles["danger-buttons"]}>
                      <button
                        className={styles["danger-button"]}
                        onClick={() => setIsSwitchBlockedModalOpen(true)}
                      >
                        {isBlocked ? "차단 해제" : "접속 차단"}
                      </button>
                      <button
                        className={styles["danger-button"]}
                        onClick={() => setIsRemoveMemberModalOpen(true)}
                      >
                        제명
                      </button>
                    </div>
                  </div>
                )}
              </Drawer.Footer>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>

      {user && (
        <>
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
              onConfirm={(reason: string, returnAt: Date) => console.log("Confirmed!")}
              onCancel={() => setIsSwitchStoppedModalOpen(false)}
            />
          )}
          {isSwitchBlockedModalOpen && (
            <SwitchBlockedModal
              isOpen={isSwitchBlockedModalOpen}
              toBeBlocked={!isBlocked}
              targetUserProfile={userProfileForConfirm}
              onConfirm={() => console.log("Confirmed!")}
              onCancel={() => setIsSwitchBlockedModalOpen(false)}
            />
          )}
          {isRemoveMemberModalOpen && (
            <RemoveMemberModal
              isOpen={isRemoveMemberModalOpen}
              targetUserProfile={userProfileForConfirm}
              onConfirm={() => console.log("Confirmed!")}
              onCancel={() => setIsRemoveMemberModalOpen(false)}
            />
          )}
        </>
      )}
    </>
  );
}
