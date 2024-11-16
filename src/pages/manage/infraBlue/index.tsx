import DoorLockManagementContainer from "../../../features/manage/DoorLockManagementContainer";
import SightLayout from "../../../layouts/SightLayout";
import Location from "../../../components/Location";

import "./style.css";

export default function InfraBluePage() {
  return (
    <SightLayout>
      <Location label="infraBlue" />
      <main className="content">
        <DoorLockManagementContainer />
      </main>
    </SightLayout>
  );
}
