import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import Container from "../../../components/Container";
import Button from "../../../components/Button";
import Callout from "../../../components/Callout";
import CenterRingLoadingIndicator from "../../../components/RingLoadingIndicator/center";

import { GroupMatchingManageApi, GroupMatchingResponse } from "../../../api/manage/groupMatching";
import { extractErrorMessage } from "../../../util/extractErrorMessage";
import { DateFormats, formatDate } from "../../../util/date";
import { Semester, SemesterLabel } from "../../../constant";

import CreateSurveyModal from "./CreateSurveyModal";
import UpdateDeadlineModal from "./UpdateDeadlineModal";

import styles from "./style.module.css";

export default function GroupMatchingManagementContainer() {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<GroupMatchingResponse | null>(null);

  const {
    status,
    data,
    error,
    refetch,
  } = useQuery({
    queryKey: ["group-matchings-admin"],
    queryFn: GroupMatchingManageApi.listGroupMatchings,
    retry: 0,
  });

  const handleViewAnswers = (surveyId: string) => {
    navigate(`/manage/group-matching-answers?surveyId=${surveyId}`);
  };

  const handleUpdateDeadline = (survey: GroupMatchingResponse) => {
    setSelectedSurvey(survey);
  };

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
        <div className={styles["header"]}>
          <h2>그룹 매칭 목록</h2>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            그룹 매칭 생성
          </Button>
        </div>

        {data && data.groupMatchings.length > 0 ? (
          <div className={styles["survey-list"]}>
            {data.groupMatchings.map((survey) => (
              <div key={survey.id} className={styles["survey-item"]}>
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
                </div>

                <div className={styles["action-buttons"]}>
                  <Button onClick={() => handleViewAnswers(survey.id)}>
                    응답 보기
                  </Button>
                  <Button variant="neutral" onClick={() => handleUpdateDeadline(survey)}>
                    마감일 변경
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Callout>현재 진행 중인 그룹 매칭 설문이 없습니다.</Callout>
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

      {selectedSurvey && (
        <UpdateDeadlineModal
          isOpen={!!selectedSurvey}
          survey={selectedSurvey}
          onClose={() => setSelectedSurvey(null)}
          onSuccess={() => {
            setSelectedSurvey(null);
            refetch();
          }}
        />
      )}
    </>
  );
}
