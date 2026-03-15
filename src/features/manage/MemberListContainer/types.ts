export type SearchType = "name" | "number" | "department" | "email" | "phone";

import { StudentStatus } from "../../../constant";
import { MemberTagFilter } from "../../../api/manage/user";

export const StudentStatusLabel: Record<StudentStatus, string> = {
  [StudentStatus.UNITED]: "교류",
  [StudentStatus.ABSENCE]: "휴학",
  [StudentStatus.UNDERGRADUATE]: "재학",
  [StudentStatus.GRADUATE]: "졸업",
};

export const MemberTagFilterLabel: Record<MemberTagFilter, string> = {
  UNAUTHORIZED: "미인증",
  BLOCKED: "차단",
  MINUS_EXP: "-exp",
  FEE_TARGET: "납부 대상",
  HALF_FEE_TARGET: "반액 납부 대상",
};
