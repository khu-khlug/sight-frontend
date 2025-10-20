import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import Container from "../../../components/Container";
import CenterRingLoadingIndicator from "../../../components/RingLoadingIndicator/center";
import Callout from "../../../components/Callout";

import { FinanceApi } from "../../../api/manage/finance";
import { extractErrorMessage } from "../../../util/extractErrorMessage";
import { formatCurrency } from "../../../util/currency";
import TransactionItem from "./TransactionItem";

import styles from "./style.module.css";

const FinanceManagementContainer = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const {
    status: queryStatus,
    data,
    error,
  } = useQuery({
    queryKey: ["finance", selectedYear],
    queryFn: () => FinanceApi.getTransactionsByYear(selectedYear),
    retry: 0,
  });

  // 연도 선택 옵션 생성 (2020년부터 현재 연도까지)
  const yearOptions = Array.from(
    { length: currentYear - 2020 + 1 },
    (_, i) => 2020 + i
  ).reverse();


  return (
    <Container>
      <div className={styles["header-section"]}>
        <div className={styles["year-selector"]}>
          <h2>동아리비 장부</h2>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className={styles["year-select"]}
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        {data && (
          <div className={styles["balance-display"]}>
            <span className={styles["balance-label"]}>
              {selectedYear}. 10. 20. 현재 잔액:
            </span>
            <span className={styles["balance-amount"]}>
              {formatCurrency(data.currentBalance)}
            </span>
          </div>
        )}
      </div>

      {/* 연락 정보 */}
      <div className={styles["contact-info"]}>
        회비 납부 계좌: 하나은행 534-910013-94604 경희대학교 쿠러그
      </div>

      {(() => {
        switch (queryStatus) {
          case "pending":
            return <CenterRingLoadingIndicator />;
          case "error":
            return (
              <Callout type="error">{extractErrorMessage(error)}</Callout>
            );
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

export default FinanceManagementContainer;
