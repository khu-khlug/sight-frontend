import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flex, Text, Button } from "@chakra-ui/react";
import { toast } from "react-toastify";

import Callout from "../../../components/Callout";
import BarcodeScanner, { ScanResult } from "../../../components/BarcodeScanner";
import BookScanLayout from "../BookScanLayout";
import { BookPublicApi, BookDetailDto } from "../../../api/public/book";
import { BookManageApi } from "../../../api/manage/book";
import { extractErrorMessage } from "../../../util/extractErrorMessage";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; isbn: string; book: BookDetailDto }
  | { status: "ready-unknown"; isbn: string }
  | { status: "registering"; isbn: string; book?: BookDetailDto }
  | { status: "error"; message: string; isbn?: string; book?: BookDetailDto };

export default function BookRegisterScanContainer() {
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ status: "idle" });

  const handleScan = async (result: ScanResult) => {
    if (!result.data) {
      setState({ status: "error", message: "바코드를 인식하지 못했습니다." });
      return;
    }

    const isbn = result.data;
    setState({ status: "loading" });
    try {
      const book = await BookPublicApi.getBook(isbn);
      if (book) {
        setState({ status: "ready", isbn, book });
      } else {
        setState({ status: "ready-unknown", isbn });
      }
    } catch (e) {
      setState({ status: "error", message: extractErrorMessage(e as Error) });
    }
  };

  const handleConfirm = async () => {
    const isbn = state.status === "ready" || state.status === "ready-unknown" ? state.isbn : undefined;
    const book = state.status === "ready" ? state.book : undefined;
    if (!isbn) return;

    setState({ status: "registering", isbn, book });
    try {
      const { bookId } = await BookManageApi.registerBook(isbn);
      toast.success("도서가 등록되었습니다.");
      navigate(`/book/${bookId}`);
    } catch (e) {
      setState({ status: "error", message: extractErrorMessage(e as Error), isbn, book });
    }
  };

  const handleRescan = () => setState({ status: "idle" });

  const book =
    state.status === "ready" || state.status === "registering"
      ? state.book
      : undefined;

  const scanSection = (() => {
    if (state.status === "idle") {
      return <BarcodeScanner onScan={handleScan} />;
    }

    if (state.status === "loading") {
      return (
        <Text color="gray.500" py={4} textAlign="center">책 정보를 불러오는 중...</Text>
      );
    }

    if (state.status === "error") {
      return (
        <>
          <Callout type="error">{state.message}</Callout>
          <Button mt={3} w="full" variant="outline" onClick={handleRescan}>
            다시 스캔
          </Button>
        </>
      );
    }

    const isRegistering = state.status === "registering";

    return (
      <>
        <Text fontSize="md">이 책이 맞습니까?</Text>
        {state.status === "ready" && (
          <Text fontSize="sm" color="gray.500" mb={3}>이 책은 현재 {state.book.totalCount}권 보유중입니다.</Text>
        )}
        {state.status === "ready-unknown" && (
          <Text fontSize="sm" color="gray.500" mb={3}>ISBN: {state.isbn}</Text>
        )}
        <Flex gap={2}>
          <Button flex={1} variant="outline" onClick={handleRescan} disabled={isRegistering}>
            다시 스캔
          </Button>
          <Button flex={1} colorScheme="blue" onClick={handleConfirm} loading={isRegistering}>
            등록하기
          </Button>
        </Flex>
      </>
    );
  })();

  return (
    <BookScanLayout title="도서 등록" scanSection={scanSection} book={book ?? null} />
  );
}
