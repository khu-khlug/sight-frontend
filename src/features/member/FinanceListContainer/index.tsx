import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Box, Center, Spinner, VStack } from "@chakra-ui/react";

import Container from "../../../components/Container";
import Callout from "../../../components/Callout";
import PageNavigator from "../../../components/PageNavigator";

import { FinanceApi } from "../../../api/manage/finance";
import { extractErrorMessage } from "../../../util/extractErrorMessage";
import { useIsManager } from "../../../hooks/user/useIsManager";
import TransactionItem from "./TransactionItem";
import FinanceHeader from "./FinanceHeader";

const LIMIT = 20;

const FinanceListContainer = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const queryClient = useQueryClient();
  const { isManager } = useIsManager();

  const {
    status: queryStatus,
    data,
    error,
  } = useQuery({
    queryKey: ["finance", selectedYear, currentPage],
    queryFn: () => {
      const offset = (currentPage - 1) * LIMIT;
      return FinanceApi.getTransactions(selectedYear, offset, LIMIT);
    },
    retry: 0,
  });

  const { mutate: deleteMutation } = useMutation({
    mutationFn: FinanceApi.deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      toast.success("장부 내역이 삭제되었습니다.");
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });

  // 연도 변경 시 페이지를 1로 리셋
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setCurrentPage(1);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("정말 이 장부 내역을 삭제하시겠습니까?")) {
      deleteMutation(id);
    }
  };

  // 서버 사이드 페이지네이션
  const transactions = data?.transactions || [];
  const totalCount = data?.count || 0;

  return (
    <Container>
      <FinanceHeader
        selectedYear={selectedYear}
        onYearChange={handleYearChange}
      />

      {(() => {
        switch (queryStatus) {
          case "pending":
            return (
              <Center py={10}>
                <Spinner size="xl" color="blue.500" />
              </Center>
            );
          case "error":
            return <Callout type="error">{extractErrorMessage(error)}</Callout>;
          case "success":
            return (
              <>
                <VStack gap={4} align="stretch" mb={6}>
                  {transactions.map((transaction) => (
                    <TransactionItem
                      key={transaction.id}
                      transaction={transaction}
                      onDelete={isManager ? handleDelete : undefined}
                    />
                  ))}
                </VStack>
                <Box>
                  <PageNavigator
                    currentPage={currentPage}
                    countPerPage={LIMIT}
                    totalCount={totalCount}
                    onPageChange={setCurrentPage}
                  />
                </Box>
              </>
            );
        }
      })()}
    </Container>
  );
};

export default FinanceListContainer;
