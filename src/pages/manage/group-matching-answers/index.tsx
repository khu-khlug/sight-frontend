import Location from "../../../components/Location";
import GroupMatchingAnswerListContainer from "../../../features/manage/GroupMatchingAnswerListContainer";
import SightLayout from "../../../layouts/SightLayout";

import "./style.css";

export default function GroupMatchingAnswersPage() {
  return (
    <SightLayout>
      <Location label="그룹 매칭 응답 목록" />
      <main className="content">
        <GroupMatchingAnswerListContainer />
      </main>
    </SightLayout>
  );
}
