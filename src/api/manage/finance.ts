import apiClient from "../client/v2";

// ===== 백엔드 API 타입 =====

type BackendTransactionType = "INCOME" | "EXPENSE";

type BackendTransaction = {
  id: string;
  author: number;
  item: string | null;
  price: number;
  quantity: number;
  total: number;
  place: string | null;
  note: string | null;
  usedAt: string; // ISO 8601 date (YYYY-MM-DD)
  createdAt: string;
  updatedAt: string;
};

type GetTransactionsResponse = {
  count: number;
  transactions: BackendTransaction[];
};

type CreateTransactionRequest = {
  type: BackendTransactionType;
  item: string | null;
  price: number;
  quantity: number;
  place: string | null;
  note: string | null;
  usedAt: string; // ISO 8601 date (YYYY-MM-DD)
};

type CreateTransactionResponse = BackendTransaction;

// ===== 프론트엔드 타입 =====

export const TransactionType = {
  INCOME: "income",
  EXPENSE: "expense",
} as const;
export type TransactionType =
  (typeof TransactionType)[keyof typeof TransactionType];

export type Transaction = {
  id: string;
  date: string; // YYYY-MM-DD 형식
  type: TransactionType;
  description: string; // 항목
  unitPrice: number; // 단가
  quantity: number; // 수량
  amount: number; // 금액 (unitPrice * quantity)
  place: string; // 사용/수급처
  note: string; // 비고
};

// ===== 타입 변환 함수 =====

/**
 * 백엔드 거래 데이터를 프론트엔드 형식으로 변환
 */
function mapBackendToFrontend(backend: BackendTransaction): Transaction {
  return {
    id: backend.id,
    date: backend.usedAt,
    type: backend.total >= 0 ? TransactionType.INCOME : TransactionType.EXPENSE,
    description: backend.item || "",
    unitPrice: backend.price,
    quantity: backend.quantity,
    amount: Math.abs(backend.total),
    place: backend.place || "",
    note: backend.note || "",
  };
}

/**
 * 프론트엔드 TransactionType을 백엔드 형식으로 변환
 */
function mapFrontendTypeToBackend(
  type: TransactionType
): BackendTransactionType {
  return type === TransactionType.INCOME ? "INCOME" : "EXPENSE";
}

// ===== API 함수 =====

/**
 * 특정 연도의 거래 내역을 조회합니다.
 * @param year 조회할 연도
 * @param offset 페이지 오프셋 (기본값: 0)
 * @param limit 페이지 크기 (기본값: 20)
 */
const getTransactions = async (
  year: number,
  offset: number = 0,
  limit: number = 20
): Promise<{ count: number; transactions: Transaction[] }> => {
  const response = await apiClient.get<GetTransactionsResponse>(
    "/transactions",
    {
      params: { year, offset, limit },
    }
  );

  return {
    count: response.data.count,
    transactions: response.data.transactions.map(mapBackendToFrontend),
  };
};

/**
 * 새로운 거래 내역을 생성합니다.
 * @param data 생성할 거래 데이터
 */
const createTransaction = async (
  data: Omit<Transaction, "id"> & { type: TransactionType }
): Promise<Transaction> => {
  const request: CreateTransactionRequest = {
    type: mapFrontendTypeToBackend(data.type),
    item: data.description || null,
    price: data.unitPrice,
    quantity: data.quantity,
    place: data.place || null,
    note: data.note || null,
    usedAt: data.date,
  };

  const response = await apiClient.post<CreateTransactionResponse>(
    "/transactions",
    request
  );

  return mapBackendToFrontend(response.data);
};

/**
 * 특정 거래 내역을 삭제합니다.
 * @param id 삭제할 거래의 ID
 */
const deleteTransaction = async (id: string): Promise<void> => {
  await apiClient.delete(`/transactions/${id}`);
};

export const FinanceApi = {
  getTransactions,
  createTransaction,
  deleteTransaction,
};
