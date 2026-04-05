import { isAxiosError } from "axios";
import apiV2Client from "../client/v2";

// DTOs

export type BookStatsDto = {
  totalBookCount: number;
  totalItemCount: number;
  currentBorrowingCount: number;
};

export type CurrentBorrowRecordDto = {
  recordId: string;
  itemId: string;
  bookId: string;
  title: string;
  borrowerUserId: number;
  borrowerUserName: string;
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
  borrowerUserId: number;
  borrowerUserName: string;
  borrowedAt: string;
  returnedAt: string | null;
};

export type BorrowRecordListResponseDto = {
  records: BorrowRecordDto[];
};

// API functions

/** 도서 통계 조회 */
const getStats = async (): Promise<BookStatsDto> => {
  const response = await apiV2Client.get<BookStatsDto>("/book/stats");
  return response.data;
};

/** 도서 권 삭제 (item 개수가 0이면 book도 삭제) */
const deleteBook = async (bookId: string): Promise<void> => {
  await apiV2Client.delete(`/book/${bookId}`);
};

/** 도서 등록 (isbn으로 정보 자동입력) */
const registerBook = async (isbn: string): Promise<{ bookId: string }> => {
  const response = await apiV2Client.post<{ bookId: string }>("/book/register", null, {
    params: { isbn },
  });
  return response.data;
};

/** 현재 대여 목록 조회 */
const listCurrentBorrows =
  async (): Promise<CurrentBorrowListResponseDto> => {
    const response = await apiV2Client.get<CurrentBorrowListResponseDto>(
      "/book/borrowings"
    );
    return response.data;
  };

/** 전체 대여 기록 조회 */
const listBorrowRecords = async (): Promise<BorrowRecordListResponseDto> => {
  const response = await apiV2Client.get<BorrowRecordListResponseDto>(
    "/book/borrow-history"
  );
  return response.data;
};

export type BookPreviewDto = {
  title: string;
  author: string;
  coverImageUrl: string;
  publisher: string;
  publishedYear: number;
  description: string;
};

/** 등록 전 미리보기 (DB 저장 없이 외부 API 조회) */
const getBookPreviewByIsbn = async (isbn: string): Promise<BookPreviewDto | null> => {
  try {
    const response = await apiV2Client.get<BookPreviewDto>("/book/preview", { params: { isbn } });
    return response.data;
  } catch (e) {
    if (isAxiosError(e) && e.response?.status === 404) {
      return null;
    }
    throw e;
  }
};

export const BookManageApi = {
  getStats,
  registerBook,
  deleteBook,
  listCurrentBorrows,
  listBorrowRecords,
  getBookPreviewByIsbn,
};
