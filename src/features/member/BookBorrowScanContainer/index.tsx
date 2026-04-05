import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Flex, Text, Button } from "@chakra-ui/react";
import { toast } from "react-toastify";

import Callout from "../../../components/Callout";
import BarcodeScanner, { ScanResult } from "../../../components/BarcodeScanner";
import BookScanLayout from "../../book/BookScanLayout";
import { BookPublicApi, BookDetailDto } from "../../../api/public/book";
import { extractErrorMessage } from "../../../util/extractErrorMessage";

type Action = "borrow" | "return";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "loaded"; book: BookDetailDto }
  | { status: "error"; message: string; presetBook?: BookDetailDto }
  | { status: "acting"; book: BookDetailDto }
  | { status: "preset-loading" }
  | { status: "preset-ready"; book: BookDetailDto }
  | { status: "preset-mismatch"; book: BookDetailDto };

type Props = {
  action: Action;
  presetBookId?: string;
};

const LABELS: Record<Action, { title: string; button: string }> = {
  borrow: { title: "도서 대출", button: "대출하기" },
  return: { title: "도서 반납", button: "반납하기" },
};

export default function BookBorrowScanContainer({ action, presetBookId }: Props) {
  const navigate = useNavigate();
  const [state, setState] = useState<State>(
    presetBookId ? { status: "preset-loading" } : { status: "idle" },
  );

  useEffect(() => {
    setState(presetBookId ? { status: "preset-loading" } : { status: "idle" });
  }, [action, presetBookId]);

  useEffect(() => {
    if (!presetBookId) return;
    let cancelled = false;
    BookPublicApi.getBook(presetBookId)
      .then((book) => {
        if (cancelled) return;
        if (!book) {
          setState({ status: "error", message: "등록되지 않은 도서입니다." });
          return;
        }
        setState({ status: "preset-ready", book });
      })
      .catch((e) => {
        if (cancelled) return;
        setState({ status: "error", message: extractErrorMessage(e as Error) });
      });
    return () => {
      cancelled = true;
    };
  }, [presetBookId]);

  const doAction = async (book: BookDetailDto) => {
    setState({ status: "acting", book });
    try {
      if (action === "borrow") {
        await BookPublicApi.borrowBook(book.bookId);
        toast.success("대출되었습니다.", { autoClose: 1000, hideProgressBar: true });
      } else {
        await BookPublicApi.returnBook(book.bookId);
        toast.success("반납되었습니다.", { autoClose: 1000, hideProgressBar: true });
      }
      navigate("/book/my");
    } catch (e) {
      setState({ status: "error", message: extractErrorMessage(e as Error), presetBook: presetBookId ? book : undefined });
    }
  };

  const handleScan = async (result: ScanResult) => {
    if (!result.data) {
      const presetBook =
        state.status === "preset-ready" || state.status === "preset-mismatch"
          ? state.book
          : undefined;
      setState({ status: "error", message: "바코드를 인식하지 못했습니다.", presetBook });
      return;
    }

    // 프리셋 모드: 스캔한 ISBN이 프리셋 책과 일치하는지 확인
    if (state.status === "preset-ready" || state.status === "preset-mismatch") {
      const { book } = state;
      if (result.data !== book.isbn) {
        setState({ status: "preset-mismatch", book });
        return;
      }
      await doAction(book);
      return;
    }

    // 일반 모드: 스캔한 바코드로 책 정보 조회
    setState({ status: "loading" });
    try {
      const book = await BookPublicApi.getBookByIsbn(result.data);
      if (!book) {
        setState({ status: "error", message: "등록되지 않은 도서입니다." });
        return;
      }
      setState({ status: "loaded", book });
    } catch (e) {
      setState({ status: "error", message: extractErrorMessage(e as Error) });
    }
  };

  const handleConfirm = async () => {
    if (state.status !== "loaded") return;
    await doAction(state.book);
  };

  const handleRescan = () => {
    if (state.status === "preset-ready" || state.status === "preset-mismatch") {
      setState({ status: "preset-ready", book: state.book });
    } else if (state.status === "error" && state.presetBook) {
      setState({ status: "preset-ready", book: state.presetBook });
    } else {
      setState({ status: "idle" });
    }
  };

  const book =
    state.status === "loaded" ||
    state.status === "acting" ||
    state.status === "preset-ready" ||
    state.status === "preset-mismatch"
      ? state.book
      : null;

  const isActing = state.status === "acting";
  const { title, button } = LABELS[action];

  const scanSection = (() => {
    if (state.status === "idle") {
      return <BarcodeScanner onScan={handleScan} />;
    }

    if (state.status === "loading" || state.status === "preset-loading") {
      return (
        <Box
          w="full"
          aspectRatio="4/3"
          bg="gray.100"
          borderRadius="md"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Text color="gray.500">책 정보를 불러오는 중...</Text>
        </Box>
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

    if (state.status === "preset-ready" || state.status === "preset-mismatch") {
      return (
        <>
          {state.status === "preset-mismatch" && (
            <Callout type="error">다른 책입니다. 올바른 책을 스캔해주세요.</Callout>
          )}
          <Box mt={state.status === "preset-mismatch" ? 3 : 0}>
            <BarcodeScanner onScan={handleScan} />
          </Box>
        </>
      );
    }

    // loaded or acting
    const cannotBorrow = action === "borrow" && book && book.availableCount === 0;
    return (
      <>
        {cannotBorrow && (
          <Callout type="error">대출 가능한 권이 없습니다.</Callout>
        )}
        <Flex gap={2} mt={cannotBorrow ? 3 : 0}>
          <Button
            flex={1}
            variant="outline"
            onClick={handleRescan}
            disabled={isActing}
          >
            다시 스캔
          </Button>
          <Button
            flex={1}
            colorScheme="blue"
            onClick={handleConfirm}
            loading={isActing}
            disabled={!!cannotBorrow}
          >
            {button}
          </Button>
        </Flex>
      </>
    );
  })();

  return (
    <BookScanLayout title={title} scanSection={scanSection} book={book} />
  );
}
