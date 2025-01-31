import React, { useState } from "react";

import Container from "../../../components/Container";
import Button from "../../../components/Button";

import { ManageUserApiDto } from "../../../api/manage/user";
import { StudentStatus, UserStatus } from "../../../constant";

import styles from "./style.module.css";
import MemberItem from "../../../components/MemberItem";

type SearchType = "name" | "number" | "department" | "email" | "phone";

const data: ManageUserApiDto["ListUserResponseDto"] = {
  count: 5,
  users: [
    {
      id: 1,
      name: "doralife12",
      profile: {
        name: "김현우",
        college:
          "소프트웨어융합대학 컴퓨터공학부,응용과학대학 응용수학과,외국어대학 한국어학과",
        grade: 2,
        number: 2021105589,
        email: "doralife12@gmail.com",
        phone: "010-0000-0000",
        homepage: "http://johndoe.com",
        language: "English",
        prefer: "Remote",
      },
      admission: "21",
      studentStatus: StudentStatus.UNDERGRADUATE,
      point: 100,
      status: UserStatus.ACTIVE,
      manager: false,
      slack: "john_doe",
      rememberToken: null,
      khuisAuthAt: new Date("2020-09-01T00:00:00Z"),
      returnAt: null,
      returnReason: null,
      lastLoginAt: new Date("2023-10-01T12:00:00Z"),
      lastEnterAt: new Date("2023-10-01T12:00:00Z"),
      normalTags: ["납부대상1", "납부대상상"],
      redTags: [],
      createdAt: new Date("2020-09-01T00:00:00Z"),
      updatedAt: new Date("2023-10-01T12:00:00Z"),
    },
    {
      id: 2,
      name: "jane_smith_456",
      profile: {
        name: "Jane Smith",
        college: "Science",
        grade: 2,
        number: 67890,
        email: "jane.smith@example.com",
        phone: "987-654-3210",
        homepage: "http://janesmith.com",
        language: "English",
        prefer: "On-site",
      },
      admission: "2019-09-01",
      studentStatus: StudentStatus.UNDERGRADUATE,
      point: 200,
      status: UserStatus.ACTIVE,
      manager: true,
      slack: "jane_smith",
      rememberToken: null,
      khuisAuthAt: new Date("2019-09-01T00:00:00Z"),
      returnAt: null,
      returnReason: null,
      lastLoginAt: new Date("2023-09-01T12:00:00Z"),
      lastEnterAt: new Date("2023-09-01T12:00:00Z"),
      normalTags: [],
      redTags: [],
      createdAt: new Date("2019-09-01T00:00:00Z"),
      updatedAt: new Date("2023-09-01T12:00:00Z"),
    },
    {
      id: 3,
      name: "alice_johnson_789",
      profile: {
        name: "Alice Johnson",
        college: "Arts",
        grade: 4,
        number: 11223,
        email: "alice.johnson@example.com",
        phone: "321-654-9870",
        homepage: "http://alicejohnson.com",
        language: "English",
        prefer: "Hybrid",
      },
      admission: "2018-09-01",
      studentStatus: StudentStatus.ABSENCE,
      point: 150,
      status: UserStatus.ACTIVE,
      manager: false,
      slack: "alice_johnson",
      rememberToken: null,
      khuisAuthAt: new Date("2018-09-01T00:00:00Z"),
      returnAt: null,
      returnReason: null,
      lastLoginAt: new Date("2023-08-01T12:00:00Z"),
      lastEnterAt: new Date("2023-08-01T12:00:00Z"),
      normalTags: [],
      redTags: [],
      createdAt: new Date("2018-09-01T00:00:00Z"),
      updatedAt: new Date("2023-08-01T12:00:00Z"),
    },
    {
      id: 4,
      name: "bob_brown_101",
      profile: {
        name: "Bob Brown",
        college: "Business",
        grade: 1,
        number: 44556,
        email: "bob.brown@example.com",
        phone: "654-321-0987",
        homepage: "http://bobbrown.com",
        language: "English",
        prefer: "Remote",
      },
      admission: "2021-09-01",
      studentStatus: StudentStatus.GRADUATE,
      point: 50,
      status: UserStatus.ACTIVE,
      manager: false,
      slack: "bob_brown",
      rememberToken: null,
      khuisAuthAt: new Date("2021-09-01T00:00:00Z"),
      returnAt: null,
      returnReason: null,
      lastLoginAt: new Date("2023-07-01T12:00:00Z"),
      lastEnterAt: new Date("2023-07-01T12:00:00Z"),
      normalTags: [],
      redTags: [],
      createdAt: new Date("2021-09-01T00:00:00Z"),
      updatedAt: new Date("2023-07-01T12:00:00Z"),
    },
    {
      id: 5,
      name: "charlie_davis_112",
      profile: {
        name: "Charlie Davis",
        college: "Law",
        grade: 3,
        number: 77889,
        email: "charlie.davis@example.com",
        phone: "789-012-3456",
        homepage: "http://charliedavis.com",
        language: "English",
        prefer: "On-site",
      },
      admission: "2020-09-01",
      studentStatus: StudentStatus.GRADUATE,
      point: 75,
      status: UserStatus.ACTIVE,
      manager: true,
      slack: "charlie_davis",
      rememberToken: null,
      khuisAuthAt: new Date("2020-09-01T00:00:00Z"),
      returnAt: null,
      returnReason: null,
      lastLoginAt: new Date("2023-06-01T12:00:00Z"),
      lastEnterAt: new Date("2023-06-01T12:00:00Z"),
      normalTags: [],
      redTags: [],
      createdAt: new Date("2020-09-01T00:00:00Z"),
      updatedAt: new Date("2023-06-01T12:00:00Z"),
    },
  ],
};

const MemberListContainer = () => {
  const [searchType, setSearchType] = useState<SearchType>("email");
  const [searchQuery, setSearchQuery] = useState("");
  const [grade, setGrade] = useState("");
  const [status, setStatus] = useState("휴학");

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    // 검색 로직 추가
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
                value={searchQuery}
                className={styles["search-input"]}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <label>학년</label>
              <input
                type="number"
                className={styles["grade-input"]}
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
              />
            </div>
            <div>
              <label>상태</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
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
        <h2 className={styles["member-counter"]}>
          검색 결과 <span>{data.count}명</span>
        </h2>
        <div className={styles["member-list"]}>
          {data.users.map((user) => (
            <MemberItem key={user.id} user={user} />
          ))}
        </div>
      </Container>
    </>
  );
};

export default MemberListContainer;
