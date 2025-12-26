import Location from "../../../components/Location";
import GroupMatchingFieldManagementContainer from "../../../features/manage/GroupMatchingFieldManagementContainer";
import SightLayout from "../../../layouts/SightLayout";

import "./style.css";

export default function GroupMatchingFieldsPage() {
  return (
    <SightLayout>
      <Location label="관심 분야 관리" />
      <main className="content">
        <GroupMatchingFieldManagementContainer />
      </main>
    </SightLayout>
  );
}
