import Location from "../../components/Location";
import FinanceManagementContainer from "../../features/manage/FinanceManagementContainer";
import SightLayout from "../../layouts/SightLayout";

import "./style.css";

export default function FinancePage() {
  return (
    <SightLayout>
      <Location label="동아리비 장부" />
      <main className="content">
        <FinanceManagementContainer />
      </main>
    </SightLayout>
  );
}
