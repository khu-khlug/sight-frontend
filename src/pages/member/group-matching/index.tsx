import GroupMatchingSurveyContainer from "../../../features/member/GroupMatchingSurveyContainer";
import SimpleLogoLayout from "../../../layouts/SimpleLogoLayout";

import styles from "./style.module.css";

export default function GroupMatchingPage() {
  return (
    <SimpleLogoLayout>
      <main className={styles["content"]}>
        <GroupMatchingSurveyContainer />
      </main>
    </SimpleLogoLayout>
  );
}
