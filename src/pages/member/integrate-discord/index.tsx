import DiscordIntegrationContainer from "../../../features/member/DiscordIntegrationContainer";
import SimpleLogoLayout from "../../../layouts/SimpleLogoLayout";

import styles from "./style.module.css";

export default function IntegrateDiscordPage() {
  return (
    <SimpleLogoLayout>
      <main className={styles["content"]}>
        <DiscordIntegrationContainer />
      </main>
    </SimpleLogoLayout>
  );
}
