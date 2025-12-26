import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";

import Container from "../../../components/Container";
import Button from "../../../components/Button";
import Callout from "../../../components/Callout";
import CenterRingLoadingIndicator from "../../../components/RingLoadingIndicator/center";

import {
  GroupMatchingPublicApi,
  SubmitAnswerRequestDto,
  UpdateAnswerRequestDto,
} from "../../../api/public/groupMatching";
import { extractErrorMessage } from "../../../util/extractErrorMessage";
import { DateFormats, formatDate } from "../../../util/date";
import {
  GroupType,
  GroupTypeLabel,
  Semester,
  SemesterLabel,
} from "../../../constant";

import RequestFieldModal from "./RequestFieldModal";

import styles from "./style.module.css";

export default function GroupMatchingSurveyContainer() {
  // Query: Get current survey
  const {
    status: surveyStatus,
    data: survey,
    error: surveyError,
  } = useQuery({
    queryKey: ["current-group-matching"],
    queryFn: GroupMatchingPublicApi.getCurrentGroupMatching,
    retry: 0,
  });

  // Query: Get my answer (if survey exists)
  const {
    status: answerStatus,
    data: myAnswer,
    error: answerError,
    refetch: refetchAnswer,
  } = useQuery({
    queryKey: ["my-group-matching-answer", survey?.id],
    queryFn: () => GroupMatchingPublicApi.getMyAnswer(survey!.id),
    enabled: !!survey,
    retry: 0,
  });

  // Query: Get available fields
  const {
    status: fieldsStatus,
    data: fields,
    error: fieldsError,
  } = useQuery({
    queryKey: ["group-matching-fields"],
    queryFn: GroupMatchingPublicApi.listAvailableFields,
    enabled: !!survey,
    retry: 0,
  });

  // Form state
  const [groupType, setGroupType] = useState<GroupType>(GroupType.STUDY);
  const [isPreferOnline, setIsPreferOnline] = useState<boolean>(false);
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([""]);

  // Modal state
  const [isRequestFieldModalOpen, setIsRequestFieldModalOpen] = useState(false);

  // Initialize form with existing answer
  useEffect(() => {
    if (myAnswer) {
      setGroupType(myAnswer.groupType);
      setIsPreferOnline(myAnswer.isPreferOnline);
      setSelectedFieldIds(myAnswer.fields.map((f) => f.id));
      const answerSubjects = myAnswer.groupMatchingSubjects.map(
        (s) => s.subject
      );
      setSubjects(answerSubjects.length > 0 ? answerSubjects : [""]);
    }
  }, [myAnswer]);

  // Mutation: Submit answer
  const { mutateAsync: submitAnswer, isPending: isSubmitting } = useMutation({
    mutationFn: (dto: {
      groupMatchingId: string;
      data: SubmitAnswerRequestDto;
    }) => GroupMatchingPublicApi.submitAnswer(dto.groupMatchingId, dto.data),
    onSuccess: () => {
      refetchAnswer();
    },
  });

  // Mutation: Update answer
  const { mutateAsync: updateAnswer, isPending: isUpdating } = useMutation({
    mutationFn: (dto: {
      groupMatchingId: string;
      data: UpdateAnswerRequestDto;
    }) => GroupMatchingPublicApi.updateAnswer(dto.groupMatchingId, dto.data),
    onSuccess: () => {
      refetchAnswer();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedFieldIds.length === 0) {
      alert("관심 분야를 최소 1개 이상 선택해주세요.");
      return;
    }

    const filteredSubjects = subjects.filter((s) => s.trim() !== "");
    if (filteredSubjects.length === 0) {
      alert("하고 싶은 주제를 최소 1개 이상 입력해주세요.");
      return;
    }

    try {
      if (myAnswer) {
        await updateAnswer({
          groupMatchingId: survey!.id,
          data: {
            groupType,
            isPreferOnline,
            fieldIds: selectedFieldIds,
            subjects: filteredSubjects,
          },
        });
        alert("설문 응답이 수정되었습니다.");
      } else {
        await submitAnswer({
          groupMatchingId: survey!.id,
          data: {
            groupType,
            isPreferOnline,
            groupMatchingFieldIds: selectedFieldIds,
            groupMatchingSubjects: filteredSubjects,
          },
        });
        alert("설문 응답이 제출되었습니다.");
      }
    } catch (error) {
      alert(extractErrorMessage(error as Error));
    }
  };

  const handleSubjectChange = (index: number, value: string) => {
    const newSubjects = [...subjects];
    newSubjects[index] = value;
    setSubjects(newSubjects);
  };

  const handleAddSubject = () => {
    if (subjects.length < 3) {
      setSubjects([...subjects, ""]);
    }
  };

  const handleRemoveSubject = (index: number) => {
    if (subjects.length > 1) {
      setSubjects(subjects.filter((_, i) => i !== index));
    }
  };

  const toggleField = (fieldId: string) => {
    if (selectedFieldIds.includes(fieldId)) {
      setSelectedFieldIds(selectedFieldIds.filter((id) => id !== fieldId));
    } else {
      setSelectedFieldIds([...selectedFieldIds, fieldId]);
    }
  };

  // Loading state
  if (surveyStatus === "pending") {
    return (
      <Container>
        <CenterRingLoadingIndicator />
      </Container>
    );
  }

  // Error state
  if (surveyStatus === "error") {
    return (
      <Container>
        <Callout type="error">{extractErrorMessage(surveyError)}</Callout>
      </Container>
    );
  }

  // No active survey
  if (!survey) {
    return (
      <Container>
        <h2>그룹 매칭 설문</h2>
        <Callout>현재 진행 중인 그룹 매칭 설문이 없습니다.</Callout>
      </Container>
    );
  }

  // Survey exists but is closed
  const isClosed = new Date(survey.closedAt) < new Date();
  if (isClosed && !myAnswer) {
    return (
      <Container>
        <h2>그룹 매칭 설문</h2>
        <Callout type="error">
          설문이 마감되었습니다. (마감일:{" "}
          {formatDate(new Date(survey.closedAt), DateFormats.DATE_KOR)})
        </Callout>
      </Container>
    );
  }

  // Answer loading
  if (answerStatus === "pending" || fieldsStatus === "pending") {
    return (
      <Container>
        <CenterRingLoadingIndicator />
      </Container>
    );
  }

  // Answer error
  if (answerStatus === "error" || fieldsStatus === "error") {
    return (
      <Container>
        <Callout type="error">
          {extractErrorMessage((answerError || fieldsError) as Error)}
        </Callout>
      </Container>
    );
  }

  const isReadOnly = isClosed && !!myAnswer;

  return (
    <>
      <Container>
        <h2>
          {survey.year}년 {SemesterLabel[survey.semester as Semester]} 그룹 매칭
          설문
        </h2>

        <div className={styles["survey-info"]}>
          <p>
            마감일:{" "}
            {formatDate(new Date(survey.closedAt), DateFormats.DATE_KOR)}
          </p>
          {myAnswer && (
            <p className={styles["submitted-info"]}>
              제출일:{" "}
              {formatDate(new Date(myAnswer.createdAt), DateFormats.DATE_KOR)}
              {myAnswer.updatedAt !== myAnswer.createdAt && (
                <>
                  {" "}
                  (수정:{" "}
                  {formatDate(
                    new Date(myAnswer.updatedAt),
                    DateFormats.DATE_KOR
                  )}
                  )
                </>
              )}
            </p>
          )}
        </div>
        {isReadOnly && (
          <Callout>
            설문이 마감되었습니다. 제출된 응답은 수정할 수 없습니다.
          </Callout>
        )}

        <form onSubmit={handleSubmit} className={styles["form"]}>
          {/* Group Type Selection */}
          <div className={styles["form-group"]}>
            <label className={styles["form-label"]}>그룹 유형</label>
            <div className={styles["radio-group"]}>
              <label className={styles["radio-label"]}>
                <input
                  type="radio"
                  name="groupType"
                  value={GroupType.STUDY}
                  checked={groupType === GroupType.STUDY}
                  onChange={(e) => setGroupType(e.target.value as GroupType)}
                  disabled={isReadOnly}
                />
                <span>{GroupTypeLabel[GroupType.STUDY]}</span>
              </label>
              <label className={styles["radio-label"]}>
                <input
                  type="radio"
                  name="groupType"
                  value={GroupType.PROJECT}
                  checked={groupType === GroupType.PROJECT}
                  onChange={(e) => setGroupType(e.target.value as GroupType)}
                  disabled={isReadOnly}
                />
                <span>{GroupTypeLabel[GroupType.PROJECT]}</span>
              </label>
            </div>
          </div>

          {/* Online Preference */}
          <div className={styles["form-group"]}>
            <label className={styles["form-label"]}>활동 방식</label>
            <div className={styles["checkbox-group"]}>
              <label className={styles["checkbox-label"]}>
                <input
                  type="checkbox"
                  checked={isPreferOnline}
                  onChange={(e) => setIsPreferOnline(e.target.checked)}
                  disabled={isReadOnly}
                />
                <span>온라인 활동 선호</span>
              </label>
            </div>
          </div>

          {/* Field Selection (Inline Checkboxes) */}
          <div className={styles["form-group"]}>
            <label className={styles["form-label"]}>관심 분야 (최소 1개)</label>
            <div className={styles["field-checkbox-grid"]}>
              {fields?.map((field) => (
                <label
                  key={field.id}
                  className={styles["field-checkbox-label"]}
                >
                  <input
                    type="checkbox"
                    checked={selectedFieldIds.includes(field.id)}
                    onChange={() => toggleField(field.id)}
                    disabled={isReadOnly}
                  />
                  <span>{field.name}</span>
                </label>
              ))}
            </div>
            {!isReadOnly && (
              <div className={styles["field-request-button-wrapper"]}>
                <Button
                  type="button"
                  variant="neutral"
                  onClick={() => setIsRequestFieldModalOpen(true)}
                >
                  새 분야 요청
                </Button>
              </div>
            )}
          </div>

          {/* Subjects (Dynamic List) */}
          <div className={styles["form-group"]}>
            <label className={styles["form-label"]}>
              하고 싶은 주제 (최소 1개, 최대 3개)
            </label>
            {subjects.map((subject, index) => (
              <div key={index} className={styles["subject-input-row"]}>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => handleSubjectChange(index, e.target.value)}
                  placeholder={`주제 ${index + 1}`}
                  className={styles["subject-input"]}
                  disabled={isReadOnly}
                />
                {!isReadOnly && subjects.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSubject(index)}
                    className={styles["remove-subject-btn"]}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {!isReadOnly && subjects.length < 3 && (
              <Button
                type="button"
                variant="neutral"
                onClick={handleAddSubject}
              >
                주제 추가
              </Button>
            )}
          </div>

          {!isReadOnly && (
            <div className={styles["submit-button-wrapper"]}>
              <Button type="submit" disabled={isSubmitting || isUpdating}>
                {myAnswer ? "수정하기" : "제출하기"}
              </Button>
            </div>
          )}
        </form>
      </Container>

      {/* Modals */}
      {isRequestFieldModalOpen && (
        <RequestFieldModal
          isOpen={isRequestFieldModalOpen}
          onClose={() => setIsRequestFieldModalOpen(false)}
        />
      )}
    </>
  );
}
