import Location from "../../components/Location";
import AddTransactionFormContainer from "../../features/manage/AddTransactionFormContainer";
import FinanceListContainer from "../../features/member/FinanceListContainer";
import SightLayout from "../../layouts/SightLayout";

import "./style.css";

export default function FinancePage() {
  return (
    <SightLayout>
      <Location label="동아리비 장부" />
      <main className="content">
        <AddTransactionFormContainer />
        <FinanceListContainer />
      </main>
    </SightLayout>
  );
}
