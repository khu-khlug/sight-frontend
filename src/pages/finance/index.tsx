import Location from "../../components/Location";
import AddTransactionFormContainer from "../../features/manage/AddTransactionFormContainer";
import FinanceListContainer from "../../features/member/FinanceListContainer";
import SightLayout from "../../layouts/SightLayout";
import { useIsManager } from "../../hooks/user/useIsManager";

import "./style.css";

export default function FinancePage() {
  const { isManager } = useIsManager();

  return (
    <SightLayout>
      <Location label="동아리비 장부" />
      <main className="content">
        {isManager && <AddTransactionFormContainer />}
        <FinanceListContainer />
      </main>
    </SightLayout>
  );
}
