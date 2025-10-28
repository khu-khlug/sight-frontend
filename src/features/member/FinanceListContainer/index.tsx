import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import Container from "../../../components/Container";
import CenterRingLoadingIndicator from "../../../components/RingLoadingIndicator/center";
import Callout from "../../../components/Callout";

import { FinanceApi } from "../../../api/manage/finance";
import { extractErrorMessage } from "../../../util/extractErrorMessage";
import TransactionItem from "./TransactionItem";
import FinanceHeader from "./FinanceHeader";

import styles from "./style.module.css";

const FinanceListContainer = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const accountInfo = "하나은행 534-910013-94604 경희대학교 쿠러그";

  const {
    status: queryStatus,
    data,
    error,
  } = useQuery({
    queryKey: ["finance", selectedYear],
    queryFn: () => FinanceApi.getTransactionsByYear(selectedYear),
    retry: 0,
  });

  return (
    <Container>
      <FinanceHeader
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        currentBalance={data?.currentBalance}
        accountInfo={accountInfo}
      />

      {(() => {
        switch (queryStatus) {
          case "pending":
            return <CenterRingLoadingIndicator />;
          case "error":
            return <Callout type="error">{extractErrorMessage(error)}</Callout>;
          case "success":
            return (
              <div className={styles["transactions-section"]}>
                {data.transactions.map((transaction) => (
                  <TransactionItem
                    key={transaction.id}
                    transaction={transaction}
                  />
                ))}
              </div>
            );
        }
      })()}
    </Container>
  );
};

export default FinanceListContainer;
