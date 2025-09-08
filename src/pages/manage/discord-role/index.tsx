import DiscordRoleManagementContainer from "../../../features/manage/DiscordRoleManagementContainer";
import SightLayout from "../../../layouts/SightLayout";
import Location from "../../../components/Location";

import "./style.css";

export default function DiscordRolePage() {
  return (
    <SightLayout>
      <Location label="디스코드 역할 관리" />
      <main className="content">
        <DiscordRoleManagementContainer />
      </main>
    </SightLayout>
  );
}