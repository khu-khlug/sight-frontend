import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import Container from "../../../components/Container";
import Button from "../../../components/Button";
import Callout from "../../../components/Callout";
import CenterRingLoadingIndicator from "../../../components/RingLoadingIndicator/center";

import { GroupMatchingManageApi } from "../../../api/manage/groupMatching";
import { extractErrorMessage } from "../../../util/extractErrorMessage";
import { DateFormats, formatDate } from "../../../util/date";
import { Semester, SemesterLabel } from "../../../constant";

import CreateSurveyModal from "./CreateSurveyModal";
import UpdateDeadlineModal from "./UpdateDeadlineModal";

import styles from "./style.module.css";

export default function GroupMatchingManagementContainer() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateDeadlineModalOpen, setIsUpdateDeadlineModalOpen] =
    useState(false);

  const {
    status,
    data: survey,
    error,
    refetch,
  } = useQuery({
    queryKey: ["current-group-matching-admin"],
    queryFn: GroupMatchingManageApi.getCurrentGroupMatching,
    retry: 0,
  });

  if (status === "pending") {
    return (
      <Container>
        <CenterRingLoadingIndicator />
      </Container>
    );
  }

  if (status === "error") {
    return (
      <Container>
        <Callout type="error">{extractErrorMessage(error)}</Callout>
      </Container>
    );
  }

  return (
    <>
      <Container>
        <h2>그룹 매칭 설문 관리</h2>

        {survey ? (
          <div className={styles["survey-info"]}>
            <div className={styles["info-row"]}>
              <span className={styles["label"]}>학기:</span>
              <span>
                {survey.year}년 {SemesterLabel[survey.semester as Semester]}
              </span>
            </div>
            <div className={styles["info-row"]}>
              <span className={styles["label"]}>마감일:</span>
              <span>
                {formatDate(new Date(survey.closedAt), DateFormats.DATE_KOR)}
              </span>
            </div>
            <div className={styles["info-row"]}>
              <span className={styles["label"]}>생성일:</span>
              <span>
                {formatDate(new Date(survey.createdAt), DateFormats.DATE_KOR)}
              </span>
            </div>

            <div className={styles["action-buttons"]}>
              <Button onClick={() => setIsUpdateDeadlineModalOpen(true)}>
                마감일 변경
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <Callout>현재 진행 중인 그룹 매칭 설문이 없습니다.</Callout>
            <div className={styles["action-buttons"]}>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                새 설문 생성
              </Button>
            </div>
          </div>
        )}
      </Container>

      {isCreateModalOpen && (
        <CreateSurveyModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            refetch();
          }}
        />
      )}

      {isUpdateDeadlineModalOpen && survey && (
        <UpdateDeadlineModal
          isOpen={isUpdateDeadlineModalOpen}
          survey={survey}
          onClose={() => setIsUpdateDeadlineModalOpen(false)}
          onSuccess={() => {
            setIsUpdateDeadlineModalOpen(false);
            refetch();
          }}
        />
      )}
    </>
  );
}
