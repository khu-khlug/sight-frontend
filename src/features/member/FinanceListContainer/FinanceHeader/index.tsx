import styles from "./style.module.css";

interface FinanceHeaderProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
}

const FinanceHeader = ({
  selectedYear,
  onYearChange,
}: FinanceHeaderProps) => {
  const currentYear = new Date().getFullYear();

  // 연도 선택 옵션 생성 (2020년부터 현재 연도까지)
  const yearOptions = Array.from(
    { length: currentYear - 2020 + 1 },
    (_, i) => 2020 + i
  ).reverse();

  const accountInfo = "하나은행 534-910013-94604 경희대학교 쿠러그";

  return (
    <div className={styles["header-section"]}>
      <div className={styles["year-selector"]}>
        <h2>동아리비 장부</h2>
        <select
          value={selectedYear}
          onChange={(e) => onYearChange(Number(e.target.value))}
          className={styles["year-select"]}
        >
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div className={styles["account-info"]}>
        회비 납부 계좌: {accountInfo}
      </div>
    </div>
  );
};

export default FinanceHeader;
