export const StudentStatus = {
  UNITED: -1, // 교류
  ABSENCE: 0, // 휴학
  UNDERGRADUATE: 1, // 재학
  GRADUATE: 2, // 졸업
} as const;
export type StudentStatus = (typeof StudentStatus)[keyof typeof StudentStatus];

export const UserStatus = {
  INACTIVE: -1, // 정지
  UNAUTHORIZED: 0, // 미승인 혹은 탈퇴
  ACTIVE: 1, // 활성
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

export const Semester = {
  FIRST: 1,
  SECOND: 2,
} as const;
export type Semester = (typeof Semester)[keyof typeof Semester];

export const SemesterLabel: Record<Semester, string> = {
  [Semester.FIRST]: "1학기",
  [Semester.SECOND]: "2학기",
};
