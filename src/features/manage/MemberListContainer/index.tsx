import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import Container from "../../../components/Container";
import Button from "../../../components/Button";

import { ManageUserApiDto, UserManageApi } from "../../../api/manage/user";
import { StudentStatus } from "../../../constant";

import MemberItem from "./MemberItem";
import CenterRingLoadingIndicator from "../../../components/RingLoadingIndicator/center";
import Callout from "../../../components/Callout";
import PageNavigator from "../../../components/PageNavigator";
import { extractErrorMessage } from "../../../util/extractErrorMessage";
import { Validator } from "../../../util/validator";

import styles from "./style.module.css";

type SearchType = "name" | "number" | "department" | "email" | "phone";

function toNullIfEmpty<T>(value: T): T | null {
  return value === "" ? null : value;
}

const MemberListContainer = () => {
  const [searchType, setSearchType] = useState<SearchType>("name");
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const [grade, setGrade] = useState<string | null>(null);
  const [studentStatus, setStudentStatus] = useState<StudentStatus | null>(
    null
  );
  const [page, setPage] = useState(1);

  const limit = 20;
  const offset = (page - 1) * limit;

  const buildListUserRequestDto = () => {
    const dto: ManageUserApiDto["ListUserRequestDto"] = {
      name: null,
      number: null,
      college: null,
      email: null,
      phone: null,
      grade: grade ? Number(grade) : null,
      studentStatus,
      offset,
      limit,
    };

    switch (searchType) {
      case "name":
        dto.name = searchQuery;
        break;
      case "number":
        dto.number = searchQuery;
        break;
      case "department":
        dto.college = searchQuery;
        break;
      case "email":
        dto.email = searchQuery;
        break;
      case "phone":
        dto.phone = searchQuery;
        break;
    }

    return dto;
  };

  const {
    status: queryStatus,
    data,
    error,
    refetch,
  } = useQuery({
    queryKey: ["member-list", page],
    queryFn: () => UserManageApi.listUserForManager(buildListUserRequestDto()),
    retry: 0,
  });

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();

    if (
      grade !== null &&
      Validator.validateGrade(Number(grade)).result === false
    ) {
      return;
    }

    refetch();
    setPage(1);
  };

  return (
    <>
      <Container>
        <h2>회원 목록</h2>
        <form className={styles["member-search-form"]} onSubmit={handleSearch}>
          <div className={styles["member-search-query"]}>
            <div>
              <label>검색어</label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as SearchType)}
              >
                <option value="name">이름</option>
                <option value="number">학번</option>
                <option value="department">학과</option>
                <option value="email">이메일</option>
                <option value="phone">전화번호</option>
              </select>
              <input
                value={searchQuery ?? ""}
                className={styles["search-input"]}
                onChange={(e) => setSearchQuery(toNullIfEmpty(e.target.value))}
              />
            </div>
            <div>
              <label>학년</label>
              <input
                type="number"
                className={styles["grade-input"]}
                value={grade ?? ""}
                onChange={(e) => setGrade(toNullIfEmpty(e.target.value))}
              />
            </div>
            <div>
              <label>상태</label>
              <select
                value={studentStatus ?? ""}
                onChange={(e) =>
                  setStudentStatus(
                    e.target.value === ""
                      ? null
                      : (e.target.value as StudentStatus)
                  )
                }
              >
                <option></option>
                <option value={StudentStatus.ABSENCE}>휴학</option>
                <option value={StudentStatus.UNDERGRADUATE}>재학</option>
                <option value={StudentStatus.GRADUATE}>졸업</option>
              </select>
            </div>
          </div>
          <div className={styles["member-search-button"]}>
            <Button type="submit">검색</Button>
          </div>
        </form>
      </Container>
      <Container>
        {(() => {
          switch (queryStatus) {
            case "pending":
              return <CenterRingLoadingIndicator />;
            case "error":
              return (
                <Callout type="error">{extractErrorMessage(error)}</Callout>
              );
            case "success":
              return (
                <>
                  <h2 className={styles["member-counter"]}>
                    검색 결과 <span>{data.count}명</span>
                  </h2>
                  <div className={styles["member-list"]}>
                    {data.users.map((user) => (
                      <MemberItem key={user.id} user={user} />
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
};

export default MemberListContainer;
