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
  borrowerUserId: number;
  borrowerUserName: string;
  borrowedAt: string;
};

export type BookItemDto = {
  itemId: string;
  registeredAt: string;
  borrowerInfo: BorrowerInfoDto | null;
};

export type BookDetailDto = {
  bookId: string;
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

/** isbn으로 도서 상세 조회 (스캔 후 bookId를 모르는 상황에서 사용) */
const getBookByIsbn = async (isbn: string): Promise<BookDetailDto | null> => {
  try {
    const response = await apiV2Client.get<BookDetailDto>("/book", { params: { isbn } });
    return response.data;
  } catch (e) {
    if (isAxiosError(e) && e.response?.status === 404) {
      return null;
    }
    throw e;
  }
};

/** 도서 대여 */
const borrowBook = async (bookId: string): Promise<void> => {
  await apiV2Client.post(`/book/${bookId}/borrow`);
};

/** 도서 반납 */
const returnBook = async (bookId: string): Promise<void> => {
  await apiV2Client.post(`/book/${bookId}/return`);
};

/** 내 대출 현황 조회 */
const getMyBorrowing = async (): Promise<MyBorrowingResponseDto> => {
  const response =
    await apiV2Client.get<MyBorrowingResponseDto>("/book/borrowings/@me");
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

export const BookPublicApi = {
  listBooks,
  getBook,
  getBookByIsbn,
  getBookPreviewByIsbn,
  borrowBook,
  returnBook,
  getMyBorrowing,
};
