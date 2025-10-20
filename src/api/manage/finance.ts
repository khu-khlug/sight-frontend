export const TransactionType = {
  INCOME: "income", // 수입
  EXPENSE: "expense", // 지출
} as const;
export type TransactionType =
  (typeof TransactionType)[keyof typeof TransactionType];

export type Transaction = {
  id: number;
  date: string; // YYYY-MM-DD 형식
  type: TransactionType;
  description: string; // 항목
  unitPrice: number; // 단가
  quantity: number; // 수량
  amount: number; // 금액 (unitPrice * quantity)
  place: string; // 사용/수금자
  note: string; // 비고
  balance: number; // 누적 잔액
};

export type MonthlyAggregate = {
  yearMonth: string; // YYYYMM 형식
  totalIncome: number;
  totalExpense: number;
  balance: number;
};

export type FinanceSummary = {
  year: number;
  currentBalance: number;
  transactions: Transaction[];
  monthlyAggregates: MonthlyAggregate[];
};

// 더미 데이터
const dummyTransactions: Omit<Transaction, "id" | "balance">[] = [
  {
    date: "2025-10-12",
    type: TransactionType.INCOME,
    description: "2025-2학기 회비",
    unitPrice: 20000,
    quantity: 1,
    amount: 20000,
    place: "김OO",
    note: "XXX",
  },
  {
    date: "2025-10-09",
    type: TransactionType.INCOME,
    description: "2025-2학기 회비",
    unitPrice: 20000,
    quantity: 1,
    amount: 20000,
    place: "김OO",
    note: "",
  },
  {
    date: "2025-10-02",
    type: TransactionType.EXPENSE,
    description: "25-1 남동아 방학기 우수",
    unitPrice: 30000,
    quantity: 1,
    amount: 30000,
    place: "최OO",
    note: "",
  },
  {
    date: "2025-10-02",
    type: TransactionType.EXPENSE,
    description: "10월 서버비",
    unitPrice: 56026,
    quantity: 1,
    amount: 56026,
    place: "Amazon AWS",
    note: "XXX",
  },
  {
    date: "2025-09-30",
    type: TransactionType.INCOME,
    description: "2025-2학기 회비",
    unitPrice: 20000,
    quantity: 1,
    amount: 20000,
    place: "이OO",
    note: "",
  },
  {
    date: "2025-09-30",
    type: TransactionType.INCOME,
    description: "9월 총회 회비",
    unitPrice: 15000,
    quantity: 3,
    amount: 45000,
    place: "차OO, 권OO, 김OO",
    note: "",
  },
  {
    date: "2025-09-29",
    type: TransactionType.INCOME,
    description: "9월 총회 회비",
    unitPrice: 15000,
    quantity: 1,
    amount: 15000,
    place: "이OO",
    note: "",
  },
  {
    date: "2025-09-28",
    type: TransactionType.INCOME,
    description: "2025-2학기 회비",
    unitPrice: 20000,
    quantity: 1,
    amount: 20000,
    place: "김OO",
    note: "",
  },
];

// 잔액 계산 및 ID 부여
function calculateBalances(
  transactions: Omit<Transaction, "id" | "balance">[],
  initialBalance: number
): Transaction[] {
  let currentBalance = initialBalance;
  return transactions.map((transaction, index) => {
    if (transaction.type === TransactionType.INCOME) {
      currentBalance += transaction.amount;
    } else {
      currentBalance -= transaction.amount;
    }
    return {
      ...transaction,
      id: index + 1,
      balance: currentBalance,
    };
  });
}

// 초기 잔액 (2025-09-27 이전)
const initialBalance2025 = 3000000;

// API 함수들
export const getTransactionsByYear = async (
  year: number
): Promise<FinanceSummary> => {
  // 더미 데이터를 Promise로 감싸서 반환 (실제 API 호출 시뮬레이션)
  return new Promise((resolve) => {
    setTimeout(() => {
      if (year === 2025) {
        const transactionsWithBalance = calculateBalances(
          dummyTransactions,
          initialBalance2025
        );
        const currentBalance =
          transactionsWithBalance[transactionsWithBalance.length - 1]
            ?.balance || initialBalance2025;

        resolve({
          year,
          currentBalance,
          transactions: transactionsWithBalance,
          monthlyAggregates: [
            {
              yearMonth: "20251019",
              totalIncome: 0,
              totalExpense: 0,
              balance: 0,
            },
          ],
        });
      } else {
        resolve({
          year,
          currentBalance: 0,
          transactions: [],
          monthlyAggregates: [],
        });
      }
    }, 300); // 300ms 지연으로 로딩 상태 시뮬레이션
  });
};

export const FinanceApi = {
  getTransactionsByYear,
};
