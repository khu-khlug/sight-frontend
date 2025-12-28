import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import Button from "../../../components/Button";
import Container from "../../../components/Container";

import { FinanceApi, TransactionType } from "../../../api/manage/finance";
import { extractErrorMessage } from "../../../util/extractErrorMessage";

import styles from "./style.module.css";

const getTodayDate = (): string => {
  return new Date().toISOString().split("T")[0];
};

export default function AddTransactionFormContainer() {
  const queryClient = useQueryClient();

  const [type, setType] = useState<TransactionType>(TransactionType.INCOME);
  const [usedAt, setUsedAt] = useState<string>(getTodayDate());
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

  const { mutate, isPending } = useMutation({
    mutationFn: FinanceApi.createTransaction,
    onSuccess: () => {
      // 모든 finance 쿼리 무효화 (연도, 페이지 관계없이)
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      toast.success("거래 내역이 추가되었습니다.");

      // 폼 초기화
      setUsedAt(getTodayDate());
      setDescription("");
      setUnitPrice("");
      setQuantity("1");
      setPlace("");
      setNote("");
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    mutate({
      type,
      date: usedAt,
      description,
      unitPrice: parseFloat(unitPrice),
      quantity: parseInt(quantity, 10),
      amount: amount,
      place,
      note,
    });
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
            <label>날짜</label>
            <input
              type="date"
              value={usedAt}
              onChange={(e) => setUsedAt(e.target.value)}
              className={styles["input"]}
              required
            />
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
          <Button type="submit" disabled={isPending}>
            추가
          </Button>
        </div>
      </form>
    </Container>
  );
}
