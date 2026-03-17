import DiscordRoleManagementContainer from "../../../features/manage/DiscordRoleManagementContainer";
import SightLayout from "../../../layouts/SightLayout";
import Location from "../../../components/Location";

import styles from "./style.module.css";

export default function DiscordRolePage() {
  return (
    <SightLayout>
      <Location label="디스코드 역할 관리" />
      <main className={styles.content}>
        <DiscordRoleManagementContainer />
      </main>
    </SightLayout>
  );
}
