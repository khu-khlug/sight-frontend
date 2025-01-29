import Location from "../../../components/Location";
import MemberListContainer from "../../../features/manage/MemberListContainer";
import SightLayout from "../../../layouts/SightLayout";

import "./style.css";

export default function MemberV2Page() {
  return (
    <SightLayout>
      <Location label="회원 관리 V2" />
      <main className="content">
        <MemberListContainer />
      </main>
    </SightLayout>
  );
}
