import { useState, useEffect } from "react";
import Button from "../../../components/Button";
import { TransactionType } from "../../../api/manage/finance";

import styles from "./style.module.css";
import Container from "../../../components/Container";

export default function AddTransactionFormContainer() {
  const [type, setType] = useState<TransactionType>(TransactionType.INCOME);
  const [description, setDescription] = useState("");
  const [unitPrice, setUnitPrice] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [amount, setAmount] = useState<number>(0);
  const [place, setPlace] = useState("");
  const [note, setNote] = useState("");

  // 단가와 수량이 변경될 때마다 금액 자동 계산
  useEffect(() => {
    const price = parseFloat(unitPrice) || 0;
    const qty = parseFloat(quantity) || 0;
    setAmount(price * qty);
  }, [unitPrice, quantity]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log("New transaction:", {
      type,
      description,
      unitPrice,
      quantity,
      amount,
      place,
      note,
    });
    // TODO: API 호출하여 거래 추가
    // 추가 후 데이터 refetch

    setDescription("");
    setUnitPrice("");
    setQuantity("1");
    setPlace("");
    setNote("");
  };

  return (
    <Container>
      <h2>항목 추가</h2>
      <form onSubmit={handleSubmit} className={styles["form"]}>
        <div className={styles["form-row"]}>
          <div className={styles["form-group"]}>
            <label>구분</label>
            <div className={styles["radio-group"]}>
              <label className={styles["radio-label"]}>
                <input
                  type="radio"
                  name="type"
                  value={TransactionType.INCOME}
                  checked={type === TransactionType.INCOME}
                  onChange={(e) => setType(e.target.value as TransactionType)}
                  className={styles["radio"]}
                />
                <span>수입</span>
              </label>
              <label className={styles["radio-label"]}>
                <input
                  type="radio"
                  name="type"
                  value={TransactionType.EXPENSE}
                  checked={type === TransactionType.EXPENSE}
                  onChange={(e) => setType(e.target.value as TransactionType)}
                  className={styles["radio"]}
                />
                <span>지출</span>
              </label>
            </div>
          </div>

          <div className={styles["form-group"]}>
            <label>항목</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="예: 2025-2학기 회비"
              className={styles["input"]}
              required
            />
          </div>
        </div>

        <div className={styles["form-row"]}>
          <div className={styles["form-group"]}>
            <label>단가</label>
            <input
              type="number"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              placeholder="0"
              className={styles["input"]}
              min="0"
              required
            />
          </div>

          <div className={styles["form-group"]}>
            <label>수량</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="1"
              className={styles["input"]}
              min="1"
              required
            />
          </div>

          <div className={styles["form-group"]}>
            <label>금액 (자동 계산)</label>
            <input
              type="text"
              value={amount.toLocaleString("ko-KR")}
              className={styles["input-readonly"]}
              readOnly
            />
          </div>
        </div>

        <div className={styles["form-row"]}>
          <div className={styles["form-group"]}>
            <label>사용/수급처</label>
            <input
              type="text"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="예: 홍길동"
              className={styles["input"]}
              required
            />
          </div>

          <div className={styles["form-group"]}>
            <label>비고 (선택)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="비고 입력"
              className={styles["input"]}
            />
          </div>
        </div>

        <div className={styles["submit-button-wrapper"]}>
          <Button type="submit">추가</Button>
        </div>
      </form>
    </Container>
  );
}
