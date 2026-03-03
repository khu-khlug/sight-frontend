export type SearchType = "name" | "number" | "department" | "email" | "phone";

import { StudentStatus } from "../../../constant";

export const StudentStatusLabel: Record<StudentStatus, string> = {
  [StudentStatus.UNITED]: "교류",
  [StudentStatus.ABSENCE]: "휴학",
  [StudentStatus.UNDERGRADUATE]: "재학",
  [StudentStatus.GRADUATE]: "졸업",
};
