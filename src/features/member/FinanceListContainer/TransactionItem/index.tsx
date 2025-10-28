import dayjs from "dayjs";

import { Transaction, TransactionType } from "../../../../api/manage/finance";
import { formatCurrency } from "../../../../util/currency";

import styles from "./style.module.css";

type Props = {
  transaction: Transaction;
};

export default function TransactionItem({ transaction }: Props) {
  const isIncome = transaction.type === TransactionType.INCOME;
  const typeLabel = isIncome ? "수입" : "지출";
  const badgeClassName = isIncome
    ? styles["type-badge-income"]
    : styles["type-badge-expense"];

  return (
    <div className={styles["transaction-item"]}>
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
}
