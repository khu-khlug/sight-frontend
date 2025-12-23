import Location from "../../../components/Location";
import GroupMatchingFieldRequestContainer from "../../../features/manage/GroupMatchingFieldRequestContainer";
import SightLayout from "../../../layouts/SightLayout";

import "./style.css";

export default function GroupMatchingFieldRequestsPage() {
  return (
    <SightLayout>
      <Location label="분야 추가 요청 관리" />
      <main className="content">
        <GroupMatchingFieldRequestContainer />
      </main>
    </SightLayout>
  );
}
