import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Flex,
  Text,
  Heading,
  Grid,
  Dialog,
  Portal,
} from "@chakra-ui/react";
import Button from "../../../components/Button";
import Container from "../../../components/Container";
import Callout from "../../../components/Callout";
import { BookManageApi } from "../../../api/manage/book";
import { BookPublicApi } from "../../../api/public/book";
import { extractErrorMessage } from "../../../util/extractErrorMessage";

type ActiveMode = "delete" | "history" | null;

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Box borderWidth={1} borderRadius="md" p={4} textAlign="center">
      <Text fontSize="2xl" fontWeight="bold">
        {value}
      </Text>
      <Text fontSize="sm" color="gray.500" mt={1}>
        {label}
      </Text>
    </Box>
  );
}

export default function BookManageContainer() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeMode, setActiveMode] = useState<ActiveMode>(null);
  const [confirmBook, setConfirmBook] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const toggle = (mode: "delete" | "history") => {
    setActiveMode((v) => (v === mode ? null : mode));
  };

  const { data: stats } = useQuery({
    queryKey: ["book-stats"],
    queryFn: BookManageApi.getStats,
  });

  const {
    data: borrows,
    isLoading: borrowsLoading,
    error: borrowsError,
  } = useQuery({
    queryKey: ["book-current-borrows"],
    queryFn: BookManageApi.listCurrentBorrows,
    enabled: activeMode === null,
  });

  const {
    data: bookList,
    isLoading: bookListLoading,
    error: bookListError,
  } = useQuery({
    queryKey: ["books"],
    queryFn: BookPublicApi.listBooks,
    enabled: activeMode === "delete",
  });

  const {
    data: allRecords,
    isLoading: allRecordsLoading,
    error: allRecordsError,
  } = useQuery({
    queryKey: ["book-all-records"],
    queryFn: BookManageApi.listBorrowRecords,
    enabled: activeMode === "history",
  });

  const deleteMutation = useMutation({
    mutationFn: BookManageApi.deleteBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["book-stats"] });
      queryClient.invalidateQueries({ queryKey: ["book-current-borrows"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });

  return (
    <>
      <Container>
        <Heading size="xl" mb={4}>
          도서 관리
        </Heading>

        {stats && (
          <Grid templateColumns="repeat(3, 1fr)" gap={3} mb={6}>
            <StatCard label="총 도서 종류" value={stats.totalBookCount} />
            <StatCard label="총 권수" value={stats.totalItemCount} />
            <StatCard
              label="현재 대출 중"
              value={stats.currentBorrowingCount}
            />
          </Grid>
        )}

        <Flex gap={2}>
          <Button
            colorScheme="blue"
            onClick={() => navigate("/book/scan?action=register")}
          >
            ISBN 스캔으로 등록
          </Button>
          <Button
            variant={activeMode === "delete" ? "danger" : "danger-outline"}
            onClick={() => toggle("delete")}
          >
            도서 삭제
          </Button>
          <Button
            variant={activeMode === "history" ? "dark" : "dark-outline"}
            onClick={() => toggle("history")}
          >
            전체 대출 기록
          </Button>
        </Flex>
      </Container>

      {activeMode === null && (
        <Container>
          <Heading size="xl" mb={4}>
            현재 대출 현황
          </Heading>
          {borrowsLoading && <Text color="gray.500">불러오는 중...</Text>}
          {borrowsError && (
            <Callout type="error">{extractErrorMessage(borrowsError)}</Callout>
          )}
          {borrows && borrows.records.length === 0 && (
            <Callout type="info">현재 대출 중인 도서가 없습니다.</Callout>
          )}
          {borrows && borrows.records.length > 0 && (
            <Box overflowX="auto">
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "14px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "2px solid #e2e8f0",
                      textAlign: "left",
                    }}
                  >
                    <th style={{ padding: "8px" }}>도서명</th>
                    <th style={{ padding: "8px" }}>대출자</th>
                    <th style={{ padding: "8px" }}>대출일</th>
                  </tr>
                </thead>
                <tbody>
                  {borrows.records.map((r) => (
                    <tr
                      key={r.recordId}
                      style={{ borderBottom: "1px solid #f0f0f0" }}
                    >
                      <td style={{ padding: "8px" }}>
                        <span
                          style={{ cursor: "pointer" }}
                          onClick={() => navigate(`/book/${r.bookId}`)}
                        >
                          {r.title}
                        </span>
                      </td>
                      <td style={{ padding: "8px" }}>{r.borrowerName}</td>
                      <td style={{ padding: "8px" }}>
                        {r.borrowedAt.slice(0, 10)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          )}
        </Container>
      )}

      {activeMode === "delete" && (
        <Container>
          <Heading size="xl" mb={4}>
            도서 삭제
          </Heading>
          {bookListLoading && <Text color="gray.500">불러오는 중...</Text>}
          {bookListError && (
            <Callout type="error">{extractErrorMessage(bookListError)}</Callout>
          )}
          {bookList && bookList.bookList.length === 0 && (
            <Callout type="info">등록된 도서가 없습니다.</Callout>
          )}
          {bookList && bookList.bookList.length > 0 && (
            <Box overflowX="auto">
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "14px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "2px solid #e2e8f0",
                      textAlign: "left",
                    }}
                  >
                    <th style={{ padding: "8px" }}>도서명</th>
                    <th style={{ padding: "8px", textAlign: "center" }}>
                      총 권수
                    </th>
                    <th style={{ padding: "8px", textAlign: "center" }}>
                      대출 중
                    </th>
                    <th style={{ padding: "8px" }} />
                  </tr>
                </thead>
                <tbody>
                  {bookList.bookList.map((book) => {
                    const borrowedCount = book.totalCount - book.availableCount;
                    const canDelete = book.availableCount > 0;
                    return (
                      <tr
                        key={book.bookId}
                        style={{ borderBottom: "1px solid #f0f0f0" }}
                      >
                        <td style={{ padding: "8px" }}>
                          <span
                            style={{ cursor: "pointer" }}
                            onClick={() => navigate(`/book/${book.bookId}`)}
                          >
                            {book.title}
                          </span>
                        </td>
                        <td style={{ padding: "8px", textAlign: "center" }}>
                          {book.totalCount}
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            textAlign: "center",
                            color: borrowedCount > 0 ? "#e53e3e" : "#718096",
                          }}
                        >
                          {borrowedCount}
                        </td>
                        <td style={{ padding: "8px" }}>
                          <Button
                            size="xs"
                            variant={canDelete ? "danger" : "danger-outline"}
                            disabled={!canDelete}
                            onClick={() =>
                              canDelete &&
                              setConfirmBook({
                                id: book.bookId,
                                title: book.title,
                              })
                            }
                          >
                            삭제
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Box>
          )}
        </Container>
      )}

      {activeMode === "history" && (
        <Container>
          <Heading size="xl" mb={4}>
            전체 대출 기록
          </Heading>
          {allRecordsLoading && <Text color="gray.500">불러오는 중...</Text>}
          {allRecordsError && (
            <Callout type="error">
              {extractErrorMessage(allRecordsError)}
            </Callout>
          )}
          {allRecords && allRecords.records.length === 0 && (
            <Callout type="info">대출 기록이 없습니다.</Callout>
          )}
          {allRecords && allRecords.records.length > 0 && (
            <Box overflowX="auto">
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "14px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "2px solid #e2e8f0",
                      textAlign: "left",
                    }}
                  >
                    <th style={{ padding: "8px" }}>도서명</th>
                    <th style={{ padding: "8px" }}>대출자</th>
                    <th style={{ padding: "8px" }}>대출일</th>
                    <th style={{ padding: "8px" }}>반납일</th>
                  </tr>
                </thead>
                <tbody>
                  {allRecords.records.map((r) => (
                    <tr
                      key={r.recordId}
                      style={{ borderBottom: "1px solid #f0f0f0" }}
                    >
                      <td style={{ padding: "8px" }}>
                        <span
                          style={{ cursor: "pointer" }}
                          onClick={() => navigate(`/book/${r.bookId}`)}
                        >
                          {r.title}
                        </span>
                      </td>
                      <td style={{ padding: "8px" }}>{r.borrowerName}</td>
                      <td style={{ padding: "8px" }}>
                        {r.borrowedAt.slice(0, 10)}
                      </td>
                      <td
                        style={{
                          padding: "8px",
                          color: r.returnedAt ? "#718096" : "inherit",
                        }}
                      >
                        {r.returnedAt ? r.returnedAt.slice(0, 10) : "대출 중"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          )}
        </Container>
      )}

      <Dialog.Root
        open={!!confirmBook}
        onOpenChange={(e) => {
          if (!e.open) setConfirmBook(null);
        }}
        role="alertdialog"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>도서 삭제</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text>
                  <Text as="span" fontWeight="bold">
                    "{confirmBook?.title}"
                  </Text>{" "}
                  1 권을 삭제할까요?
                </Text>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  이 작업은 되돌릴 수 없습니다.
                </Text>
              </Dialog.Body>
              <Dialog.Footer>
                <Button variant="neutral" onClick={() => setConfirmBook(null)}>
                  취소
                </Button>
                <Button
                  variant="danger"
                  loading={deleteMutation.isPending}
                  onClick={() => {
                    if (!confirmBook) return;
                    deleteMutation.mutate(confirmBook.id, {
                      onSuccess: () => setConfirmBook(null),
                    });
                  }}
                >
                  삭제
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
