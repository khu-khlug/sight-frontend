import apiClient from "../client/v2";

type GetCurrentCumulativeResponse = {
  cumulative: number;
};

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

const getCurrentCumulative = async (): Promise<number> => {
  const response = await apiClient.get<GetCurrentCumulativeResponse>(
    "/current-cumulative"
  );
  return response.data.cumulative;
};

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

const createTransaction = async (
  data: CreateTransactionRequest
): Promise<CreateTransactionResponse> => {
  const response = await apiClient.post<CreateTransactionResponse>(
    "/transactions",
    data
  );

  return response.data;
};

const deleteTransaction = async (id: string): Promise<void> => {
  await apiClient.delete(`/transactions/${id}`);
};

export const FinanceApi = {
  getCurrentCumulative,
  getTransactions,
  createTransaction,
  deleteTransaction,
};
