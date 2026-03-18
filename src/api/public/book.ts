import { isAxiosError } from "axios";
import apiV2Client from "../client/v2";

// DTOs

export type BookListItemDto = {
  bookId: string;
  title: string;
  coverImageUrl: string;
  author: string;
  publisher: string;
  publishedYear: number;
  totalCount: number;
  availableCount: number;
};

export type BookListResponseDto = {
  bookList: BookListItemDto[];
};

export type BorrowerInfoDto = {
  borrowerID: number;
  borrowerName: string;
  borrowedAt: string;
};

export type BookItemDto = {
  itemId: string;
  registeredAt: string;
  borrowerInfo: BorrowerInfoDto | null;
};

export type BookDetailDto = {
  bookID: string;
  title: string;
  coverImageUrl: string;
  author: string;
  publisher: string;
  publishedYear: string;
  totalCount: number;
  availableCount: number;
  isbn: string;
  description: string;
  itemList: BookItemDto[];
};

export type MyBorrowingItemDto = {
  bookId: string;
  itemId: string;
  title: string;
  borrowedAt: string;
};

export type MyBorrowingResponseDto = {
  currentBorrowings: MyBorrowingItemDto[];
};

// API functions

/** 도서 전체 목록 조회 (필터/정렬/페이지네이션은 클라이언트에서 처리) */
const listBooks = async (): Promise<BookListResponseDto> => {
  const response = await apiV2Client.get<BookListResponseDto>("/book");
  return response.data;
};

/** 특정 도서 상세 조회 */
const getBook = async (bookId: string): Promise<BookDetailDto | null> => {
  try {
    const response = await apiV2Client.get<BookDetailDto>(`/book/${bookId}`);
    return response.data;
  } catch (e) {
    if (isAxiosError(e) && e.response?.status === 404) {
      return null;
    }
    throw e;
  }
};

/** 도서 대여 (isbn으로 요청, 백엔드에서 가용 item 자동 선택) */
const borrowBook = async (isbn: string): Promise<void> => {
  await apiV2Client.patch(`/book/borrow/${isbn}`);
};

/** 도서 반납 (isbn으로 요청) */
const returnBook = async (isbn: string): Promise<void> => {
  await apiV2Client.patch(`/book/return/${isbn}`);
};

/** 내 대출 현황 조회 */
const getMyBorrowing = async (): Promise<MyBorrowingResponseDto> => {
  const response =
    await apiV2Client.get<MyBorrowingResponseDto>("/book/@me");
  return response.data;
};

export const BookPublicApi = {
  listBooks,
  getBook,
  borrowBook,
  returnBook,
  getMyBorrowing,
};
