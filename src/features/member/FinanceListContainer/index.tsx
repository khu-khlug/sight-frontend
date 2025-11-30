import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import Container from "../../../components/Container";
import CenterRingLoadingIndicator from "../../../components/RingLoadingIndicator/center";
import Callout from "../../../components/Callout";
import PageNavigator from "../../../components/PageNavigator";

import { FinanceApi } from "../../../api/manage/finance";
import { extractErrorMessage } from "../../../util/extractErrorMessage";
import TransactionItem from "./TransactionItem";
import FinanceHeader from "./FinanceHeader";

import styles from "./style.module.css";

const LIMIT = 20;

const FinanceListContainer = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [currentPage, setCurrentPage] = useState<number>(1);

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

  // 연도 변경 시 페이지를 1로 리셋
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setCurrentPage(1);
  };

  // 페이지네이션을 위한 데이터 계산
  const transactions = data?.transactions || [];
  const totalCount = transactions.length;
  const startIndex = (currentPage - 1) * LIMIT;
  const endIndex = startIndex + LIMIT;
  const paginatedTransactions = transactions.slice(startIndex, endIndex);

  return (
    <Container>
      <FinanceHeader
        selectedYear={selectedYear}
        onYearChange={handleYearChange}
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
              <>
                <div className={styles["transactions-section"]}>
                  {paginatedTransactions.map((transaction) => (
                    <TransactionItem
                      key={transaction.id}
                      transaction={transaction}
                    />
                  ))}
                </div>
                <div className={styles["pagination-section"]}>
                  <PageNavigator
                    currentPage={currentPage}
                    countPerPage={LIMIT}
                    totalCount={totalCount}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </>
            );
        }
      })()}
    </Container>
  );
};

export default FinanceListContainer;
