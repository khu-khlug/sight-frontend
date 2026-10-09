export const StudentStatus = {
  UNITED: "UNITED", // 교류
  ABSENCE: "ABSENCE", // 휴학
  UNDERGRADUATE: "UNDERGRADUATE", // 재학
  GRADUATE: "GRADUATE", // 졸업
} as const;
export type StudentStatus = (typeof StudentStatus)[keyof typeof StudentStatus];

export const UserStatus = {
  INACTIVE: "INACTIVE", // 정지
  UNAUTHORIZED: "UNAUTHORIZED", // 미승인 혹은 탈퇴
  ACTIVE: "ACTIVE", // 활성
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const GroupType = {
  BASIC_LANGUAGE_STUDY: "BASIC_LANGUAGE_STUDY",
  PROJECT_STYLE_STUDY: "PROJECT_STYLE_STUDY",
  PRACTICAL_PROJECT: "PRACTICAL_PROJECT",
} as const;
export type GroupType = (typeof GroupType)[keyof typeof GroupType];

export const GroupTypeLabel: Record<GroupType, string> = {
  [GroupType.BASIC_LANGUAGE_STUDY]: "기초 언어 스터디",
  [GroupType.PROJECT_STYLE_STUDY]: "프로젝트형 스터디",
  [GroupType.PRACTICAL_PROJECT]: "실무형 프로젝트",
};

export const GroupTypeDescription: Record<GroupType, string> = {
  [GroupType.BASIC_LANGUAGE_STUDY]:
    "Python, Java 등 프로그래밍 언어를 함께 공부해요. 개발이 처음이라면 추천드려요.",
  [GroupType.PROJECT_STYLE_STUDY]:
    "같은 언어나 기술 스택을 사용하는 사람들끼리 모여 함께 공부하고 무언가 만들어봐요. 할 줄 아는 언어가 있는데 이걸로 뭘 해야할지 모르는 분들께 추천드려요.",
  [GroupType.PRACTICAL_PROJECT]:
    "여러 역할을 가진 회원들과 함께 실제 서비스를 기획하고 개발해요. 개발자와 협업해보고 싶었거나, 취업에 활용할 포트폴리오를 만들고 싶으신 분들께 추천드려요.",
};

export const ActivityFrequency = {
  ONCE_OR_TWICE: "ONCE_OR_TWICE",
  THREE_OR_FOUR: "THREE_OR_FOUR",
  FIVE_TO_SEVEN: "FIVE_TO_SEVEN",
} as const;
export type ActivityFrequency =
  (typeof ActivityFrequency)[keyof typeof ActivityFrequency];

export const ActivityFrequencyLabel: Record<ActivityFrequency, string> = {
  [ActivityFrequency.ONCE_OR_TWICE]: "주 1~2회",
  [ActivityFrequency.THREE_OR_FOUR]: "주 3~4회",
  [ActivityFrequency.FIVE_TO_SEVEN]: "주 5~7회",
};

export const PracticalProjectRole = {
  FRONTEND: "프론트엔드 개발자",
  BACKEND: "백엔드 개발자",
  FULLSTACK: "풀스택 개발자",
  MOBILE: "앱 개발자",
  GAME_UNITY: "게임 개발자 (유니티)",
  GAME_UNREAL: "게임 개발자 (언리얼)",
  AI_ML: "AI / ML 개발자",
  DEVOPS: "DevOps / 인프라",
  DESIGNER: "디자이너 (UI/UX)",
  PM: "기획자 / PM",
  OTHER: "기타",
} as const;
export type PracticalProjectRole =
  (typeof PracticalProjectRole)[keyof typeof PracticalProjectRole];

export const SpecialOrganization = {
  SECURITY_HACKING_TRACK: "SECURITY_HACKING_TRACK",
} as const;
export type SpecialOrganization = (typeof SpecialOrganization)[keyof typeof SpecialOrganization];

export const SpecialOrganizationLabel: Record<SpecialOrganization, string> = {
  [SpecialOrganization.SECURITY_HACKING_TRACK]: "보안해킹트랙",
};

export const GroupCategory = {
  STUDY: "STUDY",
  PROJECT: "PROJECT",
  DOCUMENTATION: "DOCUMENTATION",
  MANAGE: "MANAGE",
  EDUCATION: "EDUCATION",
  PROGRAM: "PROGRAM",
} as const;
export type GroupCategory = (typeof GroupCategory)[keyof typeof GroupCategory];

export const GroupCategoryLabel: Record<GroupCategory, string> = {
  [GroupCategory.STUDY]: "스터디",
  [GroupCategory.PROJECT]: "프로젝트",
  [GroupCategory.DOCUMENTATION]: "문서화",
  [GroupCategory.MANAGE]: "운영",
  [GroupCategory.EDUCATION]: "교육",
  [GroupCategory.PROGRAM]: "프로그램",
};

// 레거시 group.state는 pending(생성 직후 기본값)도 갖지만, tasks/group/GROUP_BUSINESS_RULES.md와
// policy/그룹/POLICY.md에 정의된 4가지 상태만 다룬다.
export const GroupStatus = {
  PROGRESS: "PROGRESS",
  STOP: "STOP",
  SUCCESS: "SUCCESS",
  FAIL: "FAIL",
} as const;
export type GroupStatus = (typeof GroupStatus)[keyof typeof GroupStatus];

export const GroupStatusLabel: Record<GroupStatus, string> = {
  [GroupStatus.PROGRESS]: "진행 중",
  [GroupStatus.STOP]: "중단",
  [GroupStatus.SUCCESS]: "종료(성공)",
  [GroupStatus.FAIL]: "종료(실패)",
};

// 레거시 group.grade(0/2/3/4, 1은 결번)에 대응. tasks/group/GROUP_BUSINESS_RULES.md 기준이며
// 아직 policy/그룹/POLICY.md나 GLOSSARY.md에 정식 등재된 용어는 아니다.
export const GroupVisibility = {
  PRIVATE: "PRIVATE",
  MANAGER_ONLY: "MANAGER_ONLY",
  MEMBER_ONLY: "MEMBER_ONLY",
  PUBLIC: "PUBLIC",
} as const;
export type GroupVisibility =
  (typeof GroupVisibility)[keyof typeof GroupVisibility];

export const GroupVisibilityLabel: Record<GroupVisibility, string> = {
  [GroupVisibility.PRIVATE]: "비공개",
  [GroupVisibility.MANAGER_ONLY]: "운영진 공개",
  [GroupVisibility.MEMBER_ONLY]: "회원 공개",
  [GroupVisibility.PUBLIC]: "완전 공개",
};

// group.interest('|' 구분 문자열)에 들어가는 관심분야 9종.
export const GroupInterest = {
  WEB_APP_SERVICE: "WEB_APP_SERVICE",
  UX_UI_DESIGN: "UX_UI_DESIGN",
  GAME_GRAPHICS: "GAME_GRAPHICS",
  AI_DATA_SCIENCE: "AI_DATA_SCIENCE",
  CIRCUIT_IOT: "CIRCUIT_IOT",
  NETWORK_CLOUD: "NETWORK_CLOUD",
  SYSTEM_PROGRAMMING: "SYSTEM_PROGRAMMING",
  SECURITY_HACKING: "SECURITY_HACKING",
  ALGORITHM_THEORY: "ALGORITHM_THEORY",
} as const;
export type GroupInterest = (typeof GroupInterest)[keyof typeof GroupInterest];

export const GroupInterestLabel: Record<GroupInterest, string> = {
  [GroupInterest.WEB_APP_SERVICE]: "웹·애플리케이션 서비스",
  [GroupInterest.UX_UI_DESIGN]: "UX·UI 디자인",
  [GroupInterest.GAME_GRAPHICS]: "게임·그래픽스",
  [GroupInterest.AI_DATA_SCIENCE]: "AI·데이터사이언스",
  [GroupInterest.CIRCUIT_IOT]: "전자회로·사물인터넷",
  [GroupInterest.NETWORK_CLOUD]: "네트워크·클라우드",
  [GroupInterest.SYSTEM_PROGRAMMING]: "시스템 프로그래밍",
  [GroupInterest.SECURITY_HACKING]: "보안·해킹",
  [GroupInterest.ALGORITHM_THEORY]: "알고리즘·전산이론",
};

export const Semester = {
  FIRST: 1,
  SECOND: 2,
} as const;
export type Semester = (typeof Semester)[keyof typeof Semester];

export const SemesterLabel: Record<Semester, string> = {
  [Semester.FIRST]: "1학기",
  [Semester.SECOND]: "2학기",
};
