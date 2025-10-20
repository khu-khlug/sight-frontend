import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";

import Container from "../../../components/Container";
import Button from "../../../components/Button";
import CenterRingLoadingIndicator from "../../../components/RingLoadingIndicator/center";
import Callout from "../../../components/Callout";

import {
  FinanceApi,
  Transaction,
  TransactionType,
} from "../../../api/manage/finance";
import { extractErrorMessage } from "../../../util/extractErrorMessage";
import { formatCurrency } from "../../../util/currency";

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

  const renderTransactionCard = (transaction: Transaction) => {
    const isIncome = transaction.type === TransactionType.INCOME;
    const typeLabel = isIncome ? "수입" : "지출";
    const badgeClassName = isIncome
      ? styles["type-badge-income"]
      : styles["type-badge-expense"];

    return (
      <div key={transaction.id} className={styles["transaction-item"]}>
        <div className={`${styles["type-badge"]} ${badgeClassName}`}>
          {typeLabel}
        </div>
        <div className={styles["transaction-card"]}>
          <div className={styles["card-main"]}>
            <div className={styles["card-left"]}>
              <div className={styles["card-title"]}>
                {transaction.description}
              </div>
              <div className={styles["card-details"]}>
                <span className={styles["card-date"]}>
                  {dayjs(transaction.date).format("YYYY. MM. DD.")} |{" "}
                  {transaction.place}
                </span>
              </div>
            </div>
            <div className={styles["card-right"]}>
              <div className={styles["card-amount"]}>
                {formatCurrency(transaction.amount)}
              </div>
              {transaction.unitPrice > 0 && transaction.quantity > 0 && (
                <div className={styles["card-breakdown"]}>
                  {transaction.unitPrice.toLocaleString("ko-KR")} ×{" "}
                  {transaction.quantity}
                </div>
              )}
              <div className={styles["card-balance"]}>
                총 {formatCurrency(transaction.balance)}
              </div>
            </div>
          </div>
          {transaction.note && (
            <div className={styles["card-note"]}>비고: {transaction.note}</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
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
      </Container>

      <Container>
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
                <>
                  {/* 월별 집계 섹션 */}
                  <div className={styles["monthly-aggregate"]}>
                    <table className={styles["aggregate-table"]}>
                      <tbody>
                        <tr className={styles["aggregate-row"]}>
                          <td className={styles["aggregate-label"]}>
                            {data.monthlyAggregates[0]?.yearMonth}
                          </td>
                          <td>
                            <span className={styles["aggregate-header"]}>
                              항목
                            </span>
                          </td>
                          <td>
                            <span className={styles["aggregate-header"]}>
                              단가
                            </span>
                          </td>
                          <td>
                            <span className={styles["aggregate-header"]}>
                              수량
                            </span>
                          </td>
                          <td>
                            <span className={styles["aggregate-header"]}>
                              금액
                            </span>
                          </td>
                          <td colSpan={2} style={{ textAlign: "center" }}>
                            <span className={styles["aggregate-header"]}>
                              사용/수금자
                            </span>
                          </td>
                          <td colSpan={2} style={{ textAlign: "center" }}>
                            <span className={styles["aggregate-header"]}>
                              비고
                            </span>
                          </td>
                          <td>
                            <span className={styles["aggregate-header"]}>
                              누적
                            </span>
                          </td>
                        </tr>
                        <tr className={styles["aggregate-data-row"]}>
                          <td></td>
                          <td></td>
                          <td className={styles["amount-cell"]}>0</td>
                          <td className={styles["amount-cell"]}>0</td>
                          <td className={styles["amount-cell"]}>0</td>
                          <td colSpan={5}></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 안내 메시지 */}
                  <div className={styles["info-message"]}>
                    <p>
                      수입을 등록하려면 금액을 음수로 입력합니다. return(enter)
                      키를 눌러 등록합니다.
                    </p>
                    <p>
                      각 항목의 수입/지출을 눌러 반영할 수 있습니다. 단,
                      취소하더라도 수기 제거는 별도 처리가 필요합니다.
                    </p>
                  </div>

                  {/* 연락 정보 */}
                  <div className={styles["contact-info"]}>
                    회비 납부 계좌: 하나은행 534-910013-94604 경희대학교 쿠러그
                  </div>

                  {/* 거래 내역 카드 리스트 */}
                  <div className={styles["transactions-section"]}>
                    {data.transactions.map((transaction) =>
                      renderTransactionCard(transaction)
                    )}
                  </div>
                </>
              );
          }
        })()}
      </Container>
    </>
  );
};

export default FinanceManagementContainer;
