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
  STUDY: "STUDY",
  PROJECT: "PROJECT",
} as const;
export type GroupType = (typeof GroupType)[keyof typeof GroupType];

export const GroupTypeLabel: Record<GroupType, string> = {
  [GroupType.STUDY]: "스터디",
  [GroupType.PROJECT]: "프로젝트",
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

export const Semester = {
  FIRST: 1,
  SECOND: 2,
} as const;
export type Semester = (typeof Semester)[keyof typeof Semester];

export const SemesterLabel: Record<Semester, string> = {
  [Semester.FIRST]: "1학기",
  [Semester.SECOND]: "2학기",
};
