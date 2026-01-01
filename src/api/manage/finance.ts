import apiClient from "../client/v2";

// ===== API 타입 (DTO) =====

export type TransactionType = "INCOME" | "EXPENSE";

export type Transaction = {
  id: string;
  author: number;
  type: TransactionType;
  item: string;
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
  transactions: Transaction[];
};

type CreateTransactionRequest = {
  type: TransactionType;
  item: string;
  price: number;
  quantity: number;
  place: string | null;
  note: string | null;
  usedAt: string; // ISO 8601 date (YYYY-MM-DD)
};

type CreateTransactionResponse = {
  id: string;
  author: number;
  item: string | null;
  price: number;
  quantity: number;
  total: number;
  place: string | null;
  note: string | null;
  usedAt: string;
  createdAt: string;
};

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

  return response.data;
};

/**
 * 새로운 거래 내역을 생성합니다.
 * @param data 생성할 거래 데이터
 */
const createTransaction = async (
  data: CreateTransactionRequest
): Promise<CreateTransactionResponse> => {
  const response = await apiClient.post<CreateTransactionResponse>(
    "/transactions",
    data
  );

  return response.data;
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
