import Location from "../../../components/Location";
import GroupMatchingManagementContainer from "../../../features/manage/GroupMatchingManagementContainer";
import GroupMatchingFieldManagementContainer from "../../../features/manage/GroupMatchingFieldManagementContainer";
import SightLayout from "../../../layouts/SightLayout";

import "./style.css";

export default function GroupMatchingManagementPage() {
  return (
    <SightLayout>
      <Location label="그룹 매칭 관리" />
      <main className="content">
        <GroupMatchingManagementContainer />
        <GroupMatchingFieldManagementContainer />
      </main>
    </SightLayout>
  );
}
