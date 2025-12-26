import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import Container from "../../../components/Container";
import Button from "../../../components/Button";
import Callout from "../../../components/Callout";
import CenterRingLoadingIndicator from "../../../components/RingLoadingIndicator/center";
import PageNavigator from "../../../components/PageNavigator";

import { GroupMatchingManageApi } from "../../../api/manage/groupMatching";
import { extractErrorMessage } from "../../../util/extractErrorMessage";
import { GroupType, GroupTypeLabel } from "../../../constant";

import AnswerItem from "./AnswerItem";

import styles from "./style.module.css";

export default function GroupMatchingAnswerListContainer() {
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [filterGroupType, setFilterGroupType] = useState<GroupType | null>(null);
  const [filterFieldId, setFilterFieldId] = useState<string | null>(null);

  const limit = 20;
  const offset = (page - 1) * limit;

  // URL 파라미터에서 surveyId 가져오기
  const surveyIdFromUrl = searchParams.get("surveyId");

  // Get current survey or specific survey by ID
  const { data: groupMatchingsData } = useQuery({
    queryKey: ["group-matchings-admin"],
    queryFn: GroupMatchingManageApi.listGroupMatchings,
    retry: 0,
  });

  // URL에 surveyId가 있으면 해당 설문을, 없으면 최신 설문을 사용
  const survey = surveyIdFromUrl
    ? groupMatchingsData?.groupMatchings.find((s) => s.id === surveyIdFromUrl) || null
    : groupMatchingsData?.groupMatchings[0] || null;

  // Get fields for filter
  const { data: fields } = useQuery({
    queryKey: ["group-matching-fields-admin"],
    queryFn: GroupMatchingManageApi.listFields,
    retry: 0,
  });

  // Get answers
  const { status, data, error, refetch } = useQuery({
    queryKey: ["group-matching-answers", page, filterGroupType, filterFieldId],
    queryFn: () =>
      GroupMatchingManageApi.listAnswers({
        groupMatchingId: survey!.id,
        groupType: filterGroupType,
        fieldId: filterFieldId,
        limit,
        offset,
      }),
    enabled: !!survey,
    retry: 0,
  });

  const handleSearch = () => {
    setPage(1);
    refetch();
  };

  if (!survey) {
    return (
      <Container>
        <Callout>진행 중인 설문이 없습니다.</Callout>
      </Container>
    );
  }

  const activeFields = fields?.filter((f) => !f.obsoletedAt) || [];

  // fields를 id → name 매핑 객체로 변환
  const fieldNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    fields?.forEach(field => {
      map[field.id] = field.name;
    });
    return map;
  }, [fields]);

  return (
    <>
      <Container>
        <h2>응답 목록</h2>

        {/* Filters */}
        <div className={styles["filter-section"]}>
          <div className={styles["filter-group"]}>
            <label>그룹 유형</label>
            <select
              value={filterGroupType || ""}
              onChange={(e) =>
                setFilterGroupType(
                  e.target.value === "" ? null : (e.target.value as GroupType)
                )
              }
            >
              <option value="">전체</option>
              <option value={GroupType.STUDY}>
                {GroupTypeLabel[GroupType.STUDY]}
              </option>
              <option value={GroupType.PROJECT}>
                {GroupTypeLabel[GroupType.PROJECT]}
              </option>
            </select>
          </div>

          <div className={styles["filter-group"]}>
            <label>관심 분야</label>
            <select
              value={filterFieldId || ""}
              onChange={(e) =>
                setFilterFieldId(
                  e.target.value === "" ? null : e.target.value
                )
              }
            >
              <option value="">전체</option>
              {activeFields.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.name}
                </option>
              ))}
            </select>
          </div>

          <Button onClick={handleSearch}>검색</Button>
        </div>
      </Container>

      <Container>
        {(() => {
          switch (status) {
            case "pending":
              return <CenterRingLoadingIndicator />;
            case "error":
              return (
                <Callout type="error">{extractErrorMessage(error)}</Callout>
              );
            case "success":
              return (
                <>
                  <h3 className={styles["answer-counter"]}>
                    총 <span>{data.count}개</span> 응답
                  </h3>
                  <div className={styles["answer-list"]}>
                    {data.answers.map((answer) => (
                      <AnswerItem key={answer.id} answer={answer} fieldNameMap={fieldNameMap} />
                    ))}
                  </div>
                  <PageNavigator
                    currentPage={page}
                    countPerPage={limit}
                    totalCount={data.count}
                    onPageChange={(page) => setPage(page)}
                  />
                </>
              );
          }
        })()}
      </Container>
    </>
  );
}
