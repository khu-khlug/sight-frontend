import apiV2Client from "../client/v2";

// DTOs

export type BookStatsDto = {
  totalBooks: number;
  totalItems: number;
  currentBorrows: number;
};

export type CurrentBorrowRecordDto = {
  recordId: string;
  itemId: string;
  bookId: string;
  title: string;
  borrowerID: string;
  borrowerName: string;
  borrowedAt: string;
};

export type CurrentBorrowListResponseDto = {
  records: CurrentBorrowRecordDto[];
};

export type BorrowRecordDto = {
  recordId: string;
  itemId: string;
  bookId: string;
  title: string;
  borrowerID: string;
  borrowerName: string;
  borrowedAt: string;
  returnedAt: string | null;
};

export type BorrowRecordListResponseDto = {
  records: BorrowRecordDto[];
};

// API functions

/** 도서 통계 조회 */
const getStats = async (): Promise<BookStatsDto> => {
  const response = await apiV2Client.get<BookStatsDto>("/manage/book/stats");
  return response.data;
};

/** 도서 삭제 (book + items + borrow records) */
const deleteBook = async (bookId: string): Promise<void> => {
  await apiV2Client.delete(`/book/${bookId}`);
};

/** 도서 등록 (isbn으로 정보 자동입력) */
const registerBook = async (isbn: string): Promise<{ bookId: string }> => {
  const response = await apiV2Client.post<{ bookId: string }>("/book", null, {
    params: { isbn },
  });
  return response.data;
};

/** 도서 항목 삭제 (item 개수가 0이면 book도 삭제) */
const deleteBookItem = async (itemId: string): Promise<void> => {
  await apiV2Client.delete(`/book/${itemId}`);
};

/** 현재 대여 목록 조회 */
const listCurrentBorrows =
  async (): Promise<CurrentBorrowListResponseDto> => {
    const response = await apiV2Client.get<CurrentBorrowListResponseDto>(
      "/book/borrow"
    );
    return response.data;
  };

/** 전체 대여 기록 조회 */
const listBorrowRecords = async (): Promise<BorrowRecordListResponseDto> => {
  const response = await apiV2Client.get<BorrowRecordListResponseDto>(
    "/book/borrow-record"
  );
  return response.data;
};

export const BookManageApi = {
  getStats,
  registerBook,
  deleteBook,
  deleteBookItem,
  listCurrentBorrows,
  listBorrowRecords,
};
