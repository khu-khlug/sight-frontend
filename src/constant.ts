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
    "특정 주제나 기술을 함께 공부하고 활용해서 무언가 만들어봐요. 할 줄 아는 언어가 있는데 이걸로 뭘 해야할지 모르는 분들께 추천드려요.",
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
  DESIGNER: "디자이너 (UI/UX)",
  PM: "기획자 / PM",
  OTHER: "기타",
} as const;
export type PracticalProjectRole =
  (typeof PracticalProjectRole)[keyof typeof PracticalProjectRole];

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

export const Semester = {
  FIRST: 1,
  SECOND: 2,
} as const;
export type Semester = (typeof Semester)[keyof typeof Semester];

export const SemesterLabel: Record<Semester, string> = {
  [Semester.FIRST]: "1학기",
  [Semester.SECOND]: "2학기",
};
