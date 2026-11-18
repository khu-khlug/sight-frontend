import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flex, Text, Button, Select, Portal, createListCollection } from "@chakra-ui/react";
import { toast } from "react-toastify";

import Callout from "../../../components/Callout";
import BarcodeScanner, { ScanResult } from "../../../components/BarcodeScanner";
import BookScanLayout from "../../book/BookScanLayout";
import { BookPublicApi, BookDetailDto } from "../../../api/public/book";
import { BookManageApi, BookPreviewDto } from "../../../api/manage/book";
import { extractErrorMessage } from "../../../util/extractErrorMessage";
import { BookCategory, BookCategoryLabel } from "../../../constant";

const categoryOptions = createListCollection({
  items: Object.values(BookCategory).map((category) => ({
    label: BookCategoryLabel[category],
    value: category,
  })),
});

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; isbn: string; book: BookDetailDto }
  | { status: "ready-unknown"; isbn: string; preview: BookPreviewDto | null }
  | { status: "registering"; isbn: string; book?: BookDetailDto; preview?: BookPreviewDto | null }
  | { status: "error"; message: string; isbn?: string; book?: BookDetailDto };

export default function BookRegisterScanContainer() {
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ status: "idle" });
  const [selectedCategory, setSelectedCategory] = useState<BookCategory | "">("");

  const handleScan = async (result: ScanResult) => {
    if (!result.data) {
      setState({ status: "error", message: "바코드를 인식하지 못했습니다." });
      return;
    }

    setSelectedCategory("");
    const isbn = result.data;
    setState({ status: "loading" });
    try {
      const book = await BookPublicApi.getBookByIsbn(isbn);
      if (book) {
        setSelectedCategory(book.category);
        setState({ status: "ready", isbn, book });
      } else {
        const preview = await BookManageApi.getBookPreviewByIsbn(isbn);
        setState({ status: "ready-unknown", isbn, preview });
      }
    } catch (e) {
      setState({ status: "error", message: extractErrorMessage(e as Error) });
    }
  };

  const handleConfirm = async () => {
    const isbn = state.status === "ready" || state.status === "ready-unknown" ? state.isbn : undefined;
    const book = state.status === "ready" ? state.book : undefined;
    const preview = state.status === "ready-unknown" ? state.preview : undefined;
    if (!isbn) return;

    // isbn이 이미 DB에 있는 도서(book이 있음)면 category를 보내지 않는다 — 새 도서일 때만 필요.
    const category = book ? undefined : (selectedCategory as BookCategory);

    setState({ status: "registering", isbn, book, preview });
    try {
      const { bookId } = await BookManageApi.registerBook(isbn, category);
      toast.success("도서가 등록되었습니다.", { autoClose: 1000, hideProgressBar: true });
      navigate(`/book/${bookId}`);
    } catch (e) {
      setState({ status: "error", message: extractErrorMessage(e as Error), isbn, book });
    }
  };

  const handleRescan = () => {
    setSelectedCategory("");
    setState({ status: "idle" });
  };

  const bookForCard =
    state.status === "ready" ? state.book
    : state.status === "ready-unknown" ? (state.preview ?? undefined)
    : state.status === "registering" ? (state.book ?? state.preview ?? undefined)
    : undefined;

  const scanSection = (() => {
    if (state.status === "idle") {
      return (
        <>
          <BarcodeScanner onScan={handleScan} />
          {/* 바코드 없이 테스트하기 위한 임시 우회 버튼 — 테스트 끝나면 제거 */}
          <Button
            mt={2}
            w="full"
            size="sm"
            variant="ghost"
            onClick={() => handleScan({ type: "TEST", data: "9788966260959" })}
          >
            (테스트) 스캔 건너뛰기
          </Button>
        </>
      );
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
    const isExisting = state.status === "ready";
    const categoryMissing = !isExisting && !selectedCategory;

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
          <Select.Root
            flex={1}
            size="sm"
            collection={categoryOptions}
            value={selectedCategory ? [selectedCategory] : []}
            disabled={isExisting}
            onValueChange={(e) => setSelectedCategory((e.value[0] as BookCategory) ?? "")}
          >
            <Select.Trigger borderRadius="md">
              <Select.ValueText placeholder="카테고리 선택">
                {selectedCategory ? `카테고리: ${BookCategoryLabel[selectedCategory]}` : undefined}
              </Select.ValueText>
            </Select.Trigger>
            <Portal>
              <Select.Positioner>
                <Select.Content>
                  {categoryOptions.items.map((item) => (
                    <Select.Item key={item.value} item={item}>
                      {item.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>
          <Button
            flex={1}
            colorScheme="blue"
            onClick={handleConfirm}
            loading={isRegistering}
            disabled={categoryMissing}
          >
            등록하기
          </Button>
        </Flex>
      </>
    );
  })();

  return (
    <BookScanLayout title="도서 등록" scanSection={scanSection} book={bookForCard ?? null} />
  );
}
