import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Drawer, Portal } from "@chakra-ui/react";
import { toast } from "react-toastify";
import { X } from "lucide-react";

import { ManageUserApiDto, UserManageApi } from "../../../../api/manage/user";
import { extractErrorMessage } from "../../../../util/extractErrorMessage";
import { StudentStatus, UserStatus } from "../../../../constant";
import { DateFormats, formatDate } from "../../../../util/date";

import { StudentStatusLabel } from "../types";
import badgeStyles from "../badge.module.css";
import TagList from "../TagList";
import SwitchManagerModal from "../SwitchManagerModal";
import SwitchGraduatedModal from "../SwitchGraduatedModal";
import PauseMemberModal from "../PauseMemberModal";
import ResumeMemberModal from "../ResumeMemberModal";
import SwitchBlockedModal from "../SwitchBlockedModal";
import RemoveMemberModal from "../RemoveMemberModal";

import styles from "./style.module.css";

type Props = {
  user: ManageUserApiDto["UserResponse"] | null;
  isOpen: boolean;
  onClose: () => void;
  refetch: () => void;
};

export default function MemberDetailDrawer({ user, isOpen, onClose, refetch }: Props) {
  const [isSwitchManagerModalOpen, setIsSwitchManagerModalOpen] =
    useState(false);
  const [isSwitchGraduatedModalOpen, setIsSwitchGraduatedModalOpen] =
    useState(false);
  const [isPauseMemberModalOpen, setIsPauseMemberModalOpen] = useState(false);
  const [isResumeMemberModalOpen, setIsResumeMemberModalOpen] = useState(false);
  const [isSwitchBlockedModalOpen, setIsSwitchBlockedModalOpen] =
    useState(false);
  const [isRemoveMemberModalOpen, setIsRemoveMemberModalOpen] = useState(false);

  const switchManagerMutation = useMutation({
    mutationFn: (params: { userId: number; toBeManager: boolean }) =>
      params.toBeManager
        ? UserManageApi.appointManager(params.userId)
        : UserManageApi.stepdownManager(params.userId),
    onSuccess: () => {
      setIsSwitchManagerModalOpen(false);
      refetch();
      onClose();
    },
  });

  const switchGraduatedMutation = useMutation({
    mutationFn: (params: { userId: number; toBeGraduated: boolean }) =>
      params.toBeGraduated
        ? UserManageApi.graduateMember(params.userId)
        : UserManageApi.ungraduateMember(params.userId),
    onSuccess: () => {
      setIsSwitchGraduatedModalOpen(false);
      refetch();
      onClose();
    },
  });

  const pauseMemberMutation = useMutation({
    mutationFn: (params: { userId: number; reason: string; returnAt: Date }) =>
      UserManageApi.pauseMember(params.userId, {
        returnAt: formatDate(params.returnAt, DateFormats.DATE),
        reason: params.reason,
      }),
    onSuccess: () => {
      setIsPauseMemberModalOpen(false);
      refetch();
      onClose();
    },
  });

  const resumeMemberMutation = useMutation({
    mutationFn: (userId: number) => UserManageApi.resumeMember(userId),
    onSuccess: () => {
      setIsResumeMemberModalOpen(false);
      refetch();
      onClose();
    },
  });

  const switchBlockedMutation = useMutation({
    mutationFn: (params: { userId: number; toBeBlocked: boolean }) =>
      params.toBeBlocked
        ? UserManageApi.blockMember(params.userId)
        : UserManageApi.unblockMember(params.userId),
    onSuccess: () => {
      setIsSwitchBlockedModalOpen(false);
      refetch();
      onClose();
    },
  });

  const expelMemberMutation = useMutation({
    mutationFn: (userId: number) => UserManageApi.expelMember(userId),
    onSuccess: () => {
      setIsRemoveMemberModalOpen(false);
      refetch();
      onClose();
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });

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
                    <span className={styles["drawer-name"]}>
                      {user.profile.name}
                    </span>
                    {user.manager && (
                      <span
                        className={`${badgeStyles["badge"]} ${badgeStyles["manager-badge"]}`}
                      >
                        운영진
                      </span>
                    )}
                    {isStopped && (
                      <span
                        className={`${badgeStyles["badge"]} ${badgeStyles["stopped-badge"]}`}
                      >
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

              <Drawer.Body className={styles["drawer-body"]}>
                {user && (
                  <>
                    <div className={styles["section"]}>
                      <h3 className={styles["section-title"]}>기본 정보</h3>
                      <div className={styles["info-row"]}>
                        <span className={styles["info-label"]}>학번</span>
                        <span className={styles["info-value"]}>
                          {user.profile.number}
                        </span>
                      </div>
                      <div className={styles["info-row"]}>
                        <span className={styles["info-label"]}>학년</span>
                        <span className={styles["info-value"]}>
                          {user.profile.grade}학년
                        </span>
                      </div>
                      <div className={styles["info-row"]}>
                        <span className={styles["info-label"]}>학적상태</span>
                        <span className={styles["info-value"]}>
                          {StudentStatusLabel[user.studentStatus]}
                        </span>
                      </div>
                      <div className={styles["info-row"]}>
                        <span className={styles["info-label"]}>학과</span>
                        <span className={styles["info-value"]}>
                          {user.profile.college}
                        </span>
                      </div>
                      <div className={styles["info-row"]}>
                        <span className={styles["info-label"]}>입학년도</span>
                        <span className={styles["info-value"]}>
                          {user.admission}
                        </span>
                      </div>
                    </div>

                    <hr className={styles["separator"]} />

                    {(user.profile.email ||
                      user.profile.phone ||
                      user.slack) && (
                      <>
                        <div className={styles["section"]}>
                          <h3 className={styles["section-title"]}>연락처</h3>
                          {user.profile.email && (
                            <div className={styles["info-row"]}>
                              <span className={styles["info-label"]}>
                                이메일
                              </span>
                              <span className={styles["info-value"]}>
                                {user.profile.email}
                              </span>
                            </div>
                          )}
                          {user.profile.phone && (
                            <div className={styles["info-row"]}>
                              <span className={styles["info-label"]}>
                                전화번호
                              </span>
                              <span className={styles["info-value"]}>
                                {user.profile.phone}
                              </span>
                            </div>
                          )}
                          {user.slack && (
                            <div className={styles["info-row"]}>
                              <span className={styles["info-label"]}>슬랙</span>
                              <span className={styles["info-value"]}>
                                {user.slack}
                              </span>
                            </div>
                          )}
                        </div>

                        <hr className={styles["separator"]} />
                      </>
                    )}

                    <div className={styles["section"]}>
                      <h3 className={styles["section-title"]}>태그</h3>
                      <TagList
                        redTags={user.redTags}
                        normalTags={user.normalTags}
                      />
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
                              <span className={styles["info-value"]}>
                                {user.returnReason}
                              </span>
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
                        <span className={styles["info-label"]}>
                          마지막 로그인
                        </span>
                        <span className={styles["info-value"]}>
                          {formatDate(user.lastLoginAt, DateFormats.DATETIME)}
                        </span>
                      </div>
                      <div className={styles["info-row"]}>
                        <span className={styles["info-label"]}>
                          INFO21 인증
                        </span>
                        <span className={styles["info-value"]}>
                          {formatDate(user.khuisAuthAt, DateFormats.DATE)}
                        </span>
                      </div>
                      <div className={styles["info-row"]}>
                        <span className={styles["info-label"]}>경험치</span>
                        <span className={styles["info-value"]}>
                          {user.point}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </Drawer.Body>

              <Drawer.Footer className={styles["drawer-footer"]}>
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
                        onClick={() =>
                          isStopped
                            ? setIsResumeMemberModalOpen(true)
                            : setIsPauseMemberModalOpen(true)
                        }
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
              isLoading={switchManagerMutation.isPending}
              onConfirm={() =>
                switchManagerMutation.mutate({
                  userId: user!.id,
                  toBeManager: !isManager,
                })
              }
              onCancel={() => setIsSwitchManagerModalOpen(false)}
            />
          )}
          {isSwitchGraduatedModalOpen && (
            <SwitchGraduatedModal
              isOpen={isSwitchGraduatedModalOpen}
              toBeGraduated={!isGraduated}
              targetUserProfile={userProfileForConfirm}
              isLoading={switchGraduatedMutation.isPending}
              onConfirm={() =>
                switchGraduatedMutation.mutate({
                  userId: user!.id,
                  toBeGraduated: !isGraduated,
                })
              }
              onCancel={() => setIsSwitchGraduatedModalOpen(false)}
            />
          )}
          {isPauseMemberModalOpen && (
            <PauseMemberModal
              isOpen={isPauseMemberModalOpen}
              targetUserProfile={userProfileForConfirm}
              isLoading={pauseMemberMutation.isPending}
              onConfirm={(reason, returnAt) =>
                pauseMemberMutation.mutate({ userId: user!.id, reason, returnAt })
              }
              onCancel={() => setIsPauseMemberModalOpen(false)}
            />
          )}
          {isResumeMemberModalOpen && (
            <ResumeMemberModal
              isOpen={isResumeMemberModalOpen}
              targetUserProfile={userProfileForConfirm}
              isLoading={resumeMemberMutation.isPending}
              onConfirm={() => resumeMemberMutation.mutate(user!.id)}
              onCancel={() => setIsResumeMemberModalOpen(false)}
            />
          )}
          {isSwitchBlockedModalOpen && (
            <SwitchBlockedModal
              isOpen={isSwitchBlockedModalOpen}
              toBeBlocked={!isBlocked}
              targetUserProfile={userProfileForConfirm}
              isLoading={switchBlockedMutation.isPending}
              onConfirm={() =>
                switchBlockedMutation.mutate({
                  userId: user!.id,
                  toBeBlocked: !isBlocked,
                })
              }
              onCancel={() => setIsSwitchBlockedModalOpen(false)}
            />
          )}
          {isRemoveMemberModalOpen && (
            <RemoveMemberModal
              isOpen={isRemoveMemberModalOpen}
              targetUserProfile={userProfileForConfirm}
              isLoading={expelMemberMutation.isPending}
              onConfirm={() => expelMemberMutation.mutate(user!.id)}
              onCancel={() => setIsRemoveMemberModalOpen(false)}
            />
          )}
        </>
      )}
    </>
  );
}
