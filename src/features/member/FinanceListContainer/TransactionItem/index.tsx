import dayjs from "dayjs";
import { Box, Flex, Text, Button } from "@chakra-ui/react";

import { Transaction } from "../../../../api/manage/finance";
import { formatCurrency } from "../../../../util/currency";

type Props = {
  transaction: Transaction;
  onDelete?: (id: string) => void;
};

export default function TransactionItem({ transaction, onDelete }: Props) {
  const isIncome = transaction.type === "INCOME";
  const typeLabel = isIncome ? "수입" : "지출";
  const badgeBg = isIncome ? "#5ba4d8" : "#c94d4d";

  return (
    <Flex align="flex-start" gap={4}>
      {/* 타입 배지 */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        w="60px"
        h="60px"
        fontWeight="bold"
        fontSize="0.9rem"
        color="white"
        bg={badgeBg}
        borderRadius="md"
        flexShrink={0}
      >
        {typeLabel}
      </Box>

      {/* 거래 카드 */}
      <Box flex={1} py={2}>
        <Flex justify="space-between" align="flex-start" gap={4}>
          {/* 좌측: 설명 */}
          <Box flex={1}>
            <Text fontSize="lg" fontWeight="semibold" color="gray.800" mb={2}>
              {transaction.item}
            </Text>
            <Text fontSize="sm" color="gray.500">
              {dayjs(transaction.usedAt).format("YYYY. MM. DD.")} |{" "}
              {transaction.place || ""}
            </Text>
          </Box>

          {/* 우측: 금액 */}
          <Box textAlign="right">
            <Text fontSize="xl" fontWeight="bold" color="gray.900">
              {formatCurrency(Math.abs(transaction.total))}
            </Text>
            {transaction.price > 0 && transaction.quantity > 0 && (
              <Text fontSize="sm" color="gray.500">
                {transaction.price.toLocaleString("ko-KR")} ×{" "}
                {transaction.quantity}
              </Text>
            )}
          </Box>
        </Flex>

        {/* 비고 */}
        {transaction.note && (
          <Box
            fontSize="sm"
            color="gray.700"
            p={2}
            bg="gray.50"
            borderRadius="md"
            mt={2}
          >
            비고: {transaction.note}
          </Box>
        )}

        {onDelete && (
          <Flex
            justify="flex-end"
            pt={2}
            mt={2}
            borderTop="1px solid"
            borderColor="gray.200"
          >
            <Button
              onClick={() => onDelete(transaction.id)}
              colorPalette="red"
              variant="subtle"
              size="sm"
            >
              삭제
            </Button>
          </Flex>
        )}
      </Box>
    </Flex>
  );
}
