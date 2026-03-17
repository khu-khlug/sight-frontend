import DoorLockManagementContainer from "../../../features/manage/DoorLockManagementContainer";
import SightLayout from "../../../layouts/SightLayout";
import Location from "../../../components/Location";

import styles from "./style.module.css";

export default function InfraBluePage() {
  return (
    <SightLayout>
      <Location label="infraBlue" />
      <main className={styles.content}>
        <DoorLockManagementContainer />
      </main>
    </SightLayout>
  );
}
