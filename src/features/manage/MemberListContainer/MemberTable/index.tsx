import { ManageUserApiDto } from "../../../../api/manage/user";
import MemberTableRow from "../MemberTableRow";

import styles from "./style.module.css";

type SearchType = "name" | "number" | "department" | "email" | "phone";

type Props = {
  users: ManageUserApiDto["UserResponse"][];
  searchType: SearchType;
  onSelectUser: (user: ManageUserApiDto["UserResponse"]) => void;
};

export default function MemberTable({ users, searchType, onSelectUser }: Props) {
  return (
    <table className={styles["table"]}>
      <thead>
        <tr>
          <th>이름</th>
          <th>학번</th>
          <th>학년/학적상태</th>
          <th>태그</th>
          <th>상세보기</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <MemberTableRow
            key={user.id}
            user={user}
            searchType={searchType}
            onDetailClick={() => onSelectUser(user)}
          />
        ))}
      </tbody>
    </table>
  );
}
